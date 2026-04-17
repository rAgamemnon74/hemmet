import { z } from "zod";

// ── Egenkontroll ──────────────────────────────────────────────

export const createEgenkontrollSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  responsibilityDescription: z.string().optional(),
  riskAssessmentDescription: z.string().optional(),
  routinesDescription: z.string().optional(),
  chemicalInventoryNote: z.string().optional(),
  incidentRoutineNote: z.string().optional(),
  nextReviewDate: z.coerce.date().optional(),
});

export const updateEgenkontrollSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "UNDER_REVIEW", "ARCHIVED"]).optional(),
  responsibilityDescription: z.string().nullable().optional(),
  riskAssessmentDescription: z.string().nullable().optional(),
  routinesDescription: z.string().nullable().optional(),
  chemicalInventoryNote: z.string().nullable().optional(),
  incidentRoutineNote: z.string().nullable().optional(),
  nextReviewDate: z.coerce.date().nullable().optional(),
});

// ── Riskbedömning ─────────────────────────────────────���───────

export const createRiskAssessmentSchema = z.object({
  egenkontrollId: z.string().optional(),
  buildingId: z.string().optional(),
  title: z.string().min(1, "Titel krävs"),
  description: z.string().min(1, "Beskrivning krävs"),
  area: z.string().optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  probability: z.number().int().min(1).max(5).optional(),
  consequence: z.number().int().min(1).max(5).optional(),
  existingMeasures: z.string().optional(),
  plannedMeasures: z.string().optional(),
  responsibleUserId: z.string().optional(),
  nextReviewDate: z.coerce.date().optional(),
});

export const updateRiskAssessmentSchema = z.object({
  id: z.string(),
}).merge(createRiskAssessmentSchema.partial());

// ── Kemikalier ────────────────────────────────────────────────

export const createChemicalSchema = z.object({
  productName: z.string().min(1, "Produktnamn krävs"),
  manufacturer: z.string().optional(),
  articleNumber: z.string().optional(),
  safetyDataSheetUrl: z.string().url().optional().or(z.literal("")),
  hazardClasses: z.array(z.enum(["FLAMMABLE", "TOXIC", "CORROSIVE", "OXIDIZING", "ENVIRONMENTAL", "HEALTH_HAZARD", "OTHER"])).default([]),
  hazardStatements: z.string().optional(),
  riskPhrases: z.string().optional(),
  usageArea: z.string().optional(),
  storageLocation: z.string().optional(),
  annualQuantity: z.string().optional(),
  buildingId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateChemicalSchema = z.object({
  id: z.string(),
  active: z.boolean().optional(),
  lastVerifiedAt: z.coerce.date().optional(),
}).merge(createChemicalSchema.partial());

// ── Avfallsplan ───────────────────────────────────────────────

export const createWastePlanSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  municipality: z.string().optional(),
  sortingStations: z.string().optional(),
  collectionSchedule: z.string().optional(),
  hazardousWasteRoutine: z.string().optional(),
  hazardousWasteContractorId: z.string().optional(),
  recyclingRoomLocation: z.string().optional(),
  recyclingRoomRules: z.string().optional(),
  notes: z.string().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
});

export const updateWastePlanSchema = z.object({
  id: z.string(),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED"]).optional(),
  lastAuditDate: z.coerce.date().optional(),
  nextAuditDate: z.coerce.date().optional(),
}).merge(createWastePlanSchema.partial());

// ── Miljöincidenter ───────────────────────────────────────────

export const createIncidentSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  description: z.string().min(1, "Beskrivning krävs"),
  incidentType: z.string().min(1, "Typ krävs"),
  buildingId: z.string().optional(),
  location: z.string().optional(),
  occurredAt: z.coerce.date(),
  immediateMeasures: z.string().optional(),
});

export const updateIncidentSchema = z.object({
  id: z.string(),
  status: z.enum(["REPORTED", "INVESTIGATING", "REPORTED_TO_AUTHORITY", "RESOLVED", "CLOSED"]).optional(),
  reportedToAuthorityAt: z.coerce.date().optional(),
  authorityName: z.string().optional(),
  authorityReference: z.string().optional(),
  immediateMeasures: z.string().nullable().optional(),
  followUpMeasures: z.string().nullable().optional(),
  resolvedAt: z.coerce.date().optional(),
  resolution: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

// ── Hållbarhetsmål ────────────────────────────────────────────

export const createGoalSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  description: z.string().optional(),
  category: z.string().min(1, "Kategori krävs"),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  targetDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateGoalSchema = z.object({
  id: z.string(),
  achieved: z.boolean().optional(),
}).merge(createGoalSchema.partial());
