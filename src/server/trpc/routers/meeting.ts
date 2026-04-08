import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createMeetingSchema, updateMeetingSchema } from "@/lib/validators/meeting";
import { TRPCError } from "@trpc/server";

export const meetingRouter = router({
  list: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(
      z.object({
        type: z.enum(["BOARD", "ANNUAL", "EXTRAORDINARY"]).optional(),
        status: z.enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.meeting.findMany({
        where: {
          type: input?.type,
          status: input?.status,
        },
        include: {
          _count: { select: { agendaItems: true, attendances: true, decisions: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        include: {
          agendaItems: {
            orderBy: { sortOrder: "asc" },
            include: {
              votes: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
              decisions: true,
            },
          },
          attendances: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
          protocol: true,
          decisions: {
            orderBy: { decidedAt: "asc" },
          },
          _count: { select: { documents: true } },
        },
      });

      if (!meeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mötet hittades inte" });
      }

      return meeting;
    }),

  create: protectedProcedure
    .use(requirePermission("meeting:create"))
    .input(createMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.meeting.create({
        data: {
          ...input,
          calledBy: ctx.user.id,
        },
      });
    }),

  update: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(updateMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.meeting.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .use(requirePermission("meeting:create"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({ where: { id: input.id } });
      if (!meeting) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (meeting.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan bara ta bort möten i utkast-status" });
      }
      return ctx.db.meeting.delete({ where: { id: input.id } });
    }),
});
