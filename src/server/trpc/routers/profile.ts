import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { logActivity } from "@/lib/audit";
import { TRPCError } from "@trpc/server";
import { hash, compare } from "bcryptjs";

export const profileRouter = router({
  // Get own profile — available to all authenticated users
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id as string;

    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        apartment: {
          select: {
            id: true,
            number: true,
            floor: true,
            area: true,
            rooms: true,
            share: true,
            monthlyFee: true,
            balcony: true,
            patio: true,
            storage: true,
            parking: true,
            building: { select: { name: true, address: true } },
          },
        },
        roles: { where: { active: true }, select: { role: true } },
        consents: { select: { type: true, granted: true, grantedAt: true, revokedAt: true } },
      },
    });

    return user;
  }),

  // Update own profile (namn, e-post, telefon)
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email("Ogiltig e-post").optional(),
        phone: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;

      // Om e-posten ändras — kolla att den inte är upptagen
      if (input.email) {
        const existing = await ctx.db.user.findUnique({
          where: { email: input.email },
          select: { id: true },
        });
        if (existing && existing.id !== userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "E-postadressen används redan av en annan användare",
          });
        }
      }

      const before = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true, phone: true },
      });

      const updated = await ctx.db.user.update({
        where: { id: userId },
        data: input,
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      });

      logActivity({
        userId,
        action: "profile.update",
        entityType: "User",
        entityId: userId,
        description: "Uppdaterade egen profil",
        before: before ?? undefined,
        after: input,
      });

      return updated;
    }),

  // Byt eget lösenord — kräver nuvarande lösenord för verifiering
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Ange nuvarande lösenord"),
        newPassword: z.string().min(8, "Nytt lösenord måste vara minst 8 tecken"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;

      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { passwordHash: true },
      });

      // Kontrollera nuvarande lösenord
      const ok = await compare(input.currentPassword, user.passwordHash);
      if (!ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Fel nuvarande lösenord",
        });
      }

      // Förhindra att samma lösenord återanvänds
      if (input.currentPassword === input.newPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nytt lösenord måste vara annat än det nuvarande",
        });
      }

      const newHash = await hash(input.newPassword, 12);
      await ctx.db.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      logActivity({
        userId,
        action: "profile.changePassword",
        entityType: "User",
        entityId: userId,
        description: "Bytte eget lösenord",
      });

      return { success: true };
    }),

  // Update consent settings
  setConsent: protectedProcedure
    .input(
      z.object({
        type: z.enum(["CONTACT_SHARING", "DIGITAL_COMMUNICATION", "PHOTO_PUBLICATION"]),
        granted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      return ctx.db.userConsent.upsert({
        where: { userId_type: { userId, type: input.type } },
        update: {
          granted: input.granted,
          grantedAt: input.granted ? new Date() : null,
          revokedAt: input.granted ? null : new Date(),
        },
        create: {
          userId,
          type: input.type,
          granted: input.granted,
          grantedAt: input.granted ? new Date() : null,
        },
      });
    }),

  // Get own issues (damage reports, suggestions, motions)
  getMyIssues: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id as string;

    const [damageReports, suggestions, motions] = await Promise.all([
      ctx.db.damageReport.findMany({
        where: { reporterId: userId },
        select: {
          id: true,
          title: true,
          status: true,
          severity: true,
          createdAt: true,
          resolvedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.db.suggestion.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          title: true,
          status: true,
          response: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.db.motion.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          meetingId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return { damageReports, suggestions, motions };
  }),
});
