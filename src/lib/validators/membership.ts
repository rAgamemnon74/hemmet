import { z } from "zod";

export const submitApplicationSchema = z.object({
  apartmentId: z.string().min(1, "Lägenhet krävs"),
  firstName: z.string().min(1, "Förnamn krävs"),
  lastName: z.string().min(1, "Efternamn krävs"),
  personalId: z.string().optional(),
  email: z.string().email("Ogiltig e-postadress"),
  phone: z.string().optional(),
  address: z.string().optional(),
  ownershipShare: z.number().min(0.01, "Ägarandel krävs").max(1, "Max 100%"),
  transferFrom: z.string().optional(),
  transferPrice: z.number().min(0).optional(),
  transferDate: z.coerce.date().optional(),
});

export const reviewApplicationSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
  boardNotes: z.string().optional(),
  decisionId: z.string().optional(),  // Koppling till styrelsebeslut (Decision)
});
