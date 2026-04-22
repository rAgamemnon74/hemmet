import type { ResourceType, ResourceBookingMode } from "@prisma/client";

export type SlotTemplate = {
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  label: string | null;
};

export type ResourceDefaults = {
  bookingMode: ResourceBookingMode;
  maxDurationHours: number;
  advanceBookingDays: number;
  reducedAdvanceBookingDays: number | null;
  priorityWindowDays: number | null;
  cancelLockHours: number | null;
  maxActiveBookings: number | null;
  maxBookingsPerPeriod: number | null;
  periodDays: number | null;
  maxConsecutiveUnits: number | null;
  openingHour: number | null;
  closingHour: number | null;
  slotTemplate: Array<{ startHour: number; startMinute: number; endHour: number; endMinute: number; label: string | null }>;
};

function daily(pass: Array<{ startHour: number; startMinute?: number; endHour: number; endMinute?: number; label?: string }>): SlotTemplate[] {
  const out: SlotTemplate[] = [];
  for (let d = 0; d < 7; d++) {
    for (const p of pass) {
      out.push({
        dayOfWeek: d,
        startHour: p.startHour,
        startMinute: p.startMinute ?? 0,
        endHour: p.endHour,
        endMinute: p.endMinute ?? 0,
        label: p.label ?? null,
      });
    }
  }
  return out;
}

// Raw slot-templates per type (pass-mönster per dag, multipliceras till alla veckodagar)
const SLOT_TEMPLATES: Partial<Record<ResourceType, ResourceDefaults["slotTemplate"]>> = {
  LAUNDRY: [
    { startHour: 6,  startMinute: 0, endHour: 9,  endMinute: 0, label: null },
    { startHour: 9,  startMinute: 0, endHour: 12, endMinute: 0, label: null },
    { startHour: 12, startMinute: 0, endHour: 15, endMinute: 0, label: null },
    { startHour: 15, startMinute: 0, endHour: 18, endMinute: 0, label: null },
    { startHour: 18, startMinute: 0, endHour: 21, endMinute: 0, label: null },
  ],
  SAUNA: Array.from({ length: 18 }, (_, i) => ({
    startHour: 6 + i, startMinute: 0, endHour: 7 + i, endMinute: 0, label: null,
  })),
  PARTY_ROOM: [
    { startHour: 6,  startMinute: 0, endHour: 12, endMinute: 0, label: "Förmiddag" },
    { startHour: 12, startMinute: 0, endHour: 16, endMinute: 0, label: "Eftermiddag" },
    { startHour: 16, startMinute: 0, endHour: 22, endMinute: 0, label: "Kväll" },
  ],
  HOBBY_ROOM: [
    { startHour: 6,  startMinute: 0, endHour: 12, endMinute: 0, label: "Förmiddag" },
    { startHour: 12, startMinute: 0, endHour: 16, endMinute: 0, label: "Eftermiddag" },
    { startHour: 16, startMinute: 0, endHour: 22, endMinute: 0, label: "Kväll" },
  ],
  PARKING: Array.from({ length: 24 }, (_, i) => ({
    startHour: i, startMinute: 0, endHour: i + 1, endMinute: 0, label: null,
  })),
};

export const TYPE_DEFAULTS: Record<ResourceType, ResourceDefaults> = {
  LAUNDRY: {
    bookingMode: "SLOTS",
    maxDurationHours: 3,
    advanceBookingDays: 14,
    reducedAdvanceBookingDays: 7,
    priorityWindowDays: 7,
    cancelLockHours: 4,
    maxActiveBookings: 3,
    maxBookingsPerPeriod: null,
    periodDays: null,
    maxConsecutiveUnits: 2,
    openingHour: null,
    closingHour: null,
    slotTemplate: SLOT_TEMPLATES.LAUNDRY!,
  },
  SAUNA: {
    bookingMode: "SLOTS",
    maxDurationHours: 1,
    advanceBookingDays: 14,
    reducedAdvanceBookingDays: 7,
    priorityWindowDays: 14,
    cancelLockHours: 4,
    maxActiveBookings: 2,
    maxBookingsPerPeriod: null,
    periodDays: null,
    maxConsecutiveUnits: 2,
    openingHour: null,
    closingHour: null,
    slotTemplate: SLOT_TEMPLATES.SAUNA!,
  },
  GUEST_APARTMENT: {
    bookingMode: "DAYS",
    maxDurationHours: 24,
    advanceBookingDays: 90,
    reducedAdvanceBookingDays: 14,
    priorityWindowDays: 30,
    cancelLockHours: 48,
    maxActiveBookings: 1,
    maxBookingsPerPeriod: null,
    periodDays: null,
    maxConsecutiveUnits: 3,
    openingHour: null,
    closingHour: null,
    slotTemplate: [],
  },
  PARTY_ROOM: {
    bookingMode: "SLOTS",
    maxDurationHours: 6,
    advanceBookingDays: 60,
    reducedAdvanceBookingDays: 21,
    priorityWindowDays: 60,
    cancelLockHours: 48,
    maxActiveBookings: 1,
    maxBookingsPerPeriod: null,
    periodDays: null,
    maxConsecutiveUnits: 1,
    openingHour: null,
    closingHour: null,
    slotTemplate: SLOT_TEMPLATES.PARTY_ROOM!,
  },
  HOBBY_ROOM: {
    bookingMode: "SLOTS",
    maxDurationHours: 6,
    advanceBookingDays: 14,
    reducedAdvanceBookingDays: 7,
    priorityWindowDays: 7,
    cancelLockHours: 4,
    maxActiveBookings: 2,
    maxBookingsPerPeriod: null,
    periodDays: null,
    maxConsecutiveUnits: 1,
    openingHour: null,
    closingHour: null,
    slotTemplate: SLOT_TEMPLATES.HOBBY_ROOM!,
  },
  PARKING: {
    bookingMode: "SLOTS",
    maxDurationHours: 24,
    advanceBookingDays: 14,
    reducedAdvanceBookingDays: 7,
    priorityWindowDays: 7,
    cancelLockHours: 2,
    maxActiveBookings: 24,
    maxBookingsPerPeriod: null,
    periodDays: null,
    maxConsecutiveUnits: null,
    openingHour: null,
    closingHour: null,
    slotTemplate: SLOT_TEMPLATES.PARKING!,
  },
  OTHER: {
    bookingMode: "FREEFORM",
    maxDurationHours: 3,
    advanceBookingDays: 14,
    reducedAdvanceBookingDays: null,
    priorityWindowDays: null,
    cancelLockHours: null,
    maxActiveBookings: null,
    maxBookingsPerPeriod: null,
    periodDays: null,
    maxConsecutiveUnits: null,
    openingHour: 6,
    closingHour: 22,
    slotTemplate: [],
  },
};

export function getDefaultSlots(type: ResourceType): SlotTemplate[] {
  const template = TYPE_DEFAULTS[type].slotTemplate;
  if (template.length === 0) return [];
  return daily(template.map((p) => ({ ...p, label: p.label ?? undefined })));
}
