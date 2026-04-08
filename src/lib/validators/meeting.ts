import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  type: z.enum(["BOARD", "ANNUAL", "EXTRAORDINARY"]),
  scheduledAt: z.coerce.date(),
  location: z.string().optional(),
  description: z.string().optional(),
});

export const updateMeetingSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Titel krävs").optional(),
  type: z.enum(["BOARD", "ANNUAL", "EXTRAORDINARY"]).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  scheduledAt: z.coerce.date().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

export const createAgendaItemSchema = z.object({
  meetingId: z.string(),
  title: z.string().min(1, "Titel krävs"),
  description: z.string().optional(),
  duration: z.number().int().positive().optional(),
  presenter: z.string().optional(),
  voteType: z.enum(["SIMPLE_MAJORITY", "QUALIFIED_MAJORITY", "UNANIMOUS", "SHOW_OF_HANDS", "BALLOT"]).optional().nullable(),
});

export const updateAgendaItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.number().int().positive().optional().nullable(),
  presenter: z.string().optional().nullable(),
  voteType: z.enum(["SIMPLE_MAJORITY", "QUALIFIED_MAJORITY", "UNANIMOUS", "SHOW_OF_HANDS", "BALLOT"]).optional().nullable(),
});

export const reorderAgendaSchema = z.object({
  meetingId: z.string(),
  itemIds: z.array(z.string()),
});

export const updateAttendanceSchema = z.object({
  meetingId: z.string(),
  userId: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "PROXY"]),
  proxyFor: z.string().optional().nullable(),
});

export const upsertProtocolSchema = z.object({
  meetingId: z.string(),
  content: z.string(),
});

export const createDecisionSchema = z.object({
  meetingId: z.string(),
  agendaItemId: z.string().optional().nullable(),
  title: z.string().min(1, "Titel krävs"),
  description: z.string().min(1, "Beskrivning krävs"),
  decisionText: z.string().min(1, "Beslutstext krävs"),
});

export const castVoteSchema = z.object({
  agendaItemId: z.string(),
  choice: z.enum(["YES", "NO", "ABSTAIN"]),
});
