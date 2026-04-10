import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { updateMemberSchema, addRoleSchema, removeRoleSchema } from "@/lib/validators/member";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { logPersonalDataAccess } from "@/lib/gdpr";

const BOARD_ROLES: Role[] = [
  Role.ADMIN, Role.BOARD_CHAIRPERSON, Role.BOARD_SECRETARY, Role.BOARD_TREASURER,
  Role.BOARD_PROPERTY_MGR, Role.BOARD_ENVIRONMENT, Role.BOARD_EVENTS,
  Role.BOARD_MEMBER, Role.BOARD_SUBSTITUTE,
];

export const memberRouter = router({
  list: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .query(async ({ ctx }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];
      const isBoardMember = userRoles.some((r) => BOARD_ROLES.includes(r));

      const members = await ctx.db.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          // Contact info only for board members
          ...(isBoardMember ? { email: true, phone: true } : {}),
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

      logPersonalDataAccess(ctx.user.id as string, "VIEW_REGISTRY");

      return { members, canSeeContact: isBoardMember };
    }),

  getById: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];
      const isBoardMember = userRoles.some((r) => BOARD_ROLES.includes(r));

      const member = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          ...(isBoardMember ? { email: true, phone: true } : {}),
          apartment: {
            include: { building: true },
          },
          roles: { where: { active: true }, select: { id: true, role: true, grantedAt: true } },
        },
      });
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });

      logPersonalDataAccess(ctx.user.id as string, "VIEW_MEMBER_DETAIL", input.id);

      return { member, canSeeContact: isBoardMember };
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
