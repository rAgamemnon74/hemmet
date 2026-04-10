import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  content: z.string().min(1, "Innehåll krävs"),
  scope: z.enum(["ALL", "MEMBERS_ONLY", "BOARD_ONLY"]).default("ALL"),
  pinned: z.boolean().default(false),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const updateAnnouncementSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  scope: z.enum(["ALL", "MEMBERS_ONLY", "BOARD_ONLY"]).optional(),
  pinned: z.boolean().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});
