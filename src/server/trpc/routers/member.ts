import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { updateMemberSchema, addRoleSchema, removeRoleSchema } from "@/lib/validators/member";
import { TRPCError } from "@trpc/server";

export const memberRouter = router({
  list: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        include: {
          apartment: {
            select: {
              number: true,
              floor: true,
              area: true,
              share: true,
              monthlyFee: true,
              building: { select: { name: true } },
            },
          },
          roles: { where: { active: true }, select: { role: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          apartment: {
            include: { building: true },
          },
          roles: { where: { active: true }, select: { id: true, role: true, grantedAt: true } },
        },
      });
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      return member;
    }),

  update: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(updateMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.user.update({ where: { id }, data });
    }),

  addRole: protectedProcedure
    .use(requirePermission("admin:users"))
    .input(addRoleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userRole.upsert({
        where: { userId_role: { userId: input.userId, role: input.role } },
        update: { active: true },
        create: { userId: input.userId, role: input.role, grantedBy: ctx.user.id },
      });
    }),

  removeRole: protectedProcedure
    .use(requirePermission("admin:users"))
    .input(removeRoleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userRole.update({
        where: { userId_role: { userId: input.userId, role: input.role } },
        data: { active: false },
      });
    }),

  getApartments: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .query(async ({ ctx }) => {
      return ctx.db.apartment.findMany({
        include: { building: { select: { name: true } } },
        orderBy: [{ building: { name: "asc" } }, { number: "asc" }],
      });
    }),
});
