/**
 * GDPR utilities for handling sensitive personal data.
 */

import { PersonalDataAction } from "@prisma/client";
import { db } from "@/server/db";

/**
 * Mask a Swedish personal ID number (personnummer).
 * Input: "YYYYMMDD-XXXX" or "YYMMDD-XXXX"
 * Output: "******-XXXX" (shows last 4 digits only)
 */
export function maskPersonalId(personalId: string | null | undefined): string {
  if (!personalId) return "—";
  const cleaned = personalId.replace(/\s/g, "");
  if (cleaned.length >= 4) {
    return "******-" + cleaned.slice(-4);
  }
  return "******";
}

/**
 * Log access to personal data. Fire-and-forget — never blocks the calling request.
 */
export function logPersonalDataAccess(
  userId: string,
  action: PersonalDataAction,
  targetUserId?: string | null,
  metadata?: string,
) {
  // Fire-and-forget: don't await, don't block the request
  db.personalDataAccessLog.create({
    data: {
      userId,
      action,
      targetUserId: targetUserId ?? undefined,
      metadata,
    },
  }).catch((err) => {
    console.error("Failed to log personal data access:", err);
  });
}
