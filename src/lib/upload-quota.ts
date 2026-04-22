/**
 * Resursskydd för uppladdningar.
 *
 * - Per-användare rate-limiting (token bucket, in-memory)
 * - Per-användare total kvot (räknad från DB)
 * - Global disk-space-check på uploads-katalogen
 */

import { statfs } from "fs/promises";
import type { PrismaClient } from "@prisma/client";
import { getUploadDir } from "./upload";

// ─── Rate limiting (in-memory token bucket) ────────────────────────────────

const UPLOADS_PER_MINUTE = 20;      // max uploads per minut per användare
const BUCKET_CAPACITY = UPLOADS_PER_MINUTE;

type Bucket = { tokens: number; lastRefill: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(userId: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(userId) ?? { tokens: BUCKET_CAPACITY, lastRefill: now };

  // Fyll på baserat på tid sedan senaste refill
  const elapsedMs = now - bucket.lastRefill;
  const refillRate = UPLOADS_PER_MINUTE / 60000; // tokens/ms
  const tokensToAdd = elapsedMs * refillRate;
  bucket.tokens = Math.min(BUCKET_CAPACITY, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    buckets.set(userId, bucket);
    // Hur lång tid tills nästa token?
    const msUntilToken = (1 - bucket.tokens) / refillRate;
    return { ok: false, retryAfterSec: Math.ceil(msUntilToken / 1000) };
  }

  bucket.tokens -= 1;
  buckets.set(userId, bucket);
  return { ok: true };
}

// Städar bort inaktiva buckets periodiskt (undvik minnesläckage vid många users)
setInterval(() => {
  const now = Date.now();
  const TTL = 60 * 60 * 1000; // 1 timme
  for (const [userId, bucket] of buckets) {
    if (now - bucket.lastRefill > TTL) {
      buckets.delete(userId);
    }
  }
}, 5 * 60 * 1000).unref(); // unref så processen kan avslutas om detta är sista timern

// ─── Per-användare total kvot ──────────────────────────────────────────────

const USER_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB totalt per användare

export async function checkUserQuota(
  db: PrismaClient,
  userId: string,
  newFileSize: number,
): Promise<{ ok: true; used: number; limit: number } | { ok: false; used: number; limit: number }> {
  const aggregate = await db.document.aggregate({
    where: { uploadedById: userId },
    _sum: { fileSize: true },
  });
  const used = aggregate._sum.fileSize ?? 0;
  const ok = used + newFileSize <= USER_QUOTA_BYTES;
  return { ok, used, limit: USER_QUOTA_BYTES };
}

// ─── Global disk-kontroll ─────────────────────────────────────────────────

const DISK_MIN_FREE_BYTES = 1024 * 1024 * 1024; // 1 GB min fri yta

export async function checkDiskSpace(category: string, neededBytes: number): Promise<{ ok: true } | { ok: false; freeBytes: number }> {
  try {
    const dir = getUploadDir(category);
    // Om katalogen inte finns än, kolla överliggande
    const stats = await statfs(dir).catch(async () => {
      const parent = dir.split("/").slice(0, -1).join("/");
      return statfs(parent);
    });
    const freeBytes = Number(stats.bavail) * Number(stats.bsize);
    const ok = freeBytes - neededBytes >= DISK_MIN_FREE_BYTES;
    return ok ? { ok: true } : { ok: false, freeBytes };
  } catch {
    // Om vi inte kan läsa disk-info, släpp igenom (fail-open för att undvika falska positiv)
    return { ok: true };
  }
}
