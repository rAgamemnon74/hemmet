import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createAgendaItemSchema, updateAgendaItemSchema, reorderAgendaSchema } from "@/lib/validators/meeting";
import { logActivity } from "@/lib/audit";

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

  // Secretary notes per agenda item (real-time during meeting)
  updateNotes: protectedProcedure
    .use(requirePermission("meeting:protocol"))
    .input(z.object({ id: z.string(), notes: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.agendaItem.update({
        where: { id: input.id },
        data: { notes: input.notes },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "agenda.updateNotes",
        entityType: "AgendaItem",
        entityId: input.id,
        description: "Uppdaterade mötesanteckningar",
      });
      return result;
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
