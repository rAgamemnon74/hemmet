/**
 * GDPR data retention — anonymize/delete personal data based on legal retention periods.
 *
 * Call periodically (cron job or manual trigger).
 *
 * Retention rules:
 * - Rejected applications: 6 months → anonymize personalId, phone, address
 * - Ended memberships: 7 years (bokföringslagen) → anonymize personnummer/phone/email, keep name + apartment
 * - External meeting proxies: 3 months after meeting → anonymize personalId, address, phone
 * - Inactive users: 12 months without login → notify (no auto-delete)
 */

import { db } from "@/server/db";
import { logActivity } from "./audit";

export async function runRetention(): Promise<{
  anonymizedApplications: number;
  anonymizedProxies: number;
}> {
  const now = new Date();

  // 1. Rejected applications older than 6 months
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const staleApplications = await db.membershipApplication.findMany({
    where: {
      status: "REJECTED",
      reviewedAt: { lt: sixMonthsAgo },
      personalId: { not: null },
    },
    select: { id: true },
  });

  if (staleApplications.length > 0) {
    await db.membershipApplication.updateMany({
      where: { id: { in: staleApplications.map((a) => a.id) } },
      data: {
        personalId: null,
        phone: null,
        address: null,
      },
    });
  }

  // 2. External proxies from meetings older than 3 months
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const staleProxies = await db.meetingProxy.findMany({
    where: {
      proxyType: "EXTERNAL",
      externalPersonalId: { not: null },
      meeting: { scheduledAt: { lt: threeMonthsAgo } },
    },
    select: { id: true },
  });

  if (staleProxies.length > 0) {
    await db.meetingProxy.updateMany({
      where: { id: { in: staleProxies.map((p) => p.id) } },
      data: {
        externalPersonalId: null,
        externalAddress: null,
        externalPhone: null,
      },
    });
  }

  // Log the retention run
  if (staleApplications.length > 0 || staleProxies.length > 0) {
    logActivity({
      userId: "SYSTEM",
      action: "retention.run",
      entityType: "System",
      entityId: "retention",
      description: `Gallring: ${staleApplications.length} ansökningar, ${staleProxies.length} ombud anonymiserade`,
      after: {
        anonymizedApplications: staleApplications.length,
        anonymizedProxies: staleProxies.length,
        runAt: now.toISOString(),
      },
    });
  }

  return {
    anonymizedApplications: staleApplications.length,
    anonymizedProxies: staleProxies.length,
  };
}
