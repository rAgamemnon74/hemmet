import { z } from "zod";

export const updateMemberSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  apartmentId: z.string().optional().nullable(),
});

export const addRoleSchema = z.object({
  userId: z.string(),
  role: z.enum([
    "ADMIN", "BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER",
    "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS",
    "BOARD_SUBSTITUTE", "BOARD_MEMBER", "AUDITOR", "MEMBER", "RESIDENT",
  ]),
});

export const removeRoleSchema = z.object({
  userId: z.string(),
  role: z.enum([
    "ADMIN", "BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER",
    "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS",
    "BOARD_SUBSTITUTE", "BOARD_MEMBER", "AUDITOR", "MEMBER", "RESIDENT",
  ]),
});
