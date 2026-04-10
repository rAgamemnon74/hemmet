import { z } from "zod";

export const createApartmentSchema = z.object({
  number: z.string().min(1, "Lägenhetsnummer krävs"),
  buildingId: z.string().min(1, "Byggnad krävs"),
  floor: z.number().int().optional(),
  area: z.number().positive().optional(),
  rooms: z.number().positive().optional(),
  share: z.number().min(0).max(1).optional(),
  monthlyFee: z.number().min(0).optional(),
  objectNumber: z.string().optional(),
  type: z.enum(["APARTMENT", "COMMERCIAL", "GARAGE", "STORAGE", "OTHER"]).default("APARTMENT"),
  balcony: z.boolean().default(false),
  patio: z.boolean().default(false),
  storage: z.string().optional(),
  parking: z.string().optional(),
  notes: z.string().optional(),
});

export const updateApartmentSchema = z.object({
  id: z.string(),
  number: z.string().min(1).optional(),
  floor: z.number().int().optional().nullable(),
  area: z.number().positive().optional().nullable(),
  rooms: z.number().positive().optional().nullable(),
  share: z.number().min(0).max(1).optional().nullable(),
  monthlyFee: z.number().min(0).optional().nullable(),
  objectNumber: z.string().optional().nullable(),
  type: z.enum(["APARTMENT", "COMMERCIAL", "GARAGE", "STORAGE", "OTHER"]).optional(),
  balcony: z.boolean().optional(),
  patio: z.boolean().optional(),
  storage: z.string().optional().nullable(),
  parking: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
