import { z } from "zod";

export const createSuggestionSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  description: z.string().min(1, "Beskrivning krävs"),
});

export const respondSuggestionSchema = z.object({
  id: z.string(),
  response: z.string().min(1, "Svar krävs"),
  status: z.enum(["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});
