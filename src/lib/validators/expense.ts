import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive("Beloppet måste vara positivt"),
  description: z.string().min(1, "Beskrivning krävs"),
  category: z.string().min(1, "Kategori krävs"),
  receiptUrl: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  id: z.string(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  receiptUrl: z.string().optional().nullable(),
});

export const approveExpenseSchema = z.object({
  id: z.string(),
});

export const rejectExpenseSchema = z.object({
  id: z.string(),
  rejectionNote: z.string().min(1, "Ange anledning till avslag"),
});

export const EXPENSE_CATEGORIES = [
  "Underhåll",
  "Trädgård",
  "Administration",
  "Städning",
  "Reparation",
  "Försäkring",
  "Material",
  "Representation",
  "Övrigt",
] as const;
