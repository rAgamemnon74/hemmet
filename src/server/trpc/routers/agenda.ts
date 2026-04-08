import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createAgendaItemSchema, updateAgendaItemSchema, reorderAgendaSchema } from "@/lib/validators/meeting";

export const agendaRouter = router({
  create: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(createAgendaItemSchema)
    .mutation(async ({ ctx, input }) => {
      const maxOrder = await ctx.db.agendaItem.aggregate({
        where: { meetingId: input.meetingId },
        _max: { sortOrder: true },
      });
      return ctx.db.agendaItem.create({
        data: {
          ...input,
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });
    }),

  update: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(updateAgendaItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.agendaItem.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.agendaItem.delete({ where: { id: input.id } });
    }),

  reorder: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(reorderAgendaSchema)
    .mutation(async ({ ctx, input }) => {
      const updates = input.itemIds.map((id, index) =>
        ctx.db.agendaItem.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      );
      await ctx.db.$transaction(updates);
      return { ok: true };
    }),
});
