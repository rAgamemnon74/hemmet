import { z } from "zod";

export const createDamageReportSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  description: z.string().min(1, "Beskrivning krävs"),
  location: z.string().min(1, "Plats krävs"),
  severity: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
  apartmentId: z.string().optional(),
});

export const updateDamageReportStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  resolution: z.string().optional(),
});

export const createReportCommentSchema = z.object({
  damageReportId: z.string(),
  content: z.string().min(1, "Kommentar krävs"),
  isInternal: z.boolean().default(false),
});

export const DAMAGE_LOCATIONS = [
  "Trapphus",
  "Tvättstuga",
  "Cykelrum",
  "Källare",
  "Garage",
  "Innergård",
  "Tak",
  "Fasad",
  "Hiss",
  "Entré",
  "Soprum",
  "Övrigt",
] as const;
