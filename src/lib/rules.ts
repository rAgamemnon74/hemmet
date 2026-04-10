import { db } from "@/server/db";
import type { BrfRules } from "@prisma/client";

let cachedRules: BrfRules | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function getBrfRules(): Promise<BrfRules> {
  const now = Date.now();
  if (cachedRules && now - cacheTime < CACHE_TTL) {
    return cachedRules;
  }

  let rules = await db.brfRules.findUnique({ where: { id: "default" } });
  if (!rules) {
    rules = await db.brfRules.create({ data: {} });
  }

  cachedRules = rules;
  cacheTime = now;
  return rules;
}

export function invalidateRulesCache() {
  cachedRules = null;
  cacheTime = 0;
}
