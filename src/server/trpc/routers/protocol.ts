import { router, protectedProcedure, requirePermission } from "../trpc";
import { upsertProtocolSchema } from "@/lib/validators/meeting";

export const protocolRouter = router({
  upsert: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(upsertProtocolSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.protocol.upsert({
        where: { meetingId: input.meetingId },
        update: { content: input.content },
        create: {
          meetingId: input.meetingId,
          content: input.content,
        },
      });
    }),
});
