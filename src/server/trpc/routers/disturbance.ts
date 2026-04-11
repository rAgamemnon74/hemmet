import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";

export const disturbanceRouter = router({
  list: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.disturbanceCase.findMany({
        where: input?.status ? { status: input.status as never } : undefined,
        include: {
          reportedBy: { select: { firstName: true, lastName: true } },
          targetApartment: { select: { number: true, building: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Any member/resident can report
  report: protectedProcedure
    .input(z.object({
      type: z.enum(["NOISE", "SMOKE", "THREATS", "PROPERTY_DAMAGE", "COMMON_AREA_MISUSE", "PETS", "WASTE", "OTHER"]),
      description: z.string().min(10),
      location: z.string().optional(),
      targetApartmentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.disturbanceCase.create({
        data: { ...input, reportedById: ctx.user.id as string },
      });

      logActivity({ userId: ctx.user.id as string, action: "disturbance.report", entityType: "DisturbanceCase", entityId: result.id, description: `Störningsanmälan: ${input.type}`, after: { type: input.type } });

      return result;
    }),

  // Board updates status (warning timeline)
  updateStatus: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({
      id: z.string(),
      status: z.enum(["ACKNOWLEDGED", "FIRST_WARNING", "SECOND_WARNING", "BOARD_REVIEW", "RESOLVED", "ESCALATED", "CLOSED"]),
      resolution: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.disturbanceCase.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const userId = ctx.user.id as string;
      const data: Record<string, unknown> = { status: input.status };

      if (input.status === "ACKNOWLEDGED") { data.acknowledgedAt = new Date(); data.acknowledgedBy = userId; }
      if (input.status === "FIRST_WARNING") { data.firstWarningAt = new Date(); data.firstWarningBy = userId; }
      if (input.status === "SECOND_WARNING") { data.secondWarningAt = new Date(); data.secondWarningBy = userId; }
      if (input.status === "RESOLVED" || input.status === "CLOSED") { data.resolvedAt = new Date(); data.resolvedBy = userId; data.resolution = input.resolution; }

      const result = await ctx.db.disturbanceCase.update({ where: { id: input.id }, data });

      logActivity({ userId, action: "disturbance.updateStatus", entityType: "DisturbanceCase", entityId: input.id, description: `Status: ${existing.status} → ${input.status}`, before: { status: existing.status }, after: { status: input.status } });

      return result;
    }),
});
