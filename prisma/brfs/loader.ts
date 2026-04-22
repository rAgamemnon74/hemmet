/**
 * Generisk BRF-loader. Läser en YAML-mall (validerad mot brfYamlSchema)
 * och upsertar data i databasen idempotent.
 *
 * Används av:
 *   - CLI: prisma/brfs/cli.ts (manual eller hemmet-import-brf)
 *   - tRPC: settings.importBrf (admin-UI-uppladdning)
 *   - seed: prisma/seed.ts vid behov
 */

import { randomBytes } from "node:crypto";
import type { PrismaClient, Role, ResourceType as ResourceTypeDb } from "@prisma/client";
import { TYPE_DEFAULTS, getDefaultSlots } from "@/lib/resource-defaults";
import type { BrfYaml } from "./schema";

export type LoadOptions = {
  apply: boolean; // false = dry-run, ingen skrivning
};

export type LoadReport = {
  actions: string[];
  warnings: string[];
  errors: string[];
  stats: {
    settingsChanged: boolean;
    rulesChanged: boolean;
    propertyChanged: boolean;
    buildingsChanged: number;
    apartmentsCreated: number;
    resourcesChanged: number;
    slotsCreated: number;
    usersCreated: number;
    usersUpdated: number;
    staleUsersRemoved: number;
    auditorChanged: boolean;
  };
};

function unusablePasswordHash(): string {
  return `$invalid$${randomBytes(32).toString("hex")}`;
}

function placeholderEmail(domain: string, firstName: string, lastName: string): string {
  const slug = `${firstName} ${lastName}`
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}@${domain}`;
}

function hhmmToHourMinute(s: string): { hour: number; minute: number } {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  return { hour: h, minute: m };
}

export async function loadBrfFromYaml(
  db: PrismaClient,
  data: BrfYaml,
  options: LoadOptions,
): Promise<LoadReport> {
  const report: LoadReport = {
    actions: [],
    warnings: [],
    errors: [],
    stats: {
      settingsChanged: false, rulesChanged: false, propertyChanged: false,
      buildingsChanged: 0, apartmentsCreated: 0, resourcesChanged: 0,
      slotsCreated: 0, usersCreated: 0, usersUpdated: 0,
      staleUsersRemoved: 0, auditorChanged: false,
    },
  };

  const act = (s: string) => report.actions.push(s);
  const warn = (s: string) => report.warnings.push(s);

  const placeholderDomain = data.placeholderEmailDomain
    ?? `placeholder.${data.settings.orgNumber.replace(/\D/g, "")}.local`;

  // ─── 1. BrfSettings ─────────────────────────────────────────
  const settingsData = {
    name: data.settings.name,
    orgNumber: data.settings.orgNumber,
    registrationDate: data.settings.registrationDate ?? null,
    seat: data.settings.seat ?? null,
    signatoryRule: data.settings.signatoryRule ?? null,
    address: data.settings.address,
    city: data.settings.city,
    postalCode: data.settings.postalCode,
    phone: data.settings.phone ?? null,
    email: data.settings.email ?? null,
    website: data.settings.website ?? null,
    fiscalYearStart: data.settings.fiscalYearStart,
    fiscalYearEnd: data.settings.fiscalYearEnd,
    bankgiro: data.settings.bankgiro ?? null,
    plusgiro: data.settings.plusgiro ?? null,
    swish: data.settings.swish ?? null,
    propertyManager: data.settings.propertyManager ?? null,
    insuranceCompany: data.settings.insuranceCompany ?? null,
    stadgarUrl: data.settings.stadgarUrl ?? null,
    ordningsreglerUrl: data.settings.ordningsreglerUrl ?? null,
    protocolHeaderConfig: data.protocolHeader ?? undefined,
  };
  if (options.apply) {
    await db.brfSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...settingsData },
      update: settingsData,
    });
  }
  report.stats.settingsChanged = true;
  act(`BrfSettings → ${data.settings.name} (${data.settings.orgNumber})`);

  // ─── 2. BrfRules ────────────────────────────────────────────
  if (data.rules) {
    const rulesData = data.rules;
    if (options.apply) {
      await db.brfRules.upsert({
        where: { id: "default" },
        create: { id: "default", ...rulesData },
        update: rulesData,
      });
    }
    report.stats.rulesChanged = true;
    act(`BrfRules → affiliation=${rulesData.affiliation ?? "NONE"}`);
  }

  // ─── 3. Property ────────────────────────────────────────────
  let propertyId: string | null = null;
  if (data.property) {
    const p = data.property;
    const notes = p.totalApartments
      ? `Totalt ${p.totalApartments} lägenheter. ${p.totalArea ? `Total bostadsyta ${p.totalArea} m². ` : ""}${p.averageArea ? `Snittlägenhet ${p.averageArea} m².` : ""}`
      : null;
    if (options.apply) {
      const existing = await db.property.findFirst({
        where: { address: p.address, city: p.city },
      });
      const propertyData = {
        propertyDesignation: p.designation ?? null,
        postalCode: p.postalCode,
        notes,
      };
      const property = existing
        ? await db.property.update({ where: { id: existing.id }, data: propertyData })
        : await db.property.create({
            data: { address: p.address, city: p.city, ...propertyData },
          });
      propertyId = property.id;
    }
    report.stats.propertyChanged = true;
    act(`Property → ${p.address}, ${p.city}`);
  }

  // ─── 4. Buildings + lägenheter ──────────────────────────────
  for (const b of data.buildings) {
    if (!propertyId && options.apply) {
      warn(`Byggnad "${b.name}" — ingen Property konfigurerad, hoppar över`);
      continue;
    }
    const buildingData = {
      name: b.name,
      constructionYear: b.constructionYear ?? null,
      heatingType: b.heatingType ?? null,
      energyRating: b.energyRating ?? null,
    };
    if (options.apply && propertyId) {
      const existing = await db.building.findFirst({
        where: { propertyId, address: b.address },
      });
      const building = existing
        ? await db.building.update({ where: { id: existing.id }, data: buildingData })
        : await db.building.create({
            data: { ...buildingData, propertyId, address: b.address },
          });

      // Placeholder-lägenheter (address-prefix + löpnummer)
      if (b.apartmentCount > 0) {
        const entranceNr = b.address.replace(/^\D+/, ""); // "3", "27", "29"
        for (let i = 1; i <= b.apartmentCount; i++) {
          const number = `${entranceNr}-${i.toString().padStart(2, "0")}`;
          await db.apartment.upsert({
            where: { buildingId_number: { buildingId: building.id, number } },
            create: { buildingId: building.id, number },
            update: {},
          });
          report.stats.apartmentsCreated++;
        }
      }
    } else {
      report.stats.apartmentsCreated += b.apartmentCount;
    }
    report.stats.buildingsChanged++;
    act(`Building → ${b.name} (${b.apartmentCount} lgh)`);
  }

  // ─── 5. Bokningsresurser ────────────────────────────────────
  for (const r of data.bookableResources) {
    const defaults = TYPE_DEFAULTS[r.type as ResourceTypeDb];
    const bookingMode = r.bookingMode ?? defaults.bookingMode;
    const overrides = r.overrides ?? {};
    const resourceData = {
      name: r.name,
      type: r.type as ResourceTypeDb,
      description: r.description ?? null,
      location: r.location ?? null,
      groupLabel: r.groupLabel ?? null,
      bookingMode,
      maxDurationHours: defaults.maxDurationHours,
      advanceBookingDays: defaults.advanceBookingDays,
      reducedAdvanceBookingDays: defaults.reducedAdvanceBookingDays,
      priorityWindowDays: defaults.priorityWindowDays,
      cancelLockHours: defaults.cancelLockHours,
      maxActiveBookings: defaults.maxActiveBookings,
      maxBookingsPerPeriod: defaults.maxBookingsPerPeriod,
      periodDays: defaults.periodDays,
      maxConsecutiveUnits: defaults.maxConsecutiveUnits,
      openingHour: defaults.openingHour,
      closingHour: defaults.closingHour,
      active: true,
      ...overrides,
    };
    if (options.apply) {
      const existing = await db.bookableResource.findFirst({
        where: { type: r.type as ResourceTypeDb, name: r.name },
      });
      const resource = existing
        ? await db.bookableResource.update({ where: { id: existing.id }, data: resourceData })
        : await db.bookableResource.create({ data: resourceData });

      // Pass för SLOTS-resurser
      if (bookingMode === "SLOTS") {
        if (r.slotsPerDay && r.slotsPerDay.length > 0) {
          // Custom → ersätt alltid
          await db.resourceSlot.deleteMany({ where: { resourceId: resource.id } });
          const expanded = [];
          for (let dow = 0; dow < 7; dow++) {
            for (const s of r.slotsPerDay) {
              const { hour: sh, minute: sm } = hhmmToHourMinute(s.start);
              const { hour: eh, minute: em } = hhmmToHourMinute(s.end);
              expanded.push({
                resourceId: resource.id, dayOfWeek: dow,
                startHour: sh, startMinute: sm, endHour: eh, endMinute: em,
                label: s.label ?? null, active: true,
              });
            }
          }
          await db.resourceSlot.createMany({ data: expanded });
          report.stats.slotsCreated += expanded.length;
          act(`  ${r.name} → ${expanded.length} pass (egen mall)`);
        } else {
          // TYPE_DEFAULTS — skapa bara om inga finns
          const existingSlotCount = await db.resourceSlot.count({ where: { resourceId: resource.id } });
          if (existingSlotCount === 0) {
            const slots = getDefaultSlots(r.type as ResourceTypeDb);
            if (slots.length > 0) {
              await db.resourceSlot.createMany({
                data: slots.map((s) => ({ ...s, resourceId: resource.id, active: true })),
              });
              report.stats.slotsCreated += slots.length;
              act(`  ${r.name} → ${slots.length} standard-pass`);
            }
          }
        }
      }
    } else if (r.slotsPerDay && r.slotsPerDay.length > 0) {
      report.stats.slotsCreated += r.slotsPerDay.length * 7;
    }
    report.stats.resourcesChanged++;
    act(`BookableResource → ${r.name} (${r.type}, ${bookingMode})`);
  }

  // ─── 6. Förtroendevalda (placeholder-konton) ───────────────
  type Placeholder = {
    firstName: string; lastName: string; primaryRole: Role;
    birthYear?: number; address?: string | null;
  };
  const allPlaceholders: Placeholder[] = [
    ...data.board.map((m) => ({
      firstName: m.firstName, lastName: m.lastName,
      primaryRole: m.role as Role,
      birthYear: m.birthYear, address: m.address,
    })),
    ...data.nominatingCommittee.map((m) => ({
      firstName: m.firstName, lastName: m.lastName,
      primaryRole: m.role as Role, address: m.address,
    })),
  ];

  if (allPlaceholders.length > 0) {
    const desiredEmails = new Set(
      allPlaceholders.map((m) => placeholderEmail(placeholderDomain, m.firstName, m.lastName)),
    );

    if (options.apply) {
      // Städa bort stale platshållare
      const stale = await db.user.findMany({
        where: {
          email: { endsWith: `@${placeholderDomain}` },
          NOT: { email: { in: Array.from(desiredEmails) } },
        },
        select: { id: true, email: true },
      });
      if (stale.length > 0) {
        await db.user.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
        report.stats.staleUsersRemoved = stale.length;
        act(`Städade ${stale.length} stale platshållare`);
      }

      for (const m of allPlaceholders) {
        const email = placeholderEmail(placeholderDomain, m.firstName, m.lastName);
        const existing = await db.user.findUnique({ where: { email } });
        const user = existing
          ? await db.user.update({
              where: { id: existing.id },
              data: { firstName: m.firstName, lastName: m.lastName },
            })
          : await db.user.create({
              data: {
                email,
                passwordHash: unusablePasswordHash(),
                firstName: m.firstName,
                lastName: m.lastName,
              },
            });

        // Tilldela funktionell roll + RESIDENT
        for (const role of [m.primaryRole, "RESIDENT" as Role]) {
          await db.userRole.upsert({
            where: { userId_role: { userId: user.id, role } },
            create: { userId: user.id, role, active: true },
            update: { active: true },
          });
        }

        if (existing) report.stats.usersUpdated++;
        else report.stats.usersCreated++;
      }
    } else {
      report.stats.usersCreated = allPlaceholders.length;
    }

    for (const m of allPlaceholders) {
      const bornSuffix = m.birthYear ? ` (f ${m.birthYear})` : "";
      const addrSuffix = m.address ? `, ${m.address}` : "";
      act(`User → ${m.firstName} ${m.lastName}${bornSuffix}${addrSuffix} [${m.primaryRole} + RESIDENT]`);
    }
  }

  // ─── 7. Revisorsfirma ───────────────────────────────────────
  if (data.auditor) {
    const a = data.auditor;
    if (options.apply) {
      await db.organization.upsert({
        where: { orgNumber: a.orgNumber },
        create: {
          name: a.name, orgNumber: a.orgNumber,
          phone: a.phone ?? undefined,
          email: a.email ?? undefined,
          notes: a.website ? `Revisor. Webb: ${a.website}` : "Revisor",
        },
        update: {
          name: a.name,
          phone: a.phone ?? undefined,
          email: a.email ?? undefined,
        },
      });
    }
    report.stats.auditorChanged = true;
    act(`Organization → ${a.name} (${a.orgNumber}) — revisor`);
  }

  return report;
}
