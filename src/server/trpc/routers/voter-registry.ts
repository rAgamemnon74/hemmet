import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import {
  createVoterRegistrySchema,
  checkInMemberSchema,
  lockRegistrySchema,
  registerProxySchema,
  approveProxySchema,
} from "@/lib/validators/voter-registry";
import { TRPCError } from "@trpc/server";
import { getBrfRules } from "@/lib/rules";

export const voterRegistryRouter = router({
  // Get registry for a meeting (creates if not exists for digital)
  getByMeeting: protectedProcedure
    .use(requirePermission("annual:view"))
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const registry = await ctx.db.voterRegistry.findUnique({
        where: { meetingId: input.meetingId },
        include: {
          entries: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
      return registry;
    }),

  create: protectedProcedure
    .use(requirePermission("annual:schedule"))
    .input(createVoterRegistrySchema)
    .mutation(async ({ ctx, input }) => {
      // Verify meeting is ANNUAL or EXTRAORDINARY
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
      });
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
      if (meeting.type === "BOARD") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Röstlängd krävs bara för årsmöten och extra stämmor" });
      }

      return ctx.db.voterRegistry.upsert({
        where: { meetingId: input.meetingId },
        update: { method: input.method, notes: input.notes },
        create: {
          meetingId: input.meetingId,
          method: input.method,
          notes: input.notes,
        },
      });
    }),

  // Digital check-in: member signs in
  checkIn: protectedProcedure
    .use(requirePermission("annual:view"))
    .input(checkInMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const registry = await ctx.db.voterRegistry.findUnique({
        where: { id: input.voterRegistryId },
      });
      if (!registry) throw new TRPCError({ code: "NOT_FOUND" });
      if (registry.locked) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Röstlängden är låst" });
      }

      return ctx.db.voterRegistryEntry.upsert({
        where: {
          voterRegistryId_memberId: {
            voterRegistryId: input.voterRegistryId,
            memberId: input.memberId,
          },
        },
        update: {
          checkedIn: true,
          checkedInAt: new Date(),
          votingShares: input.votingShares,
          notes: input.notes,
        },
        create: {
          voterRegistryId: input.voterRegistryId,
          memberId: input.memberId,
          checkedIn: true,
          checkedInAt: new Date(),
          votingShares: input.votingShares,
          notes: input.notes,
        },
      });
    }),

  // Self check-in for logged-in member
  selfCheckIn: protectedProcedure
    .use(requirePermission("annual:vote"))
    .input(z.object({ voterRegistryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const registry = await ctx.db.voterRegistry.findUnique({
        where: { id: input.voterRegistryId },
        include: { meeting: { select: { status: true } } },
      });
      if (!registry) throw new TRPCError({ code: "NOT_FOUND" });
      if (registry.locked) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Röstlängden är låst" });
      }
      if (registry.meeting.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mötet måste vara pågående" });
      }

      return ctx.db.voterRegistryEntry.upsert({
        where: {
          voterRegistryId_memberId: {
            voterRegistryId: input.voterRegistryId,
            memberId: ctx.user.id,
          },
        },
        update: {
          checkedIn: true,
          checkedInAt: new Date(),
        },
        create: {
          voterRegistryId: input.voterRegistryId,
          memberId: ctx.user.id,
          checkedIn: true,
          checkedInAt: new Date(),
        },
      });
    }),

  lock: protectedProcedure
    .use(requirePermission("annual:schedule"))
    .input(lockRegistrySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.voterRegistry.update({
        where: { id: input.id },
        data: {
          locked: true,
          lockedAt: new Date(),
          lockedBy: ctx.user.id,
        },
      });
    }),

  unlock: protectedProcedure
    .use(requirePermission("annual:schedule"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.voterRegistry.update({
        where: { id: input.id },
        data: { locked: false, lockedAt: null, lockedBy: null },
      });
    }),

  // === PROXY MANAGEMENT ===

  listProxies: protectedProcedure
    .use(requirePermission("annual:view"))
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.meetingProxy.findMany({
        where: { meetingId: input.meetingId },
        orderBy: { registeredAt: "desc" },
      });
    }),

  registerProxy: protectedProcedure
    .use(requirePermission("annual:vote"))
    .input(registerProxySchema)
    .mutation(async ({ ctx, input }) => {
      const rules = await getBrfRules();
      const { meetingId, memberId, proxyType, ...proxyData } = input;

      // Validate: max proxies per person
      if (rules.maxProxiesPerPerson > 0 && proxyType === "MEMBER" && input.proxyMemberId) {
        const existingProxies = await ctx.db.meetingProxy.count({
          where: {
            meetingId,
            proxyMemberId: input.proxyMemberId,
            memberId: { not: memberId }, // Don't count self-replacement
          },
        });
        if (existingProxies >= rules.maxProxiesPerPerson) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Ombudet företräder redan ${existingProxies} medlem(mar). Enligt stadgarna får ett ombud företräda högst ${rules.maxProxiesPerPerson} medlem(mar).`,
          });
        }
      }

      // Validate: proxy circle restriction
      if (rules.proxyCircleRestriction && proxyType === "EXTERNAL") {
        // When circle restriction is on, check that external proxy has a valid relation
        // For now: require board approval for all external proxies (already handled below)
        // A full implementation would validate relation field against allowed types
      }

      return ctx.db.meetingProxy.upsert({
        where: {
          meetingId_memberId: { meetingId, memberId },
        },
        update: {
          proxyType,
          ...proxyData,
          registeredBy: ctx.user.id,
          approved: proxyType === "MEMBER",
          approvedAt: proxyType === "MEMBER" ? new Date() : null,
        },
        create: {
          meetingId,
          memberId,
          proxyType,
          ...proxyData,
          registeredBy: ctx.user.id,
          approved: proxyType === "MEMBER",
          approvedAt: proxyType === "MEMBER" ? new Date() : null,
        },
      });
    }),

  approveProxy: protectedProcedure
    .use(requirePermission("annual:schedule"))
    .input(approveProxySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.meetingProxy.update({
        where: { id: input.id },
        data: {
          approved: true,
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        },
      });
    }),

  removeProxy: protectedProcedure
    .use(requirePermission("annual:vote"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.meetingProxy.delete({ where: { id: input.id } });
    }),

  // Get members for registry (members with MEMBER role)
  getMembers: protectedProcedure
    .use(requirePermission("annual:view"))
    .query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        where: {
          roles: {
            some: {
              role: "MEMBER",
              active: true,
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          apartment: {
            select: {
              number: true,
              share: true,
              building: { select: { name: true } },
            },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    }),
});
