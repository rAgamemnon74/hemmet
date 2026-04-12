import { z } from "zod";

export const createProcurementSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  description: z.string().optional(),
  category: z.enum(["PHYSICAL", "SERVICE", "IT_DIGITAL", "FINANCIAL", "INSURANCE", "UTILITY"]).default("PHYSICAL"),
  urgency: z.enum(["ACUTE", "PLANNED", "EXPLORATORY"]).optional(),
  estimatedCost: z.number().optional(),
  isRecurringCost: z.boolean().default(false),
  annualEstimate: z.number().optional(),
  quotesDeadline: z.date().optional(),
  plannedStart: z.date().optional(),
  plannedEnd: z.date().optional(),
  triggerType: z.string().optional(),
  triggerId: z.string().optional(),
  triggerTitle: z.string().optional(),
});

export const updateProcurementSchema = z.object({
  id: z.string(),
}).merge(createProcurementSchema.partial());

export const approveProcurementSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  mandateLevel: z.enum(["DELEGATED", "BOARD", "ANNUAL_MEETING"]),
  estimatedCost: z.number().optional(),
  quotesDeadline: z.date().optional(),
  decisionNote: z.string().optional(),
});

export const addQuoteSchema = z.object({
  procurementId: z.string(),
  contractorId: z.string().optional(),
  companyName: z.string().min(1, "Företagsnamn krävs"),
  orgNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  amount: z.number().optional(),
  amountExVat: z.number().optional(),
  annualCost: z.number().optional(),
  validUntil: z.date().optional(),
  proposedStart: z.date().optional(),
  proposedEnd: z.date().optional(),
  contractLength: z.number().int().optional(),
  noticePeriod: z.number().int().optional(),
  warrantyMonths: z.number().int().optional(),
  paymentTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  conditions: z.string().optional(),
});

export const updateQuoteSchema = z.object({
  id: z.string(),
}).merge(addQuoteSchema.omit({ procurementId: true }).partial());

export const selectQuoteSchema = z.object({
  procurementId: z.string(),
  quoteId: z.string(),
  decisionNote: z.string().optional(),
  createContract: z.boolean().default(false),
});

export const addNoteSchema = z.object({
  procurementId: z.string(),
  content: z.string().min(1, "Notering krävs"),
});
