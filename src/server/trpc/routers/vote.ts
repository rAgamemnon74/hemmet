import { router, protectedProcedure, requirePermission } from "../trpc";
import { castVoteSchema } from "@/lib/validators/meeting";
import { TRPCError } from "@trpc/server";

export const voteRouter = router({
  cast: protectedProcedure
    .use(requirePermission("meeting:vote"))
    .input(castVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const agendaItem = await ctx.db.agendaItem.findUnique({
        where: { id: input.agendaItemId },
        include: { meeting: { select: { status: true } } },
      });

      if (!agendaItem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dagordningspunkten hittades inte" });
      }

      if (agendaItem.meeting.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mötet måste vara pågående för att rösta" });
      }

      return ctx.db.vote.upsert({
        where: {
          agendaItemId_userId: {
            agendaItemId: input.agendaItemId,
            userId: ctx.user.id,
          },
        },
        update: { choice: input.choice },
        create: {
          agendaItemId: input.agendaItemId,
          userId: ctx.user.id,
          choice: input.choice,
        },
      });
    }),
});
