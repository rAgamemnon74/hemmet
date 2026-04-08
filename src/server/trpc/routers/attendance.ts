import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { updateAttendanceSchema } from "@/lib/validators/meeting";

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

  getBoardMembers: protectedProcedure
    .use(requirePermission("meeting:view"))
    .query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        where: {
          roles: {
            some: {
              role: { in: ["BOARD_CHAIRPERSON", "BOARD_TREASURER", "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS", "BOARD_MEMBER", "BOARD_SUBSTITUTE"] },
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
