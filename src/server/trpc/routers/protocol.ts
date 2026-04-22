import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { upsertProtocolSchema } from "@/lib/validators/meeting";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { notify, notifyMany } from "@/lib/notifications";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { parseProtocolHeaderConfig, MEETING_TYPE_LABELS } from "@/lib/protocol-header";

function fmtDate(d: Date) { return format(d, "d MMMM yyyy", { locale: sv }); }
function fmtTime(d: Date) { return format(d, "HH:mm"); }

const decisionMethodLabels: Record<string, string> = {
  ACCLAMATION: "acklamation",
  COUNTED: "votering (räknade röster)",
  ROLL_CALL: "votering (namnupprop)",
};

export const protocolRouter = router({
  // Generate protocol draft from meeting log data
  generate: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
        include: {
          agendaItems: {
            orderBy: { sortOrder: "asc" },
            include: {
              decisions: {
                orderBy: { decidedAt: "asc" },
                include: { recusals: true },
              },
            },
          },
          attendances: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          decisions: {
            orderBy: { decidedAt: "asc" },
            include: { recusals: true },
          },
          motions: {
            select: {
              id: true, title: true, proposal: true, status: true,
              boardResponse: true, boardRecommendation: true, resolution: true,
              author: { select: { firstName: true, lastName: true } },
              voteProposals: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      });
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });

      // Resolve role names
      const [chairperson, secretary] = await Promise.all([
        meeting.meetingChairpersonId
          ? ctx.db.user.findUnique({ where: { id: meeting.meetingChairpersonId }, select: { firstName: true, lastName: true } })
          : null,
        meeting.meetingSecretaryId
          ? ctx.db.user.findUnique({ where: { id: meeting.meetingSecretaryId }, select: { firstName: true, lastName: true } })
          : null,
      ]);
      const adjusterUsers = meeting.adjusters.length > 0
        ? await ctx.db.user.findMany({ where: { id: { in: meeting.adjusters } }, select: { firstName: true, lastName: true } })
        : [];

      // Motioner som styrelsen behandlade under detta möte (yttrandet lämnat här)
      const motionsHandledByBoard = await ctx.db.motion.findMany({
        where: { boardResponseMeetingId: input.meetingId },
        select: {
          id: true, title: true, proposal: true,
          boardResponse: true, boardRecommendation: true,
          boardRespondedAt: true,
          author: { select: { firstName: true, lastName: true } },
        },
        orderBy: { boardRespondedAt: "asc" },
      });

      // Bilagor per agendapunkt (polymorf)
      const agendaItemIds = meeting.agendaItems.map((i) => i.id);
      const attachments = agendaItemIds.length > 0
        ? await ctx.db.attachment.findMany({
            where: { entityType: "AgendaItem", entityId: { in: agendaItemIds } },
            select: { entityId: true, name: true, type: true },
            orderBy: { createdAt: "asc" },
          })
        : [];
      const attachmentsByItem = new Map<string, Array<{ name: string; type: string }>>();
      for (const a of attachments) {
        if (!attachmentsByItem.has(a.entityId)) attachmentsByItem.set(a.entityId, []);
        attachmentsByItem.get(a.entityId)!.push({ name: a.name, type: a.type });
      }

      const meetingTypeLabel = MEETING_TYPE_LABELS[meeting.type];
      const present = meeting.attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY");
      const absent = meeting.attendances.filter((a) => a.status === "ABSENT");

      // ─── Hämta förenings-info + header-config ───
      const brfSettings = await ctx.db.brfSettings.findUnique({ where: { id: "default" } });
      const headerConfig = parseProtocolHeaderConfig(brfSettings?.protocolHeaderConfig)[meeting.type];

      // Räkenskapsårets gränser baserat på BrfSettings.fiscalYearStart (månad 1-12)
      const fyStartMonth = brfSettings?.fiscalYearStart ?? 1;
      const fyEndMonth = brfSettings?.fiscalYearEnd ?? 12;
      const meetingYear = meeting.scheduledAt.getFullYear();
      const meetingMonth = meeting.scheduledAt.getMonth() + 1;
      // Om fy startar i jan och slutar i dec: FY = kalenderår
      // Om fy går över årsskiftet: justera startår
      let fyStartYear = meetingYear;
      if (fyStartMonth > 1 && meetingMonth < fyStartMonth) fyStartYear = meetingYear - 1;
      const fiscalYearStart = new Date(fyStartYear, fyStartMonth - 1, 1);
      const fiscalYearEnd = new Date(fyStartYear + (fyEndMonth < fyStartMonth ? 1 : 0), fyEndMonth, 0);
      const fiscalYearLabel = `${format(fiscalYearStart, "yyyy-MM-dd")} — ${format(fiscalYearEnd, "yyyy-MM-dd")}`;

      // Dynamiskt protokollnummer: N:e möte av denna typ inom räkenskapsåret
      // (räknat tom detta möte inklusive). Använder scheduledAt som ordning.
      const priorCount = await ctx.db.meeting.count({
        where: {
          type: meeting.type,
          scheduledAt: { gte: fiscalYearStart, lte: meeting.scheduledAt },
          id: { not: meeting.id },
        },
      });
      const protocolNumber = `${priorCount + 1}/${fyStartYear}`;
      const protocolLabel = meeting.type === "BOARD"
        ? `Styrelseprotokoll nr ${protocolNumber}`
        : meeting.type === "ANNUAL"
          ? `Stämmoprotokoll nr ${protocolNumber}`
          : `Extra stämmoprotokoll nr ${protocolNumber}`;
      const recommendationLabel = (r: string | null): string => {
        switch (r) {
          case "APPROVE":  return "tillstyrker (bifall)";
          case "REJECT":   return "avstyrker (avslag)";
          case "AMEND":    return "föreslår ändring";
          case "NEUTRAL":  return "tar inte ställning";
          default:         return "";
        }
      };

      // Bygg protokoll som Markdown (funkar också som klartext)
      const lines: string[] = [];

      lines.push(`# PROTOKOLL — ${meetingTypeLabel}`);
      lines.push("");

      // Förenings-identifikation (enligt konfig per mötestyp)
      if (brfSettings && headerConfig.name) {
        lines.push(`**${brfSettings.name}**`);
      }
      const orgAndSeat: string[] = [];
      if (brfSettings && headerConfig.orgNumber) orgAndSeat.push(`Organisationsnummer ${brfSettings.orgNumber}`);
      if (brfSettings?.seat && headerConfig.seat) orgAndSeat.push(`med säte i ${brfSettings.seat}`);
      if (orgAndSeat.length > 0) {
        lines.push(orgAndSeat.join(", "));
      }
      if (brfSettings && headerConfig.address) {
        const addressParts = [brfSettings.address, [brfSettings.postalCode, brfSettings.city].filter(Boolean).join(" ")]
          .filter((p) => p && p.trim().length > 0);
        if (addressParts.length > 0) {
          lines.push(addressParts.join(", "));
        }
      }
      // Kontaktuppgifter (stämma default — styrelse om uttryckligen på)
      const contactParts: string[] = [];
      if (brfSettings?.website && headerConfig.website) contactParts.push(brfSettings.website);
      if (brfSettings?.email && headerConfig.email) contactParts.push(brfSettings.email);
      if (contactParts.length > 0) {
        lines.push(contactParts.join(" · "));
      }
      lines.push("");

      // Protokollsreferens + räkenskapsår
      if (headerConfig.protocolNumber) {
        lines.push(`**${protocolLabel}**`);
      }
      if (headerConfig.fiscalYear) {
        lines.push(`Räkenskapsår ${fiscalYearLabel}`);
      }
      if (headerConfig.protocolNumber || headerConfig.fiscalYear) {
        lines.push("");
      }

      lines.push("---");
      lines.push("");

      // Mötets metadata
      lines.push(`**${meeting.title}**`);
      lines.push("");
      lines.push(`- **Datum:** ${fmtDate(meeting.scheduledAt)}`);
      if (meeting.location) lines.push(`- **Plats:** ${meeting.location}`);
      if (chairperson) lines.push(`- **Mötesordförande:** ${chairperson.firstName} ${chairperson.lastName}`);
      if (secretary) lines.push(`- **Mötessekreterare:** ${secretary.firstName} ${secretary.lastName}`);
      if (adjusterUsers.length > 0) {
        const label = meeting.type === "BOARD" ? "Justerare" : "Justerare tillika rösträknare";
        lines.push(`- **${label}:** ${adjusterUsers.map((a) => `${a.firstName} ${a.lastName}`).join(", ")}`);
      }
      lines.push("");

      // Närvaro
      lines.push("## Närvaro");
      lines.push("");
      lines.push("**Närvarande:**");
      for (const a of present) {
        lines.push(`- ${a.user.firstName} ${a.user.lastName}${a.status === "PROXY" ? " (ombud)" : ""}`);
      }
      if (absent.length > 0) {
        lines.push("");
        lines.push("**Frånvarande:**");
        for (const a of absent) {
          lines.push(`- ${a.user.firstName} ${a.user.lastName}`);
        }
      }
      lines.push("");
      lines.push(`*Totalt ${present.length} närvarande av ${meeting.attendances.length} kallade.*`);
      lines.push("");

      const meetingActor = meeting.type === "BOARD" ? "Mötet" : "Stämman";
      const adjusterRoleLabel = meeting.type === "BOARD" ? "justerare" : "justerare tillika rösträknare";

      // Agendapunkter
      for (const item of meeting.agendaItems) {
        lines.push(`## § ${item.sortOrder} — ${item.title}`);
        lines.push("");
        if (item.description) {
          lines.push(`*${item.description}*`);
          lines.push("");
        }
        if (item.notes) {
          lines.push(item.notes);
          lines.push("");
        }

        // Syntetisera beslut-meningar för rollval (uppgifterna lagras på Meeting, ej som Decision)
        if (item.specialType === "ELECT_CHAIR" && chairperson) {
          lines.push(`**Beslut:** ${meetingActor} beslutade att ${chairperson.firstName} ${chairperson.lastName} utses till mötesordförande.`);
          lines.push("");
        }
        if (item.specialType === "ELECT_SECRETARY" && secretary) {
          lines.push(`**Beslut:** ${meetingActor} beslutade att ${secretary.firstName} ${secretary.lastName} utses till mötessekreterare.`);
          lines.push("");
        }
        if (item.specialType === "ELECT_ADJUSTERS" && adjusterUsers.length > 0) {
          const namesFormatted = adjusterUsers.length === 1
            ? `${adjusterUsers[0].firstName} ${adjusterUsers[0].lastName}`
            : adjusterUsers.slice(0, -1).map((a) => `${a.firstName} ${a.lastName}`).join(", ") +
              ` och ${adjusterUsers[adjusterUsers.length - 1].firstName} ${adjusterUsers[adjusterUsers.length - 1].lastName}`;
          lines.push(`**Beslut:** ${meetingActor} beslutade att ${namesFormatted} utses till ${adjusterRoleLabel}.`);
          lines.push("");
        }
        if (item.specialType === "NEXT_MEETING" && item.proposedDate) {
          const p = new Date(item.proposedDate);
          const weekday = format(p, "EEEE", { locale: sv });
          const date = format(p, "yyyy-MM-dd");
          const time = format(p, "HH:mm");
          lines.push(`**Beslut:** ${meetingActor} beslutade att nästa möte hålls ${weekday} ${date} med start ${time}.`);
          lines.push("");
        }

        // Bilagor
        const itemAttachments = attachmentsByItem.get(item.id) ?? [];
        if (itemAttachments.length > 0) {
          lines.push("**Bilagor:**");
          for (const a of itemAttachments) {
            lines.push(`- ${a.name}${a.type === "link" ? " (länk)" : ""}`);
          }
          lines.push("");
        }

        // Motioner kopplade till denna punkt (gäller årsstämma MOTIONS)
        if (item.specialType === "MOTIONS") {
          for (const mo of meeting.motions) {
            lines.push(`### Motion: ${mo.title}`);
            lines.push(`*Av ${mo.author.firstName} ${mo.author.lastName}*`);
            lines.push("");
            lines.push(`**Yrkande:** ${mo.proposal}`);
            lines.push("");
            if (mo.boardResponse) {
              lines.push(`**Styrelsens yttrande:** ${mo.boardResponse}`);
              if (mo.boardRecommendation) {
                lines.push(`**Styrelsens rekommendation:** ${recommendationLabel(mo.boardRecommendation)}`);
              }
              lines.push("");
            }
            if (mo.resolution) {
              lines.push(`**Stämmans beslut:** ${mo.resolution}`);
              lines.push("");
            }
            for (const p of mo.voteProposals) {
              if (p.adopted || p.votesFor !== null) {
                lines.push(`- ${p.label}: ${p.description}${p.adopted ? " **(ANTAGET)**" : ""}`);
                if (p.votesFor !== null) {
                  lines.push(`  Röster: Ja ${p.votesFor} / Nej ${p.votesAgainst ?? 0} / Avstår ${p.votesAbstained ?? 0}`);
                }
              }
            }
            lines.push("");
          }
        }

        // Motioner som styrelsen behandlade här (gäller styrelsemöte BOARD_MATTERS)
        if (item.specialType === "BOARD_MATTERS" && motionsHandledByBoard.length > 0) {
          for (const mo of motionsHandledByBoard) {
            lines.push(`### Motion behandlad: ${mo.title}`);
            lines.push(`*Av ${mo.author.firstName} ${mo.author.lastName}*`);
            lines.push("");
            lines.push(`**Yrkande:** ${mo.proposal}`);
            lines.push("");
            if (mo.boardResponse) {
              lines.push(`**Styrelsens yttrande:** ${mo.boardResponse}`);
            }
            if (mo.boardRecommendation) {
              lines.push(`**Styrelsens rekommendation:** ${recommendationLabel(mo.boardRecommendation)}`);
            }
            lines.push("");
          }
        }

        // Beslut under punkten
        for (const d of item.decisions) {
          lines.push(`**Beslut ${d.reference}:** ${d.decisionText}`);
          lines.push("");
          lines.push(`*Beslutsmetod:* ${decisionMethodLabels[d.method] ?? d.method}`);
          if (d.method === "COUNTED" && d.votesFor !== null) {
            lines.push(`*Röstresultat:* Ja ${d.votesFor} / Nej ${d.votesAgainst ?? 0} / Avstår ${d.votesAbstained ?? 0}`);
          }
          if (d.tiebrokenByChairperson) {
            lines.push(`*Utslagsröst:* ordförandens röst avgjorde.`);
          }
          if (d.recusals.length > 0) {
            for (const r of d.recusals) {
              lines.push(`*Jäv:* ${r.userName} deltog ej i beslutet (${r.reason}).`);
            }
          }
          lines.push("");
        }
      }

      // Signaturblock
      lines.push("---");
      lines.push("");
      lines.push(`Protokollet upprättat av ${secretary ? `${secretary.firstName} ${secretary.lastName}` : "[sekreterare]"}, mötessekreterare.`);
      lines.push("");
      lines.push("**Justeras:**");
      lines.push("");
      lines.push("");
      if (chairperson) lines.push(`${chairperson.firstName} ${chairperson.lastName}, mötesordförande`);
      lines.push("");
      for (const a of adjusterUsers) {
        lines.push(`${a.firstName} ${a.lastName}, justerare`);
        lines.push("");
      }

      return lines.join("\n");
    }),

  // Update protocol content — only if DRAFT or FINALIZED (by secretary)
  upsert: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(upsertProtocolSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
      });

      if (existing) {
        // SIGNED/ARCHIVED = fully locked
        if (existing.status === "SIGNED" || existing.status === "ARCHIVED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Protokollet är justerat och kan inte ändras.",
          });
        }

        // FINALIZED = only the secretary who finalized can edit
        if (existing.status === "FINALIZED" && existing.finalizedBy !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Protokollet är slutbehandlat. Bara sekreteraren kan göra korrigeringar.",
          });
        }

        return ctx.db.protocol.update({
          where: { meetingId: input.meetingId },
          data: { content: input.content },
        });
      }

      return ctx.db.protocol.create({
        data: { meetingId: input.meetingId, content: input.content },
      });
    }),

  // Secretary finalizes — locks for other editors
  finalize: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
      });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND", message: "Inget protokoll att slutbehandla" });
      if (protocol.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Protokollet är redan slutbehandlat" });
      }

      const result = await ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: {
          status: "FINALIZED",
          finalizedAt: new Date(),
          finalizedBy: ctx.user.id as string,
        },
      });
      logActivity({ userId: ctx.user.id as string, action: "protocol.finalize", entityType: "Protocol", entityId: protocol.id, description: "Slutbehandlade protokollet", before: { status: "DRAFT" }, after: { status: "FINALIZED" } });

      // Notify chairperson + adjusters that signing is needed
      const meeting = await ctx.db.meeting.findUnique({ where: { id: input.meetingId }, select: { title: true, meetingChairpersonId: true, adjusters: true } });
      if (meeting) {
        const signers = [meeting.meetingChairpersonId, ...meeting.adjusters].filter(Boolean) as string[];
        notifyMany(signers, { title: "Protokoll att signera", body: `Protokollet för ${meeting.title} är slutbehandlat och väntar på din signatur.`, link: `/styrelse/moten/${input.meetingId}` });
      }

      return result;
    }),

  // Reopen — secretary can pull back to DRAFT if needed
  reopen: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
      });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
      if (protocol.status !== "FINALIZED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan bara återöppna slutbehandlade protokoll" });
      }
      if (protocol.finalizedBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bara sekreteraren som slutbehandlade kan återöppna" });
      }

      return ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: { status: "DRAFT", finalizedAt: null, finalizedBy: null },
      });
    }),

  // Sign — ordförande or justerare adds their signature
  sign: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
        include: {
          meeting: {
            select: { meetingChairpersonId: true, adjusters: true },
          },
        },
      });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
      if (protocol.status !== "FINALIZED" && protocol.status !== "SIGNED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Protokollet måste vara slutbehandlat innan det kan signeras" });
      }

      const userId = ctx.user.id as string;

      // Verify signer is ordförande or justerare
      const isChairperson = protocol.meeting.meetingChairpersonId === userId;
      const isAdjuster = protocol.meeting.adjusters.includes(userId);
      if (!isChairperson && !isAdjuster) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bara mötesordförande och justerare kan signera protokollet" });
      }

      // Check not already signed by this user
      if (protocol.signedBy.includes(userId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Du har redan signerat detta protokoll" });
      }

      const newSignedBy = [...protocol.signedBy, userId];

      // Check if all required signers have signed (chairperson + all adjusters)
      const requiredSigners = [
        protocol.meeting.meetingChairpersonId,
        ...protocol.meeting.adjusters,
      ].filter(Boolean) as string[];
      const allSigned = requiredSigners.every((id) => newSignedBy.includes(id));

      const newStatus = allSigned ? "SIGNED" : "FINALIZED";
      const result = await ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: { signedBy: newSignedBy, signedAt: new Date(), status: newStatus },
      });
      logActivity({ userId, action: "protocol.sign", entityType: "Protocol", entityId: protocol.id, description: `Signerade protokollet${allSigned ? " (alla har signerat)" : ""}`, before: { signedBy: protocol.signedBy }, after: { signedBy: newSignedBy, status: newStatus } });
      return result;
    }),

  // Archive — final lock after signing
  archive: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({
        where: { meetingId: input.meetingId },
      });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
      if (protocol.status !== "SIGNED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Protokollet måste vara signerat innan det kan arkiveras" });
      }

      const result = await ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });

      logActivity({ userId: ctx.user.id as string, action: "protocol.archive", entityType: "Protocol", entityId: protocol.id, description: "Arkiverade protokollet", before: { status: "SIGNED" }, after: { status: "ARCHIVED" } });
      return result;
    }),

  // Get protocols with overdue deadlines
  getOverdue: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .query(async ({ ctx }) => {
      const rules = await (await import("@/lib/rules")).getBrfRules();
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() - rules.protocolDeadlineWeeks * 7);

      // Meetings that ended (FINALIZING/COMPLETED) before deadline and protocol not finalized
      return ctx.db.meeting.findMany({
        where: {
          status: { in: ["FINALIZING", "COMPLETED"] },
          updatedAt: { lt: deadlineDate },
          OR: [
            { protocol: null },
            { protocol: { status: "DRAFT" } },
          ],
        },
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          protocol: { select: { status: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });
    }),

  // Koppla undertecknat PDF-dokument till protokollet
  uploadSigned: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string(), documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({ where: { meetingId: input.meetingId } });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND", message: "Inget protokoll finns" });
      if (protocol.status === "ARCHIVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arkiverat protokoll kan inte ändras" });
      }

      const document = await ctx.db.document.findUnique({ where: { id: input.documentId } });
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Dokumentet finns inte" });
      if (document.category !== "MEETING_PROTOCOL") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Dokumentet är inte kategoriserat som protokoll" });
      }

      // Rensa ev. tidigare protokolldokument (behåll inte orphan)
      if (protocol.signedPdfDocumentId && protocol.signedPdfDocumentId !== input.documentId) {
        await ctx.db.document.delete({ where: { id: protocol.signedPdfDocumentId } }).catch(() => { /* orphan tolereras */ });
      }

      const updated = await ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: {
          signedPdfDocumentId: input.documentId,
          signedPdfUploadedAt: new Date(),
          signedPdfUploadedById: ctx.user.id as string,
        },
      });

      logActivity({
        userId: ctx.user.id as string,
        action: "protocol.uploadSigned",
        entityType: "Protocol",
        entityId: protocol.id,
        description: `Laddade upp undertecknat protokoll: ${document.fileName}`,
        after: { signedPdfDocumentId: input.documentId, fileName: document.fileName },
      });

      return updated;
    }),

  // Ta bort uppladdat PDF — t.ex. vid felaktig uppladdning
  removeSigned: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await ctx.db.protocol.findUnique({ where: { meetingId: input.meetingId } });
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
      if (protocol.status === "ARCHIVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arkiverat protokoll kan inte ändras" });
      }
      if (!protocol.signedPdfDocumentId) return protocol;

      const documentId = protocol.signedPdfDocumentId;
      await ctx.db.document.delete({ where: { id: documentId } }).catch(() => { /* orphan tolereras */ });

      const updated = await ctx.db.protocol.update({
        where: { meetingId: input.meetingId },
        data: {
          signedPdfDocumentId: null,
          signedPdfUploadedAt: null,
          signedPdfUploadedById: null,
        },
      });

      logActivity({
        userId: ctx.user.id as string,
        action: "protocol.removeSigned",
        entityType: "Protocol",
        entityId: protocol.id,
        description: "Tog bort undertecknat protokoll-PDF",
        before: { signedPdfDocumentId: documentId },
      });

      return updated;
    }),
});
