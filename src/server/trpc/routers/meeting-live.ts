import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";

export const meetingLiveRouter = router({
  // Get live state (polled by presentation view)
  getState: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          activeAgendaItemId: true,
          activeSubItemType: true,
          activeSubItemId: true,
          meetingChairpersonId: true,
          meetingSecretaryId: true,
          adjusters: true,
          agendaItems: {
            orderBy: { sortOrder: "asc" },
            include: {
              decisions: {
                select: {
                  id: true, reference: true, title: true, decisionText: true,
                  method: true, votesFor: true, votesAgainst: true, votesAbstained: true,
                },
              },
            },
          },
          motions: {
            select: {
              id: true, title: true, status: true, proposal: true,
              boardResponse: true, boardRecommendation: true,
              voteProposals: { orderBy: { sortOrder: "asc" } },
              author: { select: { firstName: true, lastName: true } },
            },
          },
          attendances: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          proxies: {
            where: { approved: true },
            select: {
              id: true, memberId: true, proxyType: true,
              proxyMemberId: true, externalName: true, approved: true,
            },
          },
          voterRegistry: {
            select: {
              id: true,
              entries: {
                select: { memberId: true, checkedIn: true, checkedInAt: true },
              },
            },
          },
          _count: {
            select: {
              attendances: { where: { status: { in: ["PRESENT", "PROXY"] } } },
            },
          },
        },
      });
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });

      // For board meetings: fetch all board members
      // For annual/extraordinary meetings: fetch all members
      let members: Array<{ id: string; firstName: string; lastName: string }> = [];
      let boardMembers: Array<{ id: string; firstName: string; lastName: string; role: string }> = [];
      if (meeting.type === "BOARD") {
        const users = await ctx.db.user.findMany({
          where: {
            roles: {
              some: {
                role: { in: ["BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER", "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS", "BOARD_MEMBER", "BOARD_SUBSTITUTE"] },
                active: true,
              },
            },
          },
          select: {
            id: true, firstName: true, lastName: true,
            roles: { where: { active: true, role: { in: ["BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER", "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS", "BOARD_MEMBER", "BOARD_SUBSTITUTE"] } }, select: { role: true } },
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });
        boardMembers = users.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, role: u.roles[0]?.role ?? "" }));
      } else {
        members = await ctx.db.user.findMany({
          where: { roles: { some: { role: "MEMBER", active: true } } },
          select: { id: true, firstName: true, lastName: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });
      }

      // Determine fiscal year boundaries
      const settings = await ctx.db.brfSettings.findUnique({ where: { id: "default" } });
      const fyStart = settings?.fiscalYearStart ?? 1;
      const now = new Date();
      const fiscalYearStart = new Date(now.getFullYear(), fyStart - 1, 1);
      if (fiscalYearStart > now) fiscalYearStart.setFullYear(fiscalYearStart.getFullYear() - 1);

      // For board meetings (BOARD_MATTERS): show motions pending handling
      // PLUS motions already handled during this meeting (so board can still
      // navigate back and see what they just decided, and they don't disappear
      // from the list mid-meeting).
      const [pendingMotions, pendingSuggestions] = await Promise.all([
        ctx.db.motion.findMany({
          where: {
            OR: [
              // Ej besvarade motioner inom innevarande räkenskapsår
              {
                status: { in: ["SUBMITTED", "RECEIVED"] },
                meetingId: null,
                submittedAt: { gte: fiscalYearStart },
              },
              // Motioner som behandlats under detta styrelsemöte — stanna kvar
              { boardResponseMeetingId: input.meetingId },
            ],
          },
          select: {
            id: true, title: true, status: true, proposal: true,
            boardResponse: true, boardRecommendation: true,
            boardResponseMeetingId: true,
            voteProposals: { orderBy: { sortOrder: "asc" } },
            author: { select: { firstName: true, lastName: true } },
          },
          orderBy: { submittedAt: "asc" },
        }),
        ctx.db.suggestion.findMany({
          where: {
            status: { in: ["SUBMITTED", "ACKNOWLEDGED"] },
            response: null, // No board response yet = not handled
            createdAt: { gte: fiscalYearStart },
          },
          select: {
            id: true, title: true, description: true, status: true,
            author: { select: { firstName: true, lastName: true } },
          },
        }),
      ]);

      // Bilagor per agendapunkt (polymorf — ej direkt relation, hämtas separat)
      const agendaItemIds = meeting.agendaItems.map((i) => i.id);
      const attachments = agendaItemIds.length > 0
        ? await ctx.db.attachment.findMany({
            where: { entityType: "AgendaItem", entityId: { in: agendaItemIds } },
            orderBy: { createdAt: "asc" },
            select: { id: true, entityId: true, type: true, name: true, url: true, mimeType: true, fileSize: true },
          })
        : [];
      const attachmentsByItem = new Map<string, typeof attachments>();
      for (const a of attachments) {
        if (!attachmentsByItem.has(a.entityId)) attachmentsByItem.set(a.entityId, []);
        attachmentsByItem.get(a.entityId)!.push(a);
      }
      const agendaItemsWithAttachments = meeting.agendaItems.map((item) => ({
        ...item,
        attachments: attachmentsByItem.get(item.id) ?? [],
      }));

      return {
        ...meeting,
        agendaItems: agendaItemsWithAttachments,
        pendingMotions,
        pendingSuggestions,
        members,
        boardMembers,
      };
    }),

  // Set active agenda item (clears sub-item)
  setActiveItem: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({ meetingId: z.string(), agendaItemId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.meeting.update({
        where: { id: input.meetingId },
        data: {
          activeAgendaItemId: input.agendaItemId,
          activeSubItemType: null,
          activeSubItemId: null,
        },
      });
    }),

  // Set active sub-item (motion/suggestion within a special agenda point)
  setActiveSubItem: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({
      meetingId: z.string(),
      type: z.enum(["motion", "suggestion"]).nullable(),
      id: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.meeting.update({
        where: { id: input.meetingId },
        data: {
          activeSubItemType: input.type,
          activeSubItemId: input.id,
        },
      });
    }),

  // Quick decision from admin view
  quickDecision: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({
      meetingId: z.string(),
      agendaItemId: z.string(),
      title: z.string().min(1),
      decisionText: z.string().min(1),
      method: z.enum(["ACCLAMATION", "ROLL_CALL", "COUNTED"]).default("ACCLAMATION"),
      votesFor: z.number().int().min(0).optional(),
      votesAgainst: z.number().int().min(0).optional(),
      votesAbstained: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { format } = await import("date-fns");
      const meeting = await ctx.db.meeting.findUniqueOrThrow({
        where: { id: input.meetingId },
      });
      const existingCount = await ctx.db.decision.count({
        where: { meetingId: input.meetingId },
      });
      const datePrefix = format(meeting.scheduledAt, "yyyy-MM");
      const reference = `${datePrefix}-§${existingCount + 1}`;

      const decision = await ctx.db.decision.create({
        data: {
          meetingId: input.meetingId,
          agendaItemId: input.agendaItemId,
          title: input.title,
          description: input.title,
          decisionText: input.decisionText,
          method: input.method,
          votesFor: input.votesFor,
          votesAgainst: input.votesAgainst,
          votesAbstained: input.votesAbstained,
          reference,
        },
      });

      const voteSummary = input.method === "COUNTED" && input.votesFor !== undefined
        ? ` (Ja ${input.votesFor} / Nej ${input.votesAgainst ?? 0} / Avstår ${input.votesAbstained ?? 0})`
        : "";
      logActivity({
        userId: ctx.user.id as string,
        action: "decision.create",
        entityType: "Decision",
        entityId: decision.id,
        description: `Beslut ${reference}: ${input.title}${voteSummary}`,
        after: {
          title: input.title,
          decisionText: input.decisionText,
          method: input.method,
          votesFor: input.votesFor ?? null,
          votesAgainst: input.votesAgainst ?? null,
          votesAbstained: input.votesAbstained ?? null,
        },
      });

      return decision;
    }),
});
