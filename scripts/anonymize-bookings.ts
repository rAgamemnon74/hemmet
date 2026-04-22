/**
 * GDPR-gallring av bokningshistorik.
 *
 * Regel: bokningar vars slutdatum är äldre än 24 månader ska anonymiseras —
 * userId nollas, notes rensas, anonymizedAt sätts. Aggregatdata (resurs,
 * start/slut, pass) behålls för statistik och revision.
 *
 * Rättslig grund: art. 5(1)(e) GDPR — förvara inte personuppgifter längre
 * än nödvändigt. Boende som har flyttat har ingen anledning att finnas
 * kvar i föreningens bokningslogg för alltid. Styrelsen kan fortfarande
 * granska mönster (t.ex. "har någon bokat bastu väldigt ofta?") via de
 * senaste 24 månaderna.
 *
 * Körning:
 *   npx tsx scripts/anonymize-bookings.ts            # dry-run
 *   npx tsx scripts/anonymize-bookings.ts --apply    # skriv ändringar
 *
 * Schemalägg med cron på servern, t.ex. 03:15 varje natt:
 *   15 3 * * *  cd /opt/hemmet && npx tsx scripts/anonymize-bookings.ts --apply >> /var/log/hemmet-gdpr.log 2>&1
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const RETENTION_MONTHS = 24;

async function main() {
  const apply = process.argv.includes("--apply");
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);

  const candidates = await db.booking.findMany({
    where: {
      endTime: { lt: cutoff },
      userId: { not: null },
      anonymizedAt: null,
    },
    select: { id: true, startTime: true, endTime: true, userId: true, resourceId: true },
  });

  console.log(`GDPR-gallring bokningar (retention: ${RETENTION_MONTHS} mån)`);
  console.log(`Cutoff: ${cutoff.toISOString()}`);
  console.log(`Kandidater att anonymisera: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("Inget att göra.");
    await db.$disconnect();
    return;
  }

  if (!apply) {
    console.log("\nDRY-RUN — inga ändringar. Kör med --apply för att anonymisera.\n");
    for (const b of candidates.slice(0, 20)) {
      console.log(`  ${b.id}  resurs=${b.resourceId}  ${b.startTime.toISOString()}–${b.endTime.toISOString()}`);
    }
    if (candidates.length > 20) console.log(`  ...och ${candidates.length - 20} till`);
    await db.$disconnect();
    return;
  }

  const result = await db.booking.updateMany({
    where: { id: { in: candidates.map((c) => c.id) } },
    data: {
      userId: null,
      notes: null,
      anonymizedAt: new Date(),
    },
  });

  console.log(`Anonymiserade ${result.count} bokningar vid ${new Date().toISOString()}`);
  // Scriptets stdout fungerar som audit — omdirigera till logfil via cron.

  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
