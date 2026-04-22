/**
 * Hemmet bootstrap — idempotent grunddata för nyinstallation.
 *
 * Körs av hemmet-setup efter prisma migrate deploy. Kan köras flera gånger
 * utan biverkningar — skapar bara saker som saknas.
 *
 * Skapar:
 *   - BrfSettings (id="default")     tom skelett-post, admin fyller via UI
 *   - BrfRules    (id="default")     Prisma-defaults (svensk BRL-standard)
 *   - ADMIN-användare                admin@hemmet.local med slumpat lösenord,
 *                                    skrivs EN gång till stdout och sparas i
 *                                    /var/lib/hemmet/initial-admin-credentials
 *                                    (chmod 0600, root-only)
 */

const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_FILE = "/var/lib/hemmet/initial-admin-credentials";

async function main() {
  const db = new PrismaClient();
  try {
    // ── BrfSettings ──────────────────────────────────────────
    await db.brfSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        name: "Namnlös bostadsrättsförening",
        orgNumber: "",
        address: "",
        city: "",
        postalCode: "",
      },
    });
    console.log("✓ BrfSettings id=default OK");

    // ── BrfRules ─────────────────────────────────────────────
    await db.brfRules.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
    console.log("✓ BrfRules id=default OK (Prisma-defaults)");

    // ── Admin-användare om inga finns ────────────────────────
    const userCount = await db.user.count();
    if (userCount > 0) {
      console.log(`✓ ${userCount} användare finns redan — hoppar över admin-skapande`);
      return;
    }

    // Generera 16-teckens slumpat lösenord (alfanumeriskt, undvik oläsliga tecken)
    const password = crypto
      .randomBytes(16)
      .toString("base64")
      .replace(/[+/=]/g, "")
      .slice(0, 16);
    const passwordHash = await hash(password, 12);
    const email = "admin@hemmet.local";

    const admin = await db.user.create({
      data: {
        email,
        firstName: "Admin",
        lastName: "Hemmet",
        passwordHash,
      },
    });
    await db.userRole.create({
      data: { userId: admin.id, role: "ADMIN" },
    });

    // Skriv till fil för att underlätta vid automatiserade installationer
    try {
      fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
      fs.writeFileSync(
        CREDENTIALS_FILE,
        `email=${email}\npassword=${password}\ncreated=${new Date().toISOString()}\n`,
        { mode: 0o600 },
      );
    } catch (err) {
      console.warn(`(kunde inte skriva ${CREDENTIALS_FILE}: ${err.message})`);
    }

    // Skriv ut i stora bokstäver så det syns
    console.log("");
    console.log("============================================================");
    console.log("  INITIALT ADMIN-KONTO SKAPAT");
    console.log("");
    console.log(`    E-post:    ${email}`);
    console.log(`    Lösenord:  ${password}`);
    console.log("");
    console.log("  Logga in direkt och byt lösenord + e-post via /min-sida.");
    console.log(`  Uppgifterna finns sparade i ${CREDENTIALS_FILE}`);
    console.log("  (chmod 0600 — radera efter första inloggning).");
    console.log("============================================================");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("Bootstrap misslyckades:", err);
  process.exit(1);
});
