import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { submitAuditSchema, updateAuditSchema } from "@/lib/validators/annual-report";
import { TRPCError } from "@trpc/server";

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
});
