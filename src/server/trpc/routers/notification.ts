import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationRouter = router({
  // Get my notifications (latest 20, unread first)
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.findMany({
      where: { userId: ctx.user.id as string },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take: 20,
    });
  }),

  // Count unread
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: { userId: ctx.user.id as string, read: false },
    });
  }),

  // Mark as read
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.update({
        where: { id: input.id },
        data: { read: true },
      });
    }),

  // Mark all as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.notification.updateMany({
      where: { userId: ctx.user.id as string, read: false },
      data: { read: true },
    });
  }),
});
