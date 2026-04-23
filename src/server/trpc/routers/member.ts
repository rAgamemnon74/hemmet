import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { updateMemberSchema, addRoleSchema, removeRoleSchema } from "@/lib/validators/member";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { logPersonalDataAccess } from "@/lib/gdpr";
import { logActivity } from "@/lib/audit";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";

function generateTempPassword(): string {
  // 16 tecken, alfanumeriskt (undvik tecken som är svåra att skriva på mobil)
  return randomBytes(16).toString("base64").replace(/[+/=]/g, "").slice(0, 16);
}

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
      const before = await ctx.db.user.findUnique({
        where: { id },
        select: { firstName: true, lastName: true, email: true, phone: true, apartmentId: true },
      });
      const updated = await ctx.db.user.update({ where: { id }, data });
      logActivity({
        userId: ctx.user.id as string,
        action: "user.update",
        entityType: "User",
        entityId: id,
        description: `Uppdaterade användare: ${updated.firstName} ${updated.lastName}`,
        before: before ?? undefined,
        after: data,
      });
      return updated;
    }),

  // Log CSV export (called by client before downloading)
  logExport: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .mutation(async ({ ctx }) => {
      logPersonalDataAccess(ctx.user.id as string, "EXPORT_CSV");
      logActivity({
        userId: ctx.user.id as string,
        action: "member.exportCsv",
        entityType: "MemberRegistry",
        entityId: "export",
        description: "Exporterade medlemsregistret till CSV",
      });
      return { ok: true };
    }),

  // Register member exit (voluntary or exclusion)
  registerExit: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(z.object({
      userId: z.string(),
      reason: z.enum(["VOLUNTARY", "EXCLUSION", "DEATH"]),
      exitDate: z.coerce.date().optional(),
      documentId: z.string().optional(),   // Scannat brev/beslut
      decisionId: z.string().optional(),   // Styrelsebeslut (vid uteslutning)
    }))
    .mutation(async ({ ctx, input }) => {
      const exitDate = input.exitDate ?? new Date();

      await ctx.db.$transaction(async (tx) => {
        // Deactivate all ownerships
        await tx.apartmentOwnership.updateMany({
          where: { userId: input.userId, active: true },
          data: { active: false, transferredAt: exitDate },
        });

        // Deactivate MEMBER role
        await tx.userRole.updateMany({
          where: { userId: input.userId, role: "MEMBER", active: true },
          data: { active: false },
        });

        // Mark user as exited
        await tx.user.update({
          where: { id: input.userId },
          data: {
            exitedAt: exitDate,
            exitReason: input.reason,
            exitDocumentId: input.documentId,
            apartmentId: null,
          },
        });
      });

      const reasonLabels: Record<string, string> = {
        VOLUNTARY: "Frivilligt utträde",
        EXCLUSION: "Uteslutning (förverkande)",
        DEATH: "Dödsfall",
      };

      logActivity({
        userId: ctx.user.id as string,
        action: "member.exit",
        entityType: "User",
        entityId: input.userId,
        description: `Medlemsutträde: ${reasonLabels[input.reason]}`,
        after: { exitReason: input.reason, exitDate: exitDate.toISOString(), decisionId: input.decisionId },
      });

      return { success: true };
    }),

  // Skapa ny användare (admin-only). Om initialPassword utelämnas genereras
  // ett slumpat lösenord som returneras EN gång för visning.
  create: protectedProcedure
    .use(requirePermission("admin:users"))
    .input(z.object({
      email: z.string().email("Ogiltig e-post"),
      firstName: z.string().min(1, "Förnamn krävs"),
      lastName: z.string().min(1, "Efternamn krävs"),
      phone: z.string().optional().nullable(),
      initialPassword: z.string().min(8, "Lösenord måste vara minst 8 tecken").optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Kontrollera att e-posten inte är upptagen
      const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `En användare med e-post ${input.email} finns redan`,
        });
      }

      const password = input.initialPassword ?? generateTempPassword();
      const passwordHash = await hash(password, 12);
      const wasGenerated = !input.initialPassword;

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? undefined,
          passwordHash,
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      logActivity({
        userId: ctx.user.id as string,
        action: "user.create",
        entityType: "User",
        entityId: user.id,
        description: `Skapade användare: ${user.firstName} ${user.lastName} (${user.email})`,
        after: { email: user.email, firstName: user.firstName, lastName: user.lastName, passwordGenerated: wasGenerated },
      });

      return {
        user,
        // Returneras bara EN gång; admin visar det för den nya användaren
        initialPassword: wasGenerated ? password : null,
      };
    }),

  // Återställ/sätt lösenord (admin-only). Om newPassword utelämnas genereras
  // ett slumpat lösenord som returneras EN gång. Användarens aktiva sessioner
  // invalideras inte automatiskt (kräver AUTH_SECRET-rotation för det).
  setPassword: protectedProcedure
    .use(requirePermission("admin:users"))
    .input(z.object({
      userId: z.string(),
      newPassword: z.string().min(8, "Lösenord måste vara minst 8 tecken").optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Admin kan inte återställa sitt eget lösenord här (gör det via /min-sida)
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Använd /min-sida för att byta ditt eget lösenord",
        });
      }

      const target = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      const password = input.newPassword ?? generateTempPassword();
      const passwordHash = await hash(password, 12);
      const wasGenerated = !input.newPassword;

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { passwordHash },
      });

      logActivity({
        userId: ctx.user.id as string,
        action: "user.resetPassword",
        entityType: "User",
        entityId: input.userId,
        description: `Återställde lösenord för ${target.firstName} ${target.lastName} (${target.email})`,
        after: { passwordGenerated: wasGenerated },
      });

      return {
        user: target,
        newPassword: wasGenerated ? password : null,
      };
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
