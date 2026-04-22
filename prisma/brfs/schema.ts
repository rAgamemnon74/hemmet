/**
 * BRF YAML-mallschema. Definierar formatet som `hemmet-import-brf` och
 * admin-UI:ets "Importera BRF-mall" accepterar.
 *
 * Schema-version 1.0 — framtida breaking changes bumpar major.
 */

import { z } from "zod";

// ─── Enumer — speglar Prisma-enumer men som string-literals för YAML ───

const MeetingAffiliation = z.enum(["HSB", "RIKSBYGGEN", "SBC", "OTHER", "NONE"]);

const ResourceType = z.enum([
  "LAUNDRY", "SAUNA", "GUEST_APARTMENT", "PARTY_ROOM",
  "PARKING", "HOBBY_ROOM", "OTHER",
]);

const ResourceBookingMode = z.enum(["FREEFORM", "SLOTS", "DAYS"]);

const BoardRole = z.enum([
  "BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER",
  "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS",
  "BOARD_MEMBER", "BOARD_SUBSTITUTE",
]);

const NominatingRole = z.enum([
  "NOMINATING_COMMITTEE", "NOMINATING_COMMITTEE_CHAIR",
]);

const MeetingType = z.enum(["BOARD", "ANNUAL", "EXTRAORDINARY"]);

// ─── Delscheman ──────────────────────────────────────────────

export const settingsSchema = z.object({
  name: z.string().min(1, "Föreningsnamn krävs"),
  orgNumber: z.string().regex(/^\d{6}-\d{4}$/, "Org.nr måste ha formatet 123456-7890"),
  registrationDate: z.coerce.date().optional().nullable(),
  seat: z.string().optional().nullable(),
  signatoryRule: z.string().optional().nullable(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  fiscalYearStart: z.number().int().min(1).max(12).default(1),
  fiscalYearEnd: z.number().int().min(1).max(12).default(12),
  bankgiro: z.string().optional().nullable(),
  plusgiro: z.string().optional().nullable(),
  swish: z.string().optional().nullable(),
  propertyManager: z.string().optional().nullable(),
  insuranceCompany: z.string().optional().nullable(),
  stadgarUrl: z.string().url().optional().nullable(),
  ordningsreglerUrl: z.string().url().optional().nullable(),
});

export const rulesSchema = z.object({
  affiliation: MeetingAffiliation.default("NONE"),
  reservedBoardSeats: z.number().int().min(0).optional(),
  reservedBoardSubstitutes: z.number().int().min(0).optional(),
  reservedAuditorSeats: z.number().int().min(0).optional(),
  minBoardMembers: z.number().int().min(1).optional(),
  maxBoardMembers: z.number().int().min(1).optional(),
  maxBoardSubstitutes: z.number().int().min(0).optional(),
  allowExternalBoardMembers: z.number().int().min(0).optional(),
  noticePeriodMinWeeks: z.number().int().min(1).optional(),
  noticePeriodMaxWeeks: z.number().int().min(1).optional(),
  noticeMethodDigital: z.boolean().optional(),
  allowDigitalMeeting: z.boolean().optional(),
  maxProxiesPerPerson: z.number().int().min(0).optional(),
  proxyCircleRestriction: z.boolean().optional(),
  proxyMaxValidityMonths: z.number().int().min(1).optional(),
  blankVoteExcluded: z.boolean().optional(),
  secretBallotOnDemand: z.boolean().optional(),
  tieBreakerChairperson: z.boolean().optional(),
  tieBreakerLotteryForElection: z.boolean().optional(),
  adjustersCount: z.number().int().min(1).max(2).optional(),
  transferFeeMaxPercent: z.number().min(0).max(100).optional(),
  pledgeFeeMaxPercent: z.number().min(0).max(100).optional(),
  subletFeeMaxPercent: z.number().min(0).max(100).optional(),
  transferFeePaidBySeller: z.boolean().optional(),
  minAuditors: z.number().int().min(1).optional(),
  maxAuditors: z.number().int().min(1).optional(),
  maxAuditorSubstitutes: z.number().int().min(0).optional(),
  requireAuthorizedAuditor: z.boolean().optional(),
  maintenancePlanRequired: z.boolean().optional(),
  maintenancePlanYears: z.number().int().min(1).optional(),
  maxOwnershipPercent: z.number().min(0).max(200).optional(),
  subletRequiresApproval: z.boolean().optional(),
  nominatingCommitteeSize: z.number().int().min(1).optional(),
}).passthrough(); // tillåt extra BrfRules-fält utan att schemat måste bumpas

export const propertySchema = z.object({
  designation: z.string().optional().nullable(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  totalArea: z.number().positive().optional(),
  averageArea: z.number().positive().optional(),
  totalApartments: z.number().int().positive().optional(),
});

export const buildingSchema = z.object({
  name: z.string(),
  address: z.string(),
  constructionYear: z.number().int().min(1800).max(2100).optional(),
  heatingType: z.string().optional().nullable(),
  energyRating: z.string().optional().nullable(),
  apartmentCount: z.number().int().min(0).default(0),
});

// Slot-mall — tider skrivs som "HH:MM" för läsbarhet
const slotPerDaySchema = z.object({
  start: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
  end: z.string().regex(/^([01]?\d|2[0-4]):[0-5]\d$/, "Format HH:MM"),
  label: z.string().optional().nullable(),
});

export const bookableResourceSchema = z.object({
  name: z.string(),
  type: ResourceType,
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  groupLabel: z.string().optional().nullable(),
  bookingMode: ResourceBookingMode.optional(),
  // Fältspecifika overrides — om utelämnat används TYPE_DEFAULTS
  overrides: z.object({
    maxDurationHours: z.number().int().positive().optional(),
    openingHour: z.number().int().min(0).max(23).optional().nullable(),
    closingHour: z.number().int().min(1).max(24).optional().nullable(),
    advanceBookingDays: z.number().int().positive().optional(),
    reducedAdvanceBookingDays: z.number().int().positive().optional().nullable(),
    maxActiveBookings: z.number().int().positive().optional().nullable(),
    maxBookingsPerPeriod: z.number().int().positive().optional().nullable(),
    periodDays: z.number().int().positive().optional().nullable(),
    maxConsecutiveUnits: z.number().int().positive().optional().nullable(),
    priorityWindowDays: z.number().int().positive().optional().nullable(),
    cancelLockHours: z.number().int().min(0).optional().nullable(),
  }).passthrough().optional(),
  // Custom slots per dag — expandteras till alla 7 veckodagar av importern
  slotsPerDay: z.array(slotPerDaySchema).optional(),
});

export const boardMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthYear: z.number().int().min(1900).max(2100).optional(),
  role: BoardRole,
  address: z.string().optional().nullable(),
  legalFirst: z.string().optional().nullable(), // legalt fullständigt förnamn
});

export const nominatingMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: NominatingRole,
  address: z.string().optional().nullable(),
});

export const auditorSchema = z.object({
  name: z.string(),
  orgNumber: z.string().regex(/^\d{6}-\d{4}$/),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
});

export const protocolHeaderSchema = z.record(
  MeetingType,
  z.record(z.string(), z.boolean()),
).optional();

// ─── Rot-schemat ─────────────────────────────────────────────

export const brfYamlSchema = z.object({
  schema: z.literal("1.0"),
  // För spårbarhet vid idempotent upsert — unik email-domän för platshållare
  placeholderEmailDomain: z.string().optional(),
  settings: settingsSchema,
  rules: rulesSchema.optional(),
  property: propertySchema.optional(),
  buildings: z.array(buildingSchema).default([]),
  bookableResources: z.array(bookableResourceSchema).default([]),
  board: z.array(boardMemberSchema).default([]),
  nominatingCommittee: z.array(nominatingMemberSchema).default([]),
  auditor: auditorSchema.optional(),
  protocolHeader: protocolHeaderSchema,
});

export type BrfYaml = z.infer<typeof brfYamlSchema>;
export type BrfBoardMember = z.infer<typeof boardMemberSchema>;
export type BrfNominatingMember = z.infer<typeof nominatingMemberSchema>;
export type BrfBookableResource = z.infer<typeof bookableResourceSchema>;
