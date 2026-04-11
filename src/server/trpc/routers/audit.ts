import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { submitAuditSchema, updateAuditSchema } from "@/lib/validators/annual-report";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { logPersonalDataAccess } from "@/lib/gdpr";

export const auditRouter = router({
  getByReportId: protectedProcedure
    .use(requirePermission("audit:view"))
    .input(z.object({ annualReportId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.audit.findUnique({
        where: { annualReportId: input.annualReportId },
        include: {
          annualReport: {
            select: { id: true, fiscalYear: true, title: true, status: true },
          },
        },
      });
    }),

  startReview: protectedProcedure
    .use(requirePermission("audit:perform"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const audit = await ctx.db.audit.findUnique({ where: { id: input.id } });
      if (!audit) throw new TRPCError({ code: "NOT_FOUND" });
      if (audit.auditorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bara tilldelad revisor kan granska" });
      }
      return ctx.db.audit.update({
        where: { id: input.id },
        data: { status: "IN_PROGRESS" },
      });
    }),

  submit: protectedProcedure
    .use(requirePermission("audit:perform"))
    .input(submitAuditSchema)
    .mutation(async ({ ctx, input }) => {
      const audit = await ctx.db.audit.findUnique({
        where: { annualReportId: input.annualReportId },
      });
      if (!audit) throw new TRPCError({ code: "NOT_FOUND" });
      if (audit.auditorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Bara tilldelad revisor kan lämna revisionsberättelse" });
      }

      await ctx.db.audit.update({
        where: { id: audit.id },
        data: {
          statement: input.statement,
          recommendation: input.recommendation,
          findings: input.findings,
          financialReview: input.financialReview,
          boardReview: input.boardReview,
          status: "COMPLETED",
          submittedAt: new Date(),
        },
      });

      // Update annual report status
      await ctx.db.annualReport.update({
        where: { id: input.annualReportId },
        data: { status: "REVISED" },
      });

      return { ok: true };
    }),

  update: protectedProcedure
    .use(requirePermission("audit:perform"))
    .input(updateAuditSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.audit.update({
        where: { id },
        data,
      });
    }),

  getAuditors: protectedProcedure
    .use(requirePermission("annual_report:edit"))
    .query(async ({ ctx }) => {
      return ctx.db.user.findMany({
        where: {
          roles: {
            some: { role: "AUDITOR", active: true },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
    }),

  // Export audit materials for external auditor
  exportMaterials: protectedProcedure
    .use(requirePermission("audit:perform"))
    .input(z.object({ fiscalYear: z.string() }))
    .query(async ({ ctx, input }) => {
      const [annualReport, expenses, meetings, decisions] = await Promise.all([
        ctx.db.annualReport.findUnique({
          where: { fiscalYear: input.fiscalYear },
          include: { audit: true },
        }),
        ctx.db.expense.findMany({
          where: { status: "PAID" },
          select: { id: true, description: true, amount: true, category: true, submittedAt: true, approvedAt: true, paidAt: true },
          orderBy: { paidAt: "desc" },
        }),
        ctx.db.meeting.findMany({
          where: { status: "COMPLETED", type: "BOARD" },
          select: { id: true, title: true, scheduledAt: true, _count: { select: { decisions: true } } },
          orderBy: { scheduledAt: "desc" },
        }),
        ctx.db.decision.findMany({
          select: { id: true, reference: true, title: true, decidedAt: true, method: true },
          orderBy: { decidedAt: "desc" },
        }),
      ]);

      logActivity({ userId: ctx.user.id as string, action: "audit.exportMaterials", entityType: "AuditExport", entityId: input.fiscalYear, description: `Exporterade revisionsunderlag för ${input.fiscalYear}` });
      logPersonalDataAccess(ctx.user.id as string, "VIEW_REGISTRY", null, `audit-export:${input.fiscalYear}`);

      return { annualReport, expenses, meetings, decisions, exportedAt: new Date() };
    }),
});
