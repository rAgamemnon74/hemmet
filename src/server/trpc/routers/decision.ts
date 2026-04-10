import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createDecisionSchema, addDecisionVoteSchema } from "@/lib/validators/meeting";
import { format } from "date-fns";
import { TRPCError } from "@trpc/server";

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
                  { title: { contains: input.search, mode: "insensitive" } },
                  { reference: { contains: input.search, mode: "insensitive" } },
                  { decisionText: { contains: input.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          meeting: { select: { title: true, scheduledAt: true, type: true } },
          _count: { select: { tasks: true, voteRecords: true } },
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
          voteRecords: {
            orderBy: { voterName: "asc" },
          },
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
      // Generate reference: YYYY-MM-§N
      const meeting = await ctx.db.meeting.findUniqueOrThrow({
        where: { id: input.meetingId },
      });
      const existingCount = await ctx.db.decision.count({
        where: { meetingId: input.meetingId },
      });
      const datePrefix = format(meeting.scheduledAt, "yyyy-MM");
      const reference = `${datePrefix}-§${existingCount + 1}`;

      return ctx.db.decision.create({
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
          reference,
        },
      });
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
