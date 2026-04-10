import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createAnnouncementSchema, updateAnnouncementSchema } from "@/lib/validators/announcement";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { isBoardMember } from "@/lib/permissions";

export const announcementRouter = router({
  list: protectedProcedure
    .use(requirePermission("announcement:view"))
    .query(async ({ ctx }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];
      const isBoard = isBoardMember(userRoles);
      const isMember = userRoles.includes(Role.MEMBER) || isBoard;

      // Filter by scope based on user role
      const scopeFilter = isBoard
        ? {} // Board sees all
        : isMember
        ? { scope: { in: ["ALL" as const, "MEMBERS_ONLY" as const] } }
        : { scope: "ALL" as const };

      return ctx.db.announcement.findMany({
        where: {
          ...scopeFilter,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("announcement:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const announcement = await ctx.db.announcement.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      if (!announcement) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return announcement;
    }),

  create: protectedProcedure
    .use(requirePermission("announcement:create"))
    .input(createAnnouncementSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.announcement.create({
        data: {
          ...input,
          authorId: ctx.user.id,
          publishedAt: new Date(),
        },
      });
    }),

  update: protectedProcedure
    .use(requirePermission("announcement:create"))
    .input(updateAnnouncementSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.announcement.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .use(requirePermission("announcement:create"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.announcement.delete({ where: { id: input.id } });
    }),
});
