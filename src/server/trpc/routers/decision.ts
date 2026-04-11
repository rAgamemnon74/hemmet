import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createDecisionSchema, addDecisionVoteSchema } from "@/lib/validators/meeting";
import { format } from "date-fns";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { getBrfRules } from "@/lib/rules";

export const decisionRouter = router({
  list: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(
      z.object({
        search: z.string().optional(),
        meetingId: z.string().optional(),
        method: z.enum(["ACCLAMATION", "ROLL_CALL", "COUNTED"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.decision.findMany({
        where: {
          meetingId: input?.meetingId,
          method: input?.method,
          ...(input?.search
            ? {
                OR: [
                  { title: { contains: input.search, mode: "insensitive" as const } },
                  { reference: { contains: input.search, mode: "insensitive" as const } },
                  { decisionText: { contains: input.search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        include: {
          meeting: { select: { title: true, scheduledAt: true, type: true } },
          _count: { select: { tasks: true, voteRecords: true, recusals: true } },
        },
        orderBy: { decidedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const decision = await ctx.db.decision.findUnique({
        where: { id: input.id },
        include: {
          meeting: { select: { id: true, title: true, scheduledAt: true, type: true } },
          agendaItem: { select: { id: true, sortOrder: true, title: true } },
          voteRecords: { orderBy: { voterName: "asc" } },
          recusals: { orderBy: { createdAt: "asc" } },
          _count: { select: { tasks: true } },
        },
      });
      if (!decision) throw new TRPCError({ code: "NOT_FOUND" });
      return decision;
    }),

  create: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(createDecisionSchema)
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUniqueOrThrow({
        where: { id: input.meetingId },
        include: {
          attendances: { where: { status: { in: ["PRESENT", "PROXY"] } }, select: { userId: true } },
        },
      });
      const existingCount = await ctx.db.decision.count({
        where: { meetingId: input.meetingId },
      });
      const datePrefix = format(meeting.scheduledAt, "yyyy-MM");
      const reference = `${datePrefix}-§${existingCount + 1}`;

      // Check tie-breaker
      let tiebrokenByChairperson = false;
      if (input.method === "COUNTED" && input.votesFor !== undefined && input.votesAgainst !== undefined) {
        if (input.votesFor === input.votesAgainst) {
          const rules = await getBrfRules();
          if (rules.tieBreakerChairperson && meeting.meetingChairpersonId) {
            tiebrokenByChairperson = true;
            // Chairperson's vote counts as +1 for
            input.votesFor = (input.votesFor ?? 0) + 1;
          }
        }
      }

      // Track participants (all present minus any recusals added later)
      const participantIds = meeting.attendances.map((a) => a.userId);

      const decision = await ctx.db.decision.create({
        data: {
          meetingId: input.meetingId,
          agendaItemId: input.agendaItemId,
          title: input.title,
          description: input.description,
          decisionText: input.decisionText,
          method: input.method,
          voteRequestedBy: input.voteRequestedBy,
          voteRequestedReason: input.voteRequestedReason,
          votesFor: input.votesFor,
          votesAgainst: input.votesAgainst,
          votesAbstained: input.votesAbstained,
          tiebrokenByChairperson,
          participantIds,
          reference,
        },
      });

      logActivity({
        userId: ctx.user.id as string,
        action: "decision.create",
        entityType: "Decision",
        entityId: decision.id,
        description: `Beslut ${reference}: ${input.title}${tiebrokenByChairperson ? " (ordförandens utslagsröst)" : ""}`,
        after: { reference, method: input.method, tiebrokenByChairperson },
      });

      // Auto-create task from decision if text suggests action
      if (input.decisionText && meeting.meetingChairpersonId) {
        await ctx.db.task.create({
          data: {
            title: `Verkställ: ${input.title}`,
            description: input.decisionText,
            decisionId: decision.id,
            assigneeId: meeting.meetingChairpersonId,
            createdById: ctx.user.id as string,
            priority: "MEDIUM",
          },
        });
      }

      return decision;
    }),

  // Declare conflict of interest (jäv)
  declareRecusal: protectedProcedure
    .use(requirePermission("meeting:vote"))
    .input(
      z.object({
        decisionId: z.string(),
        reason: z.string().min(1, "Ange anledning till jäv"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      const decision = await ctx.db.decision.findUnique({
        where: { id: input.decisionId },
        include: {
          meeting: {
            include: {
              attendances: { where: { status: { in: ["PRESENT", "PROXY"] } }, select: { userId: true } },
            },
          },
        },
      });
      if (!decision) throw new TRPCError({ code: "NOT_FOUND" });

      // Get user name
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      const recusal = await ctx.db.decisionRecusal.create({
        data: {
          decisionId: input.decisionId,
          userId,
          userName: user ? `${user.firstName} ${user.lastName}` : userId,
          reason: input.reason,
        },
      });

      // Update participant list (remove recused user)
      const newParticipants = decision.participantIds.filter((id) => id !== userId);
      await ctx.db.decision.update({
        where: { id: input.decisionId },
        data: { participantIds: newParticipants },
      });

      logActivity({
        userId,
        action: "decision.recusal",
        entityType: "Decision",
        entityId: input.decisionId,
        description: `Jävsdeklaration: ${user?.firstName} ${user?.lastName} — ${input.reason}`,
        before: { participantIds: decision.participantIds },
        after: { participantIds: newParticipants, recusalReason: input.reason },
      });

      return recusal;
    }),

  // Check quorum for a decision (considering recusals)
  checkQuorum: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ meetingId: z.string(), recusedCount: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
        include: {
          attendances: { where: { status: { in: ["PRESENT", "PROXY"] } } },
        },
      });
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });

      const rules = await getBrfRules();

      // Total board members (from rules or actual count)
      const totalBoardMembers = await ctx.db.userRole.count({
        where: {
          role: { in: ["BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER", "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS", "BOARD_MEMBER"] },
          active: true,
        },
      });

      const present = meeting.attendances.length;
      const availableVoters = present - input.recusedCount;
      const quorumRequired = Math.floor(totalBoardMembers / 2) + 1;
      const isQuorate = availableVoters >= quorumRequired;

      return {
        totalBoardMembers,
        present,
        recused: input.recusedCount,
        availableVoters,
        quorumRequired,
        isQuorate,
        warning: !isQuorate
          ? `Ej beslutfört: ${availableVoters} tillgängliga röster, ${quorumRequired} krävs. Överväg att bordlägga ärendet eller låta suppleant inträda.`
          : null,
      };
    }),

  addVoteRecord: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(addDecisionVoteSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.decisionVote.upsert({
        where: {
          decisionId_voterId: {
            decisionId: input.decisionId,
            voterId: input.voterId,
          },
        },
        update: { choice: input.choice, voterName: input.voterName },
        create: input,
      });
    }),

  removeVoteRecord: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.decisionVote.delete({ where: { id: input.id } });
    }),
});
