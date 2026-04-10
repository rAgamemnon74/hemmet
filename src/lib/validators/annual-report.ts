import { z } from "zod";

export const createAnnualReportSchema = z.object({
  fiscalYear: z.string().min(1, "Räkenskapsår krävs"),
  title: z.string().min(1, "Titel krävs"),
  boardMembers: z.string().min(1, "Styrelsens sammansättning krävs"),
  activities: z.string().min(1, "Verksamhetsberättelse krävs"),
  maintenance: z.string().optional(),
  economy: z.string().optional(),
  futureOutlook: z.string().optional(),
});

export const updateAnnualReportSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  boardMembers: z.string().optional(),
  activities: z.string().optional(),
  maintenance: z.string().optional().nullable(),
  economy: z.string().optional().nullable(),
  futureOutlook: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "REVIEW", "REVISED", "APPROVED", "PUBLISHED"]).optional(),
});

export const submitAuditSchema = z.object({
  annualReportId: z.string(),
  statement: z.string().min(1, "Revisionsberättelse krävs"),
  recommendation: z.enum(["APPROVE", "APPROVE_WITH_REMARKS", "DENY"]),
  findings: z.string().optional(),
  financialReview: z.string().optional(),
  boardReview: z.string().optional(),
});

export const updateAuditSchema = z.object({
  id: z.string(),
  statement: z.string().optional(),
  recommendation: z.enum(["APPROVE", "APPROVE_WITH_REMARKS", "DENY"]).optional(),
  findings: z.string().optional().nullable(),
  financialReview: z.string().optional().nullable(),
  boardReview: z.string().optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
});
