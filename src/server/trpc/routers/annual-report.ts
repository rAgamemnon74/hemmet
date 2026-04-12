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

  // Upload final PDF
  uploadFinalPdf: protectedProcedure
    .use(requirePermission("annual_report:edit"))
    .input(z.object({
      id: z.string(),
      pdfUrl: z.string(),
      pdfName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.annualReport.update({
        where: { id: input.id },
        data: {
          finalPdfUrl: input.pdfUrl,
          finalPdfName: input.pdfName,
          finalUploadedAt: new Date(),
          finalUploadedBy: ctx.user.id as string,
          status: "FINAL_UPLOADED",
          signedBy: [],
          allSigned: false,
        },
      });
      logActivity({ userId: ctx.user.id as string, action: "annualReport.uploadPdf", entityType: "AnnualReport", entityId: input.id, description: `Laddade upp slutprodukt: ${input.pdfName}` });
      return result;
    }),

  // Sign the final PDF (board members)
  sign: protectedProcedure
    .use(requirePermission("annual_report:edit"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id as string;
      const report = await ctx.db.annualReport.findUnique({ where: { id: input.id } });
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });

      if (!report.finalPdfUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ingen slutprodukt uppladdad att signera." });
      }
      if (report.signedBy.includes(userId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Du har redan signerat." });
      }

      const newSignedBy = [...report.signedBy, userId];

      // Check if all ordinarie board members have signed
      const boardMembers = await ctx.db.userRole.findMany({
        where: {
          role: { in: ["BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER", "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS", "BOARD_MEMBER"] },
          active: true,
        },
        select: { userId: true },
      });
      const requiredSigners = [...new Set(boardMembers.map((r) => r.userId))];
      const allSigned = requiredSigners.every((id) => newSignedBy.includes(id));

      const result = await ctx.db.annualReport.update({
        where: { id: input.id },
        data: {
          signedBy: newSignedBy,
          signedAt: new Date(),
          allSigned,
          ...(allSigned ? { status: "SIGNED" } : {}),
        },
      });

      logActivity({ userId, action: "annualReport.sign", entityType: "AnnualReport", entityId: input.id, description: `Signerade årsberättelsen${allSigned ? " (alla har signerat)" : ""}`, before: { signedBy: report.signedBy }, after: { signedBy: newSignedBy } });

      return result;
    }),

  // Get signers status
  getSigningStatus: protectedProcedure
    .use(requirePermission("annual_report:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.db.annualReport.findUnique({
        where: { id: input.id },
        select: { signedBy: true, allSigned: true },
      });
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });

      const boardMembers = await ctx.db.userRole.findMany({
        where: {
          role: { in: ["BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER", "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS", "BOARD_MEMBER"] },
          active: true,
        },
        select: { userId: true },
      });
      const requiredIds = [...new Set(boardMembers.map((r) => r.userId))];
      const users = await ctx.db.user.findMany({
        where: { id: { in: requiredIds } },
        select: { id: true, firstName: true, lastName: true },
      });

      return users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        signed: report.signedBy.includes(u.id),
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

      // Kräv att slutprodukten är signerad
      if (!report.allSigned) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Årsberättelsen måste vara signerad av alla ordinarie styrelsemedlemmar innan den skickas till revision.",
        });
      }

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
