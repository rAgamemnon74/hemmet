import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const renovationRouter = router({
  list: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.renovationApplication.findMany({
        where: input?.status ? { status: input.status as never } : undefined,
        include: {
          apartment: { select: { number: true, building: { select: { name: true } } } },
          applicant: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Member submits renovation application
  submit: protectedProcedure
    .input(z.object({
      apartmentId: z.string(),
      type: z.enum(["KITCHEN", "BATHROOM", "FLOORING", "WALLS", "ELECTRICAL", "PLUMBING", "VENTILATION", "BALCONY", "OTHER"]),
      description: z.string().min(10),
      affectsStructure: z.boolean().default(false),
      affectsPlumbing: z.boolean().default(false),
      affectsElectrical: z.boolean().default(false),
      affectsVentilation: z.boolean().default(false),
      plannedStartDate: z.coerce.date().optional(),
      plannedEndDate: z.coerce.date().optional(),
      estimatedCost: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.renovationApplication.create({
        data: { ...input, applicantId: ctx.user.id as string },
      });

      logActivity({ userId: ctx.user.id as string, action: "renovation.submit", entityType: "RenovationApplication", entityId: result.id, description: `Renoveringsansökan: ${input.type}`, after: { type: input.type, affectsStructure: input.affectsStructure } });

      return result;
    }),

  // Property manager technical assessment
  technicalAssessment: protectedProcedure
    .use(requirePermission("report:manage"))
    .input(z.object({
      id: z.string(),
      technicalAssessment: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.renovationApplication.update({
        where: { id: input.id },
        data: {
          status: "BOARD_REVIEW",
          technicalAssessment: input.technicalAssessment,
          technicalAssessedBy: ctx.user.id as string,
          technicalAssessedAt: new Date(),
        },
      });

      logActivity({ userId: ctx.user.id as string, action: "renovation.technicalAssessment", entityType: "RenovationApplication", entityId: input.id, description: "Teknisk bedömning genomförd", before: { status: "SUBMITTED" }, after: { status: "BOARD_REVIEW" } });

      return result;
    }),

  // Board decision
  review: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({
      id: z.string(),
      status: z.enum(["APPROVED", "REJECTED"]),
      conditions: z.string().optional(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const app = await ctx.db.renovationApplication.findUnique({ where: { id: input.id } });
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.status === "REJECTED" && !input.rejectionReason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Motivering krävs vid avslag" });
      }

      const result = await ctx.db.renovationApplication.update({
        where: { id: input.id },
        data: {
          status: input.status,
          conditions: input.conditions,
          rejectionReason: input.rejectionReason,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id as string,
        },
      });

      notify({ userId: app.applicantId, title: input.status === "APPROVED" ? "Renovering godkänd" : "Renovering avslagen", body: input.status === "APPROVED" ? `Din renoveringsansökan har godkänts.${input.conditions ? ` Villkor: ${input.conditions}` : ""}` : `Din ansökan har avslagits: ${input.rejectionReason}`, link: "/min-sida" });

      logActivity({ userId: ctx.user.id as string, action: "renovation.review", entityType: "RenovationApplication", entityId: input.id, description: `${input.status === "APPROVED" ? "Godkände" : "Avslog"} renoveringsansökan`, before: { status: app.status }, after: { status: input.status } });

      return result;
    }),
});
