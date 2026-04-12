import { z } from "zod";

export const createContractSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  description: z.string().optional(),
  category: z.enum(["SERVICE", "INSURANCE", "FINANCIAL", "MANAGEMENT", "UTILITY", "PROJECT", "CONSULTING", "OTHER"]),
  contractorId: z.string().optional(),
  counterpartyName: z.string().min(1, "Motpart krävs"),
  counterpartyOrg: z.string().optional(),
  counterpartyEmail: z.string().optional(),
  counterpartyPhone: z.string().optional(),
  documentUrl: z.string().optional(),
  isFrameworkAgreement: z.boolean().default(false),
  annualCeiling: z.number().optional(),
  annualCost: z.number().optional(),
  totalValue: z.number().optional(),
  paymentTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  autoRenewal: z.boolean().default(false),
  renewalPeriodMonths: z.number().int().optional(),
  noticePeriodMonths: z.number().int().optional(),
  mandateLevel: z.enum(["DELEGATED", "BOARD", "ANNUAL_MEETING"]).default("BOARD"),
  decisionRef: z.string().optional(),
  warrantyMonths: z.number().int().optional(),
  pubAgreement: z.boolean().default(false),
  notes: z.string().optional(),
});

export const updateContractSchema = z.object({
  id: z.string(),
}).merge(createContractSchema.partial());

export const createCallOffSchema = z.object({
  contractId: z.string(),
  description: z.string().min(1, "Beskrivning krävs"),
  estimatedCost: z.number().optional(),
  damageReportId: z.string().optional(),
  inspectionId: z.string().optional(),
});
