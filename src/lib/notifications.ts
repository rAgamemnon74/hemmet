/**
 * Notification system — multi-channel (in-app, SMS, email).
 * Fire-and-forget: never blocks the calling request.
 *
 * SMS requires a provider configured via SMS_PROVIDER + SMS_API_KEY env vars.
 * Supported providers: twilio, 46elks, generic webhook.
 * If no provider configured, SMS falls back to in-app only.
 */

import { db } from "@/server/db";

type NotificationChannel = "in_app" | "sms" | "email";

type NotifyParams = {
  userId: string;
  title: string;
  body: string;
  link?: string;
  channels?: NotificationChannel[];  // Default: ["in_app"]
};

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/** Build a direct URL for SMS/email links */
function buildDirectLink(link?: string): string | undefined {
  if (!link) return undefined;
  if (link.startsWith("http")) return link;
  return `${BASE_URL}${link}`;
}

// ============================================================
// SMS Provider Abstraction
// ============================================================

interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

class TwilioProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !from) return;

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: message }),
    });
  }
}

class ElksProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    const apiKey = process.env.ELKS_API_KEY;
    const apiSecret = process.env.ELKS_API_SECRET;
    const from = process.env.ELKS_FROM ?? "Hemmet";
    if (!apiKey || !apiSecret) return;

    await fetch("https://api.46elks.com/a1/sms", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ to, from, message }),
    });
  }
}

function getSmsProvider(): SmsProvider | null {
  const provider = process.env.SMS_PROVIDER;
  if (provider === "twilio") return new TwilioProvider();
  if (provider === "46elks") return new ElksProvider();
  return null;
}

async function sendSms(userId: string, message: string): Promise<void> {
  const provider = getSmsProvider();
  if (!provider) {
    console.warn("SMS provider not configured — SMS notification skipped");
    return;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });

  if (!user?.phone) {
    console.warn(`No phone number for user ${userId} — SMS skipped`);
    return;
  }

  await provider.send(user.phone, message);
}

// ============================================================
// Core notification functions
// ============================================================

/** Notify a single user. Default channel: in-app. */
export function notify(params: NotifyParams) {
  const channels = params.channels ?? ["in_app"];
  const directLink = buildDirectLink(params.link);

  // Always create in-app notification
  if (channels.includes("in_app")) {
    db.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        body: params.body,
        link: params.link,
      },
    }).catch((err) => console.error("Failed to create notification:", err));
  }

  // Send SMS if requested
  if (channels.includes("sms")) {
    const smsBody = directLink
      ? `${params.title}: ${params.body}\n${directLink}`
      : `${params.title}: ${params.body}`;
    sendSms(params.userId, smsBody).catch((err) => console.error("Failed to send SMS:", err));
  }
}

/** Notify multiple users */
export function notifyMany(userIds: string[], params: Omit<NotifyParams, "userId">) {
  if (userIds.length === 0) return;

  const channels = params.channels ?? ["in_app"];

  if (channels.includes("in_app")) {
    db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: params.title,
        body: params.body,
        link: params.link,
      })),
    }).catch((err) => console.error("Failed to create notifications:", err));
  }

  if (channels.includes("sms")) {
    const directLink = buildDirectLink(params.link);
    const smsBody = directLink
      ? `${params.title}: ${params.body}\n${directLink}`
      : `${params.title}: ${params.body}`;
    for (const userId of userIds) {
      sendSms(userId, smsBody).catch((err) => console.error("SMS failed:", err));
    }
  }
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

// ============================================================
// Convenience: urgent notification (in-app + SMS)
// ============================================================

/** Send urgent notification via both in-app and SMS */
export function notifyUrgent(params: Omit<NotifyParams, "channels">) {
  notify({ ...params, channels: ["in_app", "sms"] });
}

/** Send urgent to multiple users */
export function notifyManyUrgent(userIds: string[], params: Omit<NotifyParams, "userId" | "channels">) {
  notifyMany(userIds, { ...params, channels: ["in_app", "sms"] });
}
