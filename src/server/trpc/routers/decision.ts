import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createDecisionSchema } from "@/lib/validators/meeting";
import { format } from "date-fns";

export const decisionRouter = router({
  list: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(
      z.object({
        search: z.string().optional(),
        meetingId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.decision.findMany({
        where: {
          meetingId: input?.meetingId,
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
          _count: { select: { tasks: true } },
        },
        orderBy: { decidedAt: "desc" },
      });
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
          ...input,
          reference,
        },
      });
    }),
});
