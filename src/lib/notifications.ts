/**
 * Notification utility — creates notifications for users.
 * Fire-and-forget: never blocks the calling request.
 */

import { db } from "@/server/db";

type NotifyParams = {
  userId: string;
  title: string;
  body: string;
  link?: string;
};

/** Notify a single user */
export function notify(params: NotifyParams) {
  db.notification.create({ data: params }).catch((err) => {
    console.error("Failed to create notification:", err);
  });
}

/** Notify multiple users */
export function notifyMany(userIds: string[], params: Omit<NotifyParams, "userId">) {
  if (userIds.length === 0) return;
  db.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...params })),
  }).catch((err) => {
    console.error("Failed to create notifications:", err);
  });
}

/** Notify all users with a specific role */
export async function notifyRole(role: string, params: Omit<NotifyParams, "userId">) {
  try {
    const users = await db.userRole.findMany({
      where: { role: role as never, active: true },
      select: { userId: true },
    });
    notifyMany(users.map((u) => u.userId), params);
  } catch (err) {
    console.error("Failed to notify role:", err);
  }
}
