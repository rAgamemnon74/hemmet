import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().optional(),
  decisionId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "WAITING", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const createTaskCommentSchema = z.object({
  taskId: z.string(),
  content: z.string().min(1, "Kommentar krävs"),
});
