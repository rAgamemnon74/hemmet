/**
 * DEV-ONLY: sätter ett känt testlösenord på alla platshållar-konton
 * så man effektivt kan testa systemet som olika förtroendevalda.
 *
 * KÖR ALDRIG I PRODUKTION.
 *
 * Kör:
 *   npx tsx scripts/dev-set-placeholder-passwords.ts
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();
const DEV_PASSWORD = "password123";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Vägrar köra i produktionsmiljö.");
    process.exit(1);
  }

  const passwordHash = await hash(DEV_PASSWORD, 12);
  // Hittar alla platshållar-konton oavsett förening. Loadern sätter email till
  // <slug>@<placeholderEmailDomain> där domänen typiskt är "placeholder.<domän>".
  const users = await db.user.findMany({
    where: { email: { contains: "@placeholder." } },
    select: { id: true, email: true },
  });

  console.log(`Sätter lösenord "${DEV_PASSWORD}" på ${users.length} platshållar-konton:`);
  for (const u of users) {
    await db.user.update({
      where: { id: u.id },
      data: { passwordHash },
    });
    console.log(`  ✓ ${u.email}`);
  }

  await db.$disconnect();
  console.log("\nKlart. Nu kan du logga in som vilken styrelse-/valberednings-medlem som helst med lösenord 'password123'.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
