/**
 * Protokoll-huvud: vilka fält som visas per mötestyp.
 *
 * Sekreteraren kan konfigurera detta per mötestyp i /installningar.
 * Default: obligatoriska fält (1-6) på för alla typer.
 * Webb/e-post default på för stämma, av för styrelsemöten.
 */

import type { MeetingType } from "@prisma/client";

export type ProtocolHeaderFieldKey =
  | "name"           // Föreningens fullständiga namn
  | "orgNumber"      // Organisationsnummer
  | "seat"           // Säte (kommun)
  | "protocolNumber" // Protokollsreferens "Styrelseprotokoll nr N/ÅR"
  | "fiscalYear"     // Räkenskapsår
  | "address"        // Föreningens postadress
  | "website"        // Webbadress (stämma)
  | "email";         // E-post (stämma)

export type ProtocolHeaderFields = Record<ProtocolHeaderFieldKey, boolean>;

export type ProtocolHeaderConfig = Record<MeetingType, ProtocolHeaderFields>;

export const FIELD_LABELS: Record<ProtocolHeaderFieldKey, string> = {
  name: "Föreningens namn",
  orgNumber: "Organisationsnummer",
  seat: "Säte (kommun)",
  protocolNumber: "Protokollsreferens (nr/år)",
  fiscalYear: "Räkenskapsår",
  address: "Föreningens postadress",
  website: "Webbadress",
  email: "E-post",
};

export const FIELD_ORDER: ProtocolHeaderFieldKey[] = [
  "name", "orgNumber", "seat", "protocolNumber", "fiscalYear", "address", "website", "email",
];

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  BOARD: "Styrelsemöte",
  ANNUAL: "Ordinarie föreningsstämma",
  EXTRAORDINARY: "Extra föreningsstämma",
};

const ALL_CORE_ON: ProtocolHeaderFields = {
  name: true, orgNumber: true, seat: true,
  protocolNumber: true, fiscalYear: true, address: true,
  website: false, email: false,
};

const STAMMA_DEFAULTS: ProtocolHeaderFields = {
  ...ALL_CORE_ON,
  website: true,
  email: true,
};

export const DEFAULT_PROTOCOL_HEADER_CONFIG: ProtocolHeaderConfig = {
  BOARD: { ...ALL_CORE_ON },
  ANNUAL: { ...STAMMA_DEFAULTS },
  EXTRAORDINARY: { ...STAMMA_DEFAULTS },
};

/**
 * Säker parser — accepterar vad som än finns i DB:n och returnerar en komplett
 * config med defaults ifyllda. Då slipper vi null-checks varje gång.
 */
export function parseProtocolHeaderConfig(raw: unknown): ProtocolHeaderConfig {
  const fallback = DEFAULT_PROTOCOL_HEADER_CONFIG;
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Partial<Record<MeetingType, Partial<ProtocolHeaderFields>>>;
  const result = {} as ProtocolHeaderConfig;
  for (const type of ["BOARD", "ANNUAL", "EXTRAORDINARY"] as MeetingType[]) {
    result[type] = { ...fallback[type], ...(obj[type] ?? {}) };
  }
  return result;
}
