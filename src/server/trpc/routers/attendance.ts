import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { updateAttendanceSchema } from "@/lib/validators/meeting";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";

const BOARD_ROLES: Role[] = [
  Role.BOARD_CHAIRPERSON, Role.BOARD_SECRETARY, Role.BOARD_TREASURER,
  Role.BOARD_PROPERTY_MGR, Role.BOARD_ENVIRONMENT, Role.BOARD_EVENTS,
  Role.BOARD_MEMBER, Role.BOARD_SUBSTITUTE,
];

export const attendanceRouter = router({
  update: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(updateAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.meetingAttendance.upsert({
        where: {
          meetingId_userId: {
            meetingId: input.meetingId,
            userId: input.userId,
          },
        },
        update: {
          status: input.status,
          proxyFor: input.proxyFor,
          arrivedAt: input.status === "PRESENT" ? new Date() : null,
        },
        create: {
          meetingId: input.meetingId,
          userId: input.userId,
          status: input.status,
          proxyFor: input.proxyFor,
          arrivedAt: input.status === "PRESENT" ? new Date() : null,
        },
      });
    }),

  // Self-registration: any logged-in user can mark themselves present
  selfRegister: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
        select: { id: true, type: true, status: true },
      });
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "Mötet hittades inte" });
      if (meeting.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mötet är inte pågående" });
      }

      if (meeting.type === "BOARD") {
        // Verify user is a board member (roles available on session from JWT)
        const userRoles = (ctx.user.roles ?? []) as Role[];
        const isBoardMember = userRoles.some((r) => BOARD_ROLES.includes(r));
        if (!isBoardMember) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Du är inte styrelsemedlem" });
        }

        return ctx.db.meetingAttendance.upsert({
          where: { meetingId_userId: { meetingId: input.meetingId, userId } },
          update: { status: "PRESENT", arrivedAt: new Date() },
          create: { meetingId: input.meetingId, userId, status: "PRESENT", arrivedAt: new Date() },
        });
      } else {
        // Annual/extraordinary: check in via voter registry
        const registry = await ctx.db.voterRegistry.findFirst({
          where: { meetingId: input.meetingId },
        });
        if (!registry) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ingen röstlängd har skapats för detta möte" });
        }
        if (registry.locked) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Röstlängden är låst" });
        }

        await ctx.db.voterRegistryEntry.upsert({
          where: { voterRegistryId_memberId: { voterRegistryId: registry.id, memberId: userId } },
          update: { checkedIn: true, checkedInAt: new Date() },
          create: { voterRegistryId: registry.id, memberId: userId, checkedIn: true, checkedInAt: new Date(), votingShares: 1 },
        });

        return { success: true };
      }
    }),

  // Meeting info for the self-registration page (no meeting:view permission needed)
  getMeetingForRegistration: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          scheduledAt: true,
          location: true,
          attendances: {
            where: { userId },
            select: { status: true },
          },
        },
      });
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "Mötet hittades inte" });

      // Check if already registered (voter registry for annual)
      let checkedInViaRegistry = false;
      if (meeting.type !== "BOARD") {
        const entry = await ctx.db.voterRegistryEntry.findFirst({
          where: {
            voterRegistry: { meetingId: input.meetingId },
            memberId: userId,
            checkedIn: true,
          },
        });
        checkedInViaRegistry = !!entry;
      }

      const isPresent =
        meeting.attendances.some((a) => a.status === "PRESENT" || a.status === "PROXY") ||
        checkedInViaRegistry;

      return {
        id: meeting.id,
        title: meeting.title,
        type: meeting.type,
        status: meeting.status,
        scheduledAt: meeting.scheduledAt,
        location: meeting.location,
        isPresent,
      };
    }),

  getBoardMembers: protectedProcedure
    .use(requirePermission("meeting:view"))
    .query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        where: {
          roles: {
            some: {
              role: { in: [...BOARD_ROLES] },
              active: true,
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          roles: { where: { active: true }, select: { role: true } },
        },
      });
    }),
});
