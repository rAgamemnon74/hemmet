/**
 * Activity audit trail — logs all board member actions with before/after state.
 * Fire-and-forget: never blocks the calling request.
 */

import { db } from "@/server/db";

type LogParams = {
  userId: string;
  action: string;        // "meeting.update", "expense.approve", "protocol.finalize"
  entityType: string;    // "Meeting", "Expense", "Protocol"
  entityId: string;
  description?: string;  // "Ändrade mötesstatus från DRAFT till SCHEDULED"
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

export function logActivity(params: LogParams) {
  db.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      before: params.before ? JSON.stringify(params.before) : null,
      after: params.after ? JSON.stringify(params.after) : null,
    },
  }).catch((err) => {
    console.error("Failed to log activity:", err);
  });
}

/**
 * Helper: compute changed fields between two objects.
 * Returns only fields that differ, with before/after values.
 */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};

  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changedBefore[key] = b;
      changedAfter[key] = a;
    }
  }

  return { before: changedBefore, after: changedAfter };
}
