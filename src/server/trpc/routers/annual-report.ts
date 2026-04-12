import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import {
  createAnnualReportSchema,
  updateAnnualReportSchema,
} from "@/lib/validators/annual-report";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";

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

      // Fetch before-state for change tracking
      const before = await ctx.db.annualReport.findUnique({
        where: { id },
        select: { status: true, title: true, boardMembers: true, activities: true, maintenance: true, economy: true, futureOutlook: true },
      });
      if (!before) throw new TRPCError({ code: "NOT_FOUND" });

      // Block editing if sent to audit or beyond
      if (["REVIEW", "REVISED", "PUBLISHED"].includes(before.status) && !data.status) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Årsberättelsen kan inte redigeras i nuvarande status. Återkalla från revision först." });
      }

      const result = await ctx.db.annualReport.update({
        where: { id },
        data: {
          ...data,
          ...(data.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
        },
      });

      // Log changes with before/after per field
      const changedFields: Record<string, unknown> = {};
      const beforeFields: Record<string, unknown> = {};
      const fieldLabels: Record<string, string> = {
        title: "Titel", boardMembers: "Styrelsens sammansättning", activities: "Verksamhetsberättelse",
        maintenance: "Underhåll och förvaltning", economy: "Ekonomisk översikt", futureOutlook: "Framtida planer", status: "Status",
      };
      const descriptions: string[] = [];

      const beforeRec = before as Record<string, unknown>;
      const dataRec = data as Record<string, unknown>;
      for (const key of Object.keys(dataRec)) {
        if (key in beforeRec && dataRec[key] !== undefined && String(beforeRec[key]) !== String(dataRec[key])) {
          beforeFields[key] = beforeRec[key];
          changedFields[key] = dataRec[key];
          descriptions.push(fieldLabels[key] ?? key);
        }
      }

      if (descriptions.length > 0) {
        logActivity({
          userId: ctx.user.id as string,
          action: "annualReport.update",
          entityType: "AnnualReport",
          entityId: id,
          description: `Redigerade: ${descriptions.join(", ")}`,
          before: beforeFields,
          after: changedFields,
        });
      }

      return result;
    }),

  // Get change history for a report
  getHistory: protectedProcedure
    .use(requirePermission("annual_report:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db.activityLog.findMany({
        where: { entityType: "AnnualReport", entityId: input.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Resolve user names
      const userIds = [...new Set(logs.map((l) => l.userId))];
      const users = await ctx.db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

      return logs.map((l) => ({
        ...l,
        userName: userMap.get(l.userId) ?? l.userId,
      }));
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
