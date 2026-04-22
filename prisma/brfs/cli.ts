/**
 * CLI-entry för BRF-YAML-import. Kompileras till JS via esbuild i build-deb.sh
 * och anropas av /usr/sbin/hemmet-import-brf.
 *
 * Användning:
 *   hemmet-import-brf [--dry-run|--apply] /path/to/brf.yaml
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { brfYamlSchema } from "./schema";
import { loadBrfFromYaml } from "./loader";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");
  const filePath = args.find((a) => !a.startsWith("--"));

  if (!filePath) {
    console.error("Användning: hemmet-import-brf [--dry-run|--apply] /path/to/brf.yaml");
    process.exit(2);
  }

  if (apply && dryRun) {
    console.error("❌ --apply och --dry-run är ömsesidigt uteslutande");
    process.exit(2);
  }

  // Default är dry-run — admin måste explicit skriva --apply för att röra DB
  const shouldApply = apply && !dryRun;

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(`❌ Kunde inte läsa ${filePath}: ${(err as Error).message}`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    console.error(`❌ YAML-parsningsfel: ${(err as Error).message}`);
    process.exit(1);
  }

  const result = brfYamlSchema.safeParse(parsed);
  if (!result.success) {
    console.error("❌ YAML matchar inte schemat:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const data = result.data;
  const db = new PrismaClient();
  try {
    console.log(`\n▶ ${shouldApply ? "IMPORTERAR" : "DRY-RUN"}: ${data.settings.name} (${data.settings.orgNumber})`);
    if (!shouldApply) {
      console.log("   Lägg till --apply för att skriva till databasen.\n");
    } else {
      console.log("");
    }

    const report = await loadBrfFromYaml(db, data, { apply: shouldApply });

    for (const a of report.actions) console.log(`  ✓ ${a}`);
    if (report.warnings.length > 0) {
      console.log("\nVarningar:");
      for (const w of report.warnings) console.log(`  ⚠ ${w}`);
    }
    if (report.errors.length > 0) {
      console.log("\nFel:");
      for (const e of report.errors) console.log(`  ❌ ${e}`);
      process.exit(1);
    }

    console.log("");
    console.log("Sammanfattning:");
    console.log(`  BrfSettings:        ${report.stats.settingsChanged ? "uppdaterad" : "–"}`);
    console.log(`  BrfRules:           ${report.stats.rulesChanged ? "uppdaterad" : "–"}`);
    console.log(`  Property:           ${report.stats.propertyChanged ? "uppdaterad" : "–"}`);
    console.log(`  Buildings:          ${report.stats.buildingsChanged}`);
    console.log(`  Apartments:         ${report.stats.apartmentsCreated}`);
    console.log(`  Resources:          ${report.stats.resourcesChanged}`);
    console.log(`  Slots:              ${report.stats.slotsCreated}`);
    console.log(`  Users (skapade):    ${report.stats.usersCreated}`);
    console.log(`  Users (uppdat.):    ${report.stats.usersUpdated}`);
    console.log(`  Stale städade:      ${report.stats.staleUsersRemoved}`);
    console.log(`  Auditor:            ${report.stats.auditorChanged ? "ja" : "–"}`);
    console.log("");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
