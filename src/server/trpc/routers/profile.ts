import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { logPersonalDataAccess } from "@/lib/gdpr";

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

  // Update own contact info
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      return ctx.db.user.update({
        where: { id: userId },
        data: input,
        select: { id: true, firstName: true, lastName: true, phone: true },
      });
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
