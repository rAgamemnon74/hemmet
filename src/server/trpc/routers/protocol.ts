import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { upsertProtocolSchema } from "@/lib/validators/meeting";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { notify, notifyMany } from "@/lib/notifications";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

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

      const meetingTypeLabel = meeting.type === "BOARD" ? "Styrelsemöte" : meeting.type === "ANNUAL" ? "Ordinarie föreningsstämma" : "Extra föreningsstämma";
      const present = meeting.attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY");
      const absent = meeting.attendances.filter((a) => a.status === "ABSENT");

      // Build protocol text
      const lines: string[] = [];

      lines.push(`PROTOKOLL — ${meetingTypeLabel}`);
      lines.push(`${meeting.title}`);
      lines.push(`Datum: ${fmtDate(meeting.scheduledAt)}`);
      if (meeting.location) lines.push(`Plats: ${meeting.location}`);
      lines.push("");

      // Roles
      if (chairperson) lines.push(`Mötesordförande: ${chairperson.firstName} ${chairperson.lastName}`);
      if (secretary) lines.push(`Mötessekreterare: ${secretary.firstName} ${secretary.lastName}`);
      if (adjusterUsers.length > 0) {
        lines.push(`Justerare: ${adjusterUsers.map((a) => `${a.firstName} ${a.lastName}`).join(", ")}`);
      }
      lines.push("");

      // Attendance
      lines.push("Närvarande:");
      for (const a of present) {
        lines.push(`  ${a.user.firstName} ${a.user.lastName}${a.status === "PROXY" ? " (ombud)" : ""}`);
      }
      if (absent.length > 0) {
        lines.push("Frånvarande:");
        for (const a of absent) {
          lines.push(`  ${a.user.firstName} ${a.user.lastName}`);
        }
      }
      lines.push("");

      // Agenda items
      for (const item of meeting.agendaItems) {
        lines.push(`§${item.sortOrder} ${item.title}`);
        if (item.notes) {
          lines.push(item.notes);
        } else if (item.description) {
          lines.push(item.description);
        }

        // Decisions under this item
        for (const d of item.decisions) {
          lines.push("");
          lines.push(`Beslut ${d.reference}: ${d.decisionText}`);
          lines.push(`Beslutsmetod: ${decisionMethodLabels[d.method] ?? d.method}`);
          if (d.method === "COUNTED" && d.votesFor !== null) {
            lines.push(`Röstresultat: Ja: ${d.votesFor}, Nej: ${d.votesAgainst ?? 0}, Avstår: ${d.votesAbstained ?? 0}`);
          }
          if (d.tiebrokenByChairperson) {
            lines.push("Ordförandens utslagsröst avgjorde.");
          }
          if (d.recusals.length > 0) {
            for (const r of d.recusals) {
              lines.push(`Jäv: ${r.userName} deltog ej i beslutet (${r.reason})`);
            }
          }
        }
        lines.push("");
      }

      // Footer
      lines.push("---");
      lines.push(`Protokollet upprättat av ${secretary ? `${secretary.firstName} ${secretary.lastName}` : "[sekreterare]"}`);
      lines.push("");
      lines.push("Justeras:");
      lines.push("");
      if (chairperson) lines.push(`${chairperson.firstName} ${chairperson.lastName}, mötesordförande`);
      for (const a of adjusterUsers) {
        lines.push(`${a.firstName} ${a.lastName}, justerare`);
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
});
