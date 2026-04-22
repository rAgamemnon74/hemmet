import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { ResourceType, ResourceBookingMode } from "@prisma/client";
import { getDefaultSlots } from "@/lib/resource-defaults";

const resourceTypeEnum = z.nativeEnum(ResourceType);
const bookingModeEnum = z.nativeEnum(ResourceBookingMode);

const resourceInput = z.object({
  name: z.string().min(1, "Namn krävs"),
  type: resourceTypeEnum,
  bookingMode: bookingModeEnum,
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  groupLabel: z.string().optional().nullable(),
  rulesText: z.string().optional().nullable(),
  active: z.boolean(),
  maxDurationHours: z.number().int().min(1).max(168),
  openingHour: z.number().int().min(0).max(23).optional().nullable(),
  closingHour: z.number().int().min(1).max(24).optional().nullable(),
  advanceBookingDays: z.number().int().min(1).max(365),
  reducedAdvanceBookingDays: z.number().int().min(1).max(365).optional().nullable(),
  maxActiveBookings: z.number().int().min(1).max(50).optional().nullable(),
  maxBookingsPerPeriod: z.number().int().min(1).max(50).optional().nullable(),
  periodDays: z.number().int().min(1).max(365).optional().nullable(),
  maxConsecutiveUnits: z.number().int().min(1).max(30).optional().nullable(),
  priorityWindowDays: z.number().int().min(1).max(365).optional().nullable(),
  cancelLockHours: z.number().int().min(0).max(168).optional().nullable(),
});

const slotInput = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(24),
  endMinute: z.number().int().min(0).max(59),
  label: z.string().optional().nullable(),
  active: z.boolean(),
});

export const bookingRouter = router({
  // ─────────────────────────────────────────────────────────────
  // Boende-endpoints
  // ─────────────────────────────────────────────────────────────

  listResources: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.bookableResource.findMany({
      where: { active: true },
      include: { slots: { where: { active: true }, orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }] } },
      orderBy: [{ type: "asc" }, { groupLabel: "asc" }, { name: "asc" }],
    });
  }),

  getBookings: protectedProcedure
    .input(z.object({
      resourceId: z.string(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      days: z.number().int().min(1).max(120).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const from = input.from ?? new Date();
      const to = input.to ?? new Date(from.getTime() + (input.days ?? 14) * 24 * 60 * 60 * 1000);

      return ctx.db.booking.findMany({
        where: {
          resourceId: input.resourceId,
          startTime: { gte: from, lt: to },
          cancelledAt: null,
        },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { startTime: "asc" },
      });
    }),

  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.booking.findMany({
      where: { userId: ctx.user.id as string, cancelledAt: null, endTime: { gte: new Date() } },
      include: { resource: { select: { name: true, type: true, bookingMode: true } } },
      orderBy: { startTime: "asc" },
    });
  }),

  // ─────────────────────────────────────────────────────────────
  // Quota-query — används av UI för att visa kvot + priority-status
  // ─────────────────────────────────────────────────────────────

  myQuota: protectedProcedure
    .input(z.object({ resourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const resource = await ctx.db.bookableResource.findUnique({ where: { id: input.resourceId } });
      if (!resource) throw new TRPCError({ code: "NOT_FOUND" });
      const userId = ctx.user.id as string;
      return computeQuota(ctx.db, resource, userId);
    }),

  // ─────────────────────────────────────────────────────────────
  // Boka / avboka
  // ─────────────────────────────────────────────────────────────

  book: protectedProcedure
    .use(requirePermission("booking:book"))
    .input(z.object({
      resourceId: z.string(),
      slotId: z.string().optional(),
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const resource = await ctx.db.bookableResource.findUnique({
        where: { id: input.resourceId },
        include: { slots: true },
      });
      if (!resource || !resource.active) throw new TRPCError({ code: "NOT_FOUND", message: "Resursen finns inte" });

      const userId = ctx.user.id as string;

      // ─── Grundkontroll
      if (input.endTime <= input.startTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sluttid måste vara efter starttid" });
      }
      if (input.startTime.getTime() < Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan inte boka i det förflutna" });
      }

      // ─── Läge-specifik validering
      if (resource.bookingMode === "FREEFORM") {
        const hours = (input.endTime.getTime() - input.startTime.getTime()) / (60 * 60 * 1000);
        if (hours > resource.maxDurationHours) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Max bokningslängd är ${resource.maxDurationHours} timmar` });
        }
        if (resource.openingHour != null && input.startTime.getHours() < resource.openingHour) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Öppnar ${resource.openingHour}:00` });
        }
        if (resource.closingHour != null) {
          const endH = input.endTime.getHours() + input.endTime.getMinutes() / 60;
          if (endH > resource.closingHour) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Stänger ${resource.closingHour}:00` });
          }
        }
        if (input.slotId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Passinfo gäller inte för fri tid" });
        }
      } else if (resource.bookingMode === "SLOTS") {
        if (!input.slotId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Välj ett pass" });
        }
        const slot = resource.slots.find((s) => s.id === input.slotId);
        if (!slot || !slot.active) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Passet finns inte" });
        }
        // Starttid och sluttid ska matcha passet (dag + klockslag)
        if (input.startTime.getDay() !== slot.dayOfWeek) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Starttid matchar inte passets veckodag" });
        }
        if (input.startTime.getHours() !== slot.startHour || input.startTime.getMinutes() !== slot.startMinute) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Starttid matchar inte passet" });
        }
        if (input.endTime.getHours() !== slot.endHour || input.endTime.getMinutes() !== slot.endMinute) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Sluttid matchar inte passet" });
        }
      } else if (resource.bookingMode === "DAYS") {
        // Kräver att starttid och sluttid är midnatt i lokal tid
        if (input.startTime.getHours() !== 0 || input.startTime.getMinutes() !== 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Starttid måste vara midnatt" });
        }
        if (input.endTime.getHours() !== 0 || input.endTime.getMinutes() !== 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Sluttid måste vara midnatt" });
        }
        if (input.slotId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Passinfo gäller inte för dygnsbokning" });
        }
      }

      // ─── Priority-gating
      const effectiveAdvanceDays = await effectiveAdvanceBookingDays(ctx.db, resource, userId);
      const daysAhead = (input.startTime.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      if (daysAhead > effectiveAdvanceDays) {
        const reduced = effectiveAdvanceDays < resource.advanceBookingDays;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: reduced
            ? `Du har lägre prioritet på denna typ — kan bara boka ${effectiveAdvanceDays} dygn framåt. Full rätt återställs när ditt senaste pass/dygn är äldre än ${resource.priorityWindowDays} dygn.`
            : `Kan bara boka ${resource.advanceBookingDays} dygn framåt`,
        });
      }

      // ─── Max aktiva bokningar
      if (resource.maxActiveBookings != null) {
        const activeCount = await ctx.db.booking.count({
          where: {
            resourceId: resource.id,
            userId,
            cancelledAt: null,
            endTime: { gte: new Date() },
          },
        });
        if (activeCount >= resource.maxActiveBookings) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Max ${resource.maxActiveBookings} aktiva bokningar per person på denna resurs` });
        }
      }

      // ─── Kvot per period
      if (resource.maxBookingsPerPeriod != null && resource.periodDays != null) {
        const since = new Date(Date.now() - resource.periodDays * 24 * 60 * 60 * 1000);
        const countInPeriod = await ctx.db.booking.count({
          where: {
            resourceId: resource.id,
            userId,
            startTime: { gte: since },
            OR: [{ cancelledAt: null }, { cancelLate: true }],
          },
        });
        if (countInPeriod >= resource.maxBookingsPerPeriod) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Max ${resource.maxBookingsPerPeriod} bokningar per ${resource.periodDays} dygn`,
          });
        }
      }

      // ─── Max i följd (endast DAYS-läge hittills)
      if (resource.maxConsecutiveUnits != null && resource.bookingMode === "DAYS") {
        const runLen = await consecutiveDayRun(ctx.db, resource.id, userId, input.startTime, input.endTime);
        if (runLen > resource.maxConsecutiveUnits) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Max ${resource.maxConsecutiveUnits} dygn i följd`,
          });
        }
      }

      // ─── Konflikt mot andra bokningar
      const conflict = await ctx.db.booking.findFirst({
        where: {
          resourceId: input.resourceId,
          cancelledAt: null,
          startTime: { lt: input.endTime },
          endTime: { gt: input.startTime },
        },
      });
      if (conflict) throw new TRPCError({ code: "CONFLICT", message: "Tiden är redan bokad" });

      const result = await ctx.db.booking.create({
        data: {
          resourceId: input.resourceId,
          slotId: input.slotId ?? null,
          userId,
          startTime: input.startTime,
          endTime: input.endTime,
          notes: input.notes,
        },
      });

      logActivity({
        userId,
        action: "booking.create",
        entityType: "Booking",
        entityId: result.id,
        description: `Bokade ${resource.name}`,
        after: { startTime: input.startTime, endTime: input.endTime, slotId: input.slotId },
      });

      return result;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.id },
        include: { resource: true },
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Du kan bara avboka dina egna bokningar" });
      }

      const lockHours = booking.resource.cancelLockHours ?? 0;
      const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (60 * 60 * 1000);
      const cancelLate = lockHours > 0 && hoursUntilStart < lockHours;

      const result = await ctx.db.booking.update({
        where: { id: input.id },
        data: { cancelledAt: new Date(), cancelLate },
      });

      logActivity({
        userId: ctx.user.id as string,
        action: "booking.cancel",
        entityType: "Booking",
        entityId: input.id,
        description: cancelLate ? "Avbokade (sen avbokning)" : "Avbokade",
        after: { cancelledAt: new Date(), cancelLate },
      });

      return result;
    }),

  // ─────────────────────────────────────────────────────────────
  // Admin: CRUD för bokningsresurser
  // ─────────────────────────────────────────────────────────────

  adminListResources: protectedProcedure
    .use(requirePermission("booking:manage"))
    .query(async ({ ctx }) => {
      return ctx.db.bookableResource.findMany({
        include: {
          slots: { orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }] },
          _count: { select: { bookings: true } },
        },
        orderBy: [{ active: "desc" }, { type: "asc" }, { groupLabel: "asc" }, { name: "asc" }],
      });
    }),

  createResource: protectedProcedure
    .use(requirePermission("booking:manage"))
    .input(resourceInput.extend({ createDefaultSlots: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { createDefaultSlots, ...data } = input;
      const created = await ctx.db.bookableResource.create({ data });

      if (createDefaultSlots && data.bookingMode === "SLOTS") {
        const slots = getDefaultSlots(data.type);
        if (slots.length > 0) {
          await ctx.db.resourceSlot.createMany({
            data: slots.map((s) => ({ ...s, resourceId: created.id, active: true })),
          });
        }
      }

      logActivity({
        userId: ctx.user.id as string,
        action: "resource.create",
        entityType: "BookableResource",
        entityId: created.id,
        description: `Skapade bokningsresurs: ${created.name} (${created.type})${createDefaultSlots ? " med standard-pass" : ""}`,
        after: data,
      });
      return created;
    }),

  updateResource: protectedProcedure
    .use(requirePermission("booking:manage"))
    .input(z.object({ id: z.string(), data: resourceInput }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.bookableResource.findUnique({ where: { id: input.id } });
      if (!before) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.bookableResource.update({
        where: { id: input.id },
        data: input.data,
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "resource.update",
        entityType: "BookableResource",
        entityId: updated.id,
        description: `Uppdaterade bokningsresurs: ${updated.name}`,
        before,
        after: input.data,
      });
      return updated;
    }),

  deleteResource: protectedProcedure
    .use(requirePermission("booking:manage"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resource = await ctx.db.bookableResource.findUnique({
        where: { id: input.id },
        include: { _count: { select: { bookings: true } } },
      });
      if (!resource) throw new TRPCError({ code: "NOT_FOUND" });

      if (resource._count.bookings > 0) {
        // Behåll historik — soft-delete via active = false
        await ctx.db.bookableResource.update({
          where: { id: input.id },
          data: { active: false },
        });
        logActivity({
          userId: ctx.user.id as string,
          action: "resource.deactivate",
          entityType: "BookableResource",
          entityId: input.id,
          description: `Inaktiverade bokningsresurs: ${resource.name} (hade bokningshistorik)`,
        });
      } else {
        await ctx.db.bookableResource.delete({ where: { id: input.id } });
        logActivity({
          userId: ctx.user.id as string,
          action: "resource.delete",
          entityType: "BookableResource",
          entityId: input.id,
          description: `Tog bort bokningsresurs: ${resource.name}`,
        });
      }
    }),

  // ─────────────────────────────────────────────────────────────
  // Admin: CRUD för pass (ResourceSlot)
  // ─────────────────────────────────────────────────────────────

  createSlot: protectedProcedure
    .use(requirePermission("booking:manage"))
    .input(z.object({ resourceId: z.string(), data: slotInput }))
    .mutation(async ({ ctx, input }) => {
      validateSlot(input.data);
      const created = await ctx.db.resourceSlot.create({
        data: { resourceId: input.resourceId, ...input.data },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "slot.create",
        entityType: "ResourceSlot",
        entityId: created.id,
        description: `La till pass ${slotSummary(input.data)}`,
        after: input.data,
      });
      return created;
    }),

  updateSlot: protectedProcedure
    .use(requirePermission("booking:manage"))
    .input(z.object({ id: z.string(), data: slotInput }))
    .mutation(async ({ ctx, input }) => {
      validateSlot(input.data);
      const before = await ctx.db.resourceSlot.findUnique({ where: { id: input.id } });
      if (!before) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.resourceSlot.update({
        where: { id: input.id },
        data: input.data,
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "slot.update",
        entityType: "ResourceSlot",
        entityId: updated.id,
        description: `Uppdaterade pass ${slotSummary(input.data)}`,
        before,
        after: input.data,
      });
      return updated;
    }),

  deleteSlot: protectedProcedure
    .use(requirePermission("booking:manage"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const slot = await ctx.db.resourceSlot.findUnique({ where: { id: input.id } });
      if (!slot) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.resourceSlot.delete({ where: { id: input.id } });
      logActivity({
        userId: ctx.user.id as string,
        action: "slot.delete",
        entityType: "ResourceSlot",
        entityId: input.id,
        description: `Tog bort pass ${slotSummary(slot)}`,
      });
    }),
});

type DbClient = typeof import("@/server/db").db;
type ResourceRecord = Awaited<ReturnType<DbClient["bookableResource"]["findUnique"]>>;

async function effectiveAdvanceBookingDays(
  db: DbClient,
  resource: NonNullable<ResourceRecord>,
  userId: string,
): Promise<number> {
  if (resource.priorityWindowDays == null || resource.reducedAdvanceBookingDays == null) {
    return resource.advanceBookingDays;
  }
  const since = new Date(Date.now() - resource.priorityWindowDays * 24 * 60 * 60 * 1000);
  const recent = await db.booking.findFirst({
    where: {
      userId,
      resource: { type: resource.type },
      startTime: { gte: since },
      OR: [{ cancelledAt: null }, { cancelLate: true }],
    },
    select: { id: true },
  });
  return recent ? resource.reducedAdvanceBookingDays : resource.advanceBookingDays;
}

async function consecutiveDayRun(
  db: DbClient,
  resourceId: string,
  userId: string,
  startTime: Date,
  endTime: Date,
): Promise<number> {
  const daysInNew = Math.round((endTime.getTime() - startTime.getTime()) / (24 * 60 * 60 * 1000));

  // Backward: hur många dygn i följd användaren redan har före input.startTime?
  let backRun = 0;
  let cursor = new Date(startTime);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const prevEnd = cursor;
    const prev = await db.booking.findFirst({
      where: { resourceId, userId, cancelledAt: null, endTime: prevEnd },
      select: { startTime: true },
    });
    if (!prev) break;
    const prevDays = Math.round((prevEnd.getTime() - prev.startTime.getTime()) / (24 * 60 * 60 * 1000));
    backRun += prevDays;
    cursor = prev.startTime;
  }

  // Forward
  let forwardRun = 0;
  cursor = new Date(endTime);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const nextStart = cursor;
    const next = await db.booking.findFirst({
      where: { resourceId, userId, cancelledAt: null, startTime: nextStart },
      select: { endTime: true },
    });
    if (!next) break;
    const nextDays = Math.round((next.endTime.getTime() - nextStart.getTime()) / (24 * 60 * 60 * 1000));
    forwardRun += nextDays;
    cursor = next.endTime;
  }

  return backRun + daysInNew + forwardRun;
}

async function computeQuota(
  db: DbClient,
  resource: NonNullable<ResourceRecord>,
  userId: string,
) {
  const now = new Date();
  const activeCount = await db.booking.count({
    where: { resourceId: resource.id, userId, cancelledAt: null, endTime: { gte: now } },
  });

  let periodCount: number | null = null;
  if (resource.maxBookingsPerPeriod != null && resource.periodDays != null) {
    const since = new Date(Date.now() - resource.periodDays * 24 * 60 * 60 * 1000);
    periodCount = await db.booking.count({
      where: {
        resourceId: resource.id,
        userId,
        startTime: { gte: since },
        OR: [{ cancelledAt: null }, { cancelLate: true }],
      },
    });
  }

  const effective = await effectiveAdvanceBookingDays(db, resource, userId);
  const priorityReduced = effective < resource.advanceBookingDays;

  return {
    activeCount,
    maxActiveBookings: resource.maxActiveBookings,
    periodCount,
    maxBookingsPerPeriod: resource.maxBookingsPerPeriod,
    periodDays: resource.periodDays,
    effectiveAdvanceDays: effective,
    advanceBookingDays: resource.advanceBookingDays,
    priorityReduced,
  };
}

function validateSlot(data: z.infer<typeof slotInput>) {
  const startMin = data.startHour * 60 + data.startMinute;
  const endMin = data.endHour * 60 + data.endMinute;
  if (endMin <= startMin) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Passets sluttid måste vara efter starttid" });
  }
}

function slotSummary(data: { dayOfWeek: number; startHour: number; startMinute: number; endHour: number; endMinute: number; label?: string | null }) {
  const days = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
  const pad = (n: number) => n.toString().padStart(2, "0");
  const suffix = data.label ? ` — ${data.label}` : "";
  return `${days[data.dayOfWeek]} ${pad(data.startHour)}:${pad(data.startMinute)}–${pad(data.endHour)}:${pad(data.endMinute)}${suffix}`;
}
