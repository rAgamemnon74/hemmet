import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import {
  createAnnualReportSchema,
  updateAnnualReportSchema,
} from "@/lib/validators/annual-report";
import { TRPCError } from "@trpc/server";

export const annualReportRouter = router({
  list: protectedProcedure
    .use(requirePermission("annual_report:view"))
    .query(async ({ ctx }) => {
      return ctx.db.annualReport.findMany({
        include: {
          audit: {
            select: { id: true, status: true, recommendation: true, auditorId: true },
          },
        },
        orderBy: { fiscalYear: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("annual_report:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.db.annualReport.findUnique({
        where: { id: input.id },
        include: {
          audit: true,
        },
      });
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Årsberättelsen hittades inte" });
      }
      return report;
    }),

  create: protectedProcedure
    .use(requirePermission("annual_report:edit"))
    .input(createAnnualReportSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.annualReport.create({ data: input });
    }),

  update: protectedProcedure
    .use(requirePermission("annual_report:edit"))
    .input(updateAnnualReportSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.annualReport.update({
        where: { id },
        data: {
          ...data,
          ...(data.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
        },
      });
    }),

  sendToAudit: protectedProcedure
    .use(requirePermission("annual_report:edit"))
    .input(z.object({ id: z.string(), auditorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.annualReport.findUnique({
        where: { id: input.id },
        include: { audit: true },
      });
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });

      // Create audit record if not exists
      if (!report.audit) {
        await ctx.db.audit.create({
          data: {
            annualReportId: input.id,
            auditorId: input.auditorId,
          },
        });
      }

      return ctx.db.annualReport.update({
        where: { id: input.id },
        data: { status: "REVIEW" },
      });
    }),
});
