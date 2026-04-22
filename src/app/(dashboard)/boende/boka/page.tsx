"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfDay, startOfISOWeek, getISOWeek, isToday } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar, Clock, Loader2, CheckCircle, AlertTriangle, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { ResourceType, ResourceBookingMode, BookableResource, ResourceSlot } from "@prisma/client";

const TYPE_LABELS: Record<ResourceType, string> = {
  LAUNDRY: "Tvättstuga",
  SAUNA: "Bastu",
  GUEST_APARTMENT: "Gästlägenhet",
  PARTY_ROOM: "Festlokal",
  PARKING: "Gästparkering",
  HOBBY_ROOM: "Hobbyrum",
  OTHER: "Övrigt",
};

export default function BookingPage() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const resourcesQuery = trpc.booking.listResources.useQuery();
  const myBookingsQuery = trpc.booking.myBookings.useQuery();
  const cancel = trpc.booking.cancel.useMutation({ onSuccess: () => { myBookingsQuery.refetch(); } });

  const resources = resourcesQuery.data ?? [];
  const resource = resources.find((r) => r.id === selectedResource);

  // Gruppera resurser per groupLabel (eller typ om ingen groupLabel)
  const grouped = useMemo(() => {
    const map = new Map<string, typeof resources>();
    for (const r of resources) {
      const key = r.groupLabel ?? TYPE_LABELS[r.type];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [resources]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Boka</h1>
      <p className="text-sm text-gray-500 mb-6">Boka tvättstuga, bastu, lånelägenhet och andra gemensamma resurser.</p>

      {myBookingsQuery.data && myBookingsQuery.data.length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-xs font-semibold text-blue-700 uppercase mb-2">Mina kommande bokningar</h2>
          <div className="space-y-1">
            {myBookingsQuery.data.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-blue-900">
                  {b.resource.name} — {b.resource.bookingMode === "DAYS"
                    ? `${format(new Date(b.startTime), "d MMM", { locale: sv })}–${format(new Date(b.endTime), "d MMM", { locale: sv })}`
                    : `${format(new Date(b.startTime), "d MMM HH:mm", { locale: sv })}–${format(new Date(b.endTime), "HH:mm")}`}
                </span>
                <button onClick={() => cancel.mutate({ id: b.id })}
                  className="text-xs text-red-600 hover:text-red-800">Avboka</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase">Resurser</h2>
          {grouped.map(([groupKey, items]) => (
            <div key={groupKey}>
              {items.length > 1 && (
                <div className="text-xs font-semibold text-gray-400 uppercase mb-1">{groupKey}</div>
              )}
              <div className="space-y-1.5">
                {items.map((r) => (
                  <button key={r.id} onClick={() => setSelectedResource(r.id)}
                    className={cn("w-full text-left rounded-lg border p-3 transition-colors",
                      selectedResource === r.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    )}>
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{TYPE_LABELS[r.type]}</span>
                      {r.bookingMode === "SLOTS" && <span className="text-purple-600">· Pass</span>}
                      {r.bookingMode === "DAYS" && <span className="text-amber-600">· Dygn</span>}
                    </div>
                    {r.location && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location}</p>}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {resources.length === 0 && <p className="text-sm text-gray-400">Inga bokningsbara resurser.</p>}
        </div>

        <div className="lg:col-span-2">
          {resource ? (
            <ResourcePanel resourceId={resource.id} />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
              Välj en resurs för att boka
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function ResourcePanel({ resourceId }: { resourceId: string }) {
  const utils = trpc.useUtils();
  const resourcesQuery = trpc.booking.listResources.useQuery();
  const quotaQuery = trpc.booking.myQuota.useQuery({ resourceId });
  const resource = resourcesQuery.data?.find((r) => r.id === resourceId);

  if (!resource) return null;
  const quota = quotaQuery.data;

  function refreshAll() {
    utils.booking.getBookings.invalidate({ resourceId });
    utils.booking.myBookings.invalidate();
    utils.booking.myQuota.invalidate({ resourceId });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{resource.name}</h2>
            {resource.description && <p className="text-xs text-gray-500 mt-0.5">{resource.description}</p>}
          </div>
          <span className="shrink-0 rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
            {resource.bookingMode === "FREEFORM" ? "Fri tid" : resource.bookingMode === "SLOTS" ? "Pass" : "Dygn"}
          </span>
        </div>
        {resource.rulesText && (
          <p className="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2 whitespace-pre-wrap">{resource.rulesText}</p>
        )}

        {quota && (
          <div className="mt-3 border-t border-gray-100 pt-3 flex flex-wrap gap-4 text-xs">
            {quota.maxActiveBookings != null && (
              <span className="text-gray-600">
                Aktiva: <strong>{quota.activeCount}/{quota.maxActiveBookings}</strong>
              </span>
            )}
            {quota.maxBookingsPerPeriod != null && quota.periodDays != null && (
              <span className="text-gray-600">
                Per {quota.periodDays} dygn: <strong>{quota.periodCount}/{quota.maxBookingsPerPeriod}</strong>
              </span>
            )}
            <span className="text-gray-600">
              Bokningsfönster: <strong>{quota.effectiveAdvanceDays} dygn</strong>
              {quota.priorityReduced && <span className="text-amber-600 ml-1">(reducerat)</span>}
            </span>
          </div>
        )}
        {quota?.priorityReduced && (
          <div className="mt-2 flex items-start gap-2 rounded bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Du har en aktiv bokning av samma typ inom senaste {resource.priorityWindowDays} dygn, så du kan bara boka {quota.effectiveAdvanceDays} dygn framåt (istället för {quota.advanceBookingDays}). Andra boende ser passen öppna tidigare än du.
            </span>
          </div>
        )}
      </div>

      {resource.bookingMode === "FREEFORM" && <FreeformBooker resource={resource} quota={quota} onBooked={refreshAll} />}
      {resource.bookingMode === "SLOTS" && <SlotBooker resource={resource} quota={quota} onBooked={refreshAll} />}
      {resource.bookingMode === "DAYS" && <DayBooker resource={resource} quota={quota} onBooked={refreshAll} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FREEFORM

type Resource = BookableResource & { slots: ResourceSlot[] };
type Quota = {
  activeCount: number;
  maxActiveBookings: number | null;
  periodCount: number | null;
  maxBookingsPerPeriod: number | null;
  periodDays: number | null;
  effectiveAdvanceDays: number;
  advanceBookingDays: number;
  priorityReduced: boolean;
};

function FreeformBooker({ resource, quota, onBooked }: { resource: Resource; quota: Quota | undefined; onBooked: () => void }) {
  const [bookingDate, setBookingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startHour, setStartHour] = useState(String(resource.openingHour ?? 9).padStart(2, "0"));
  const [endHour, setEndHour] = useState(String(Math.min((resource.openingHour ?? 9) + 3, resource.closingHour ?? 23)).padStart(2, "0"));

  const bookingsQuery = trpc.booking.getBookings.useQuery({ resourceId: resource.id, from: new Date(bookingDate) });
  const book = trpc.booking.book.useMutation({ onSuccess: () => { bookingsQuery.refetch(); onBooked(); } });

  const maxDays = quota?.effectiveAdvanceDays ?? resource.advanceBookingDays;
  const openH = resource.openingHour ?? 6;
  const closeH = resource.closingHour ?? 23;

  function handleBook() {
    const start = new Date(`${bookingDate}T${startHour}:00:00`);
    const end = new Date(`${bookingDate}T${endHour}:00:00`);
    book.mutate({ resourceId: resource.id, startTime: start, endTime: end });
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h3 className="text-xs font-semibold text-gray-700 uppercase">Ny bokning</h3>
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="text-xs text-gray-500">Datum</label>
            <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), maxDays), "yyyy-MM-dd")}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Från</label>
            <select value={startHour} onChange={(e) => setStartHour(e.target.value)}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              {Array.from({ length: closeH - openH }, (_, i) => i + openH).map((h) => (
                <option key={h} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Till</label>
            <select value={endHour} onChange={(e) => setEndHour(e.target.value)}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              {Array.from({ length: closeH - openH }, (_, i) => i + openH + 1).map((h) => (
                <option key={h} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400">Max {resource.maxDurationHours} timmar per bokning.</p>
        <button onClick={handleBook} disabled={book.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {book.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
          Boka
        </button>
        {book.error && <p className="text-sm text-red-600">{book.error.message}</p>}
        {book.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Bokad!</p>}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Bokningar — {format(new Date(bookingDate), "d MMMM", { locale: sv })}</h3>
        {bookingsQuery.isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        {bookingsQuery.data?.length === 0 && <p className="text-xs text-gray-400">Inga bokningar denna dag.</p>}
        <div className="space-y-1">
          {bookingsQuery.data?.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
              <span className="text-gray-700">
                <Clock className="inline h-3 w-3 mr-1 text-gray-400" />
                {format(new Date(b.startTime), "HH:mm")}–{format(new Date(b.endTime), "HH:mm")}
              </span>
              <span className="text-xs text-gray-500">{b.user ? `${b.user.firstName} ${b.user.lastName}` : "Anonym"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SLOTS

function SlotBooker({ resource, quota, onBooked }: { resource: Resource; quota: Quota | undefined; onBooked: () => void }) {
  const maxDays = quota?.effectiveAdvanceDays ?? resource.advanceBookingDays;

  const today = startOfDay(new Date());
  const firstWeekStart = startOfISOWeek(today); // måndag innevarande ISO-vecka
  const lastBookableDay = startOfDay(addDays(today, maxDays));

  // Hoppa mellan veckor; offsetWeek = 0 = innevarande vecka
  const [offsetWeek, setOffsetWeek] = useState(0);
  const weekStart = addDays(firstWeekStart, offsetWeek * 7);
  const weekEnd = addDays(weekStart, 7);
  const weekNumber = getISOWeek(weekStart);

  // Hur många veckor framåt får man bläddra?
  const maxOffsetWeek = Math.floor((lastBookableDay.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

  const bookingsQuery = trpc.booking.getBookings.useQuery({
    resourceId: resource.id,
    from: weekStart,
    to: weekEnd,
  });
  const book = trpc.booking.book.useMutation({ onSuccess: () => { bookingsQuery.refetch(); onBooked(); } });

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dow = date.getDay();
      const slots = resource.slots
        .filter((s) => s.dayOfWeek === dow && s.active)
        .sort((a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute));
      return { date, slots };
    });
  }, [weekStart.getTime(), resource.slots]);

  function bookingAt(date: Date, slot: Resource["slots"][number]) {
    const start = new Date(date);
    start.setHours(slot.startHour, slot.startMinute, 0, 0);
    return bookingsQuery.data?.find((b) => new Date(b.startTime).getTime() === start.getTime()) ?? null;
  }

  function handleBookSlot(date: Date, slot: Resource["slots"][number]) {
    const start = new Date(date);
    start.setHours(slot.startHour, slot.startMinute, 0, 0);
    const end = new Date(date);
    end.setHours(slot.endHour, slot.endMinute, 0, 0);
    book.mutate({ resourceId: resource.id, slotId: slot.id, startTime: start, endTime: end });
  }

  if (resource.slots.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Inga pass är definierade för denna resurs ännu. Kontakta styrelsen.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase">Välj pass</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Vecka {weekNumber} — {format(weekStart, "d MMM", { locale: sv })} till {format(addDays(weekStart, 6), "d MMM", { locale: sv })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOffsetWeek((w) => Math.max(0, w - 1))} disabled={offsetWeek === 0}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setOffsetWeek(0)} disabled={offsetWeek === 0}
            className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-30">
            Idag
          </button>
          <button onClick={() => setOffsetWeek((w) => Math.min(maxOffsetWeek, w + 1))} disabled={offsetWeek >= maxOffsetWeek}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {bookingsQuery.isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}

      <div className="grid grid-cols-2 md:grid-cols-7 gap-1.5">
        {days.map(({ date, slots }) => {
          const beforeWindow = date.getTime() < today.getTime();
          const afterWindow = date.getTime() > lastBookableDay.getTime();
          const outOfRange = beforeWindow || afterWindow;
          return (
            <div key={date.toISOString()}
              className={cn("flex flex-col rounded border",
                isToday(date) ? "border-blue-400 bg-blue-50/30" :
                outOfRange ? "border-gray-100 bg-gray-50/50" :
                "border-gray-200 bg-white",
              )}>
              <div className={cn("px-2 py-1 border-b text-center",
                isToday(date) ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50/50"
              )}>
                <div className="text-[10px] font-medium uppercase text-gray-600">
                  {format(date, "EEE", { locale: sv })}
                </div>
                <div className={cn("text-sm font-semibold",
                  isToday(date) ? "text-blue-700" : outOfRange ? "text-gray-400" : "text-gray-900"
                )}>
                  {format(date, "d/M", { locale: sv })}
                </div>
              </div>
              <div className="flex flex-col gap-1 p-1.5 min-h-[60px]">
                {outOfRange && <p className="text-[10px] text-gray-400 italic text-center mt-2">Ej bokningsbar</p>}
                {!outOfRange && slots.length === 0 && <p className="text-[10px] text-gray-400 italic text-center mt-2">Inga pass</p>}
                {!outOfRange && slots.map((slot) => {
                  const booking = bookingAt(date, slot);
                  const slotStart = new Date(date);
                  slotStart.setHours(slot.startHour, slot.startMinute, 0, 0);
                  const past = slotStart.getTime() < Date.now();
                  const bookedBy = booking?.user ? `${booking.user.firstName} ${booking.user.lastName}` : booking ? "Anonym" : null;

                  const timeLabel = `${String(slot.startHour).padStart(2, "0")}:${String(slot.startMinute).padStart(2, "0")}–${String(slot.endHour).padStart(2, "0")}:${String(slot.endMinute).padStart(2, "0")}`;

                  return (
                    <button key={slot.id}
                      disabled={!!booking || past || book.isPending}
                      onClick={() => handleBookSlot(date, slot)}
                      title={booking ? `Bokat av ${bookedBy}` : slot.label ?? undefined}
                      className={cn("rounded border px-1.5 py-1 text-[10px] leading-tight transition-colors text-left",
                        past ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed" :
                        booking ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" :
                        "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
                      )}>
                      <div className="font-mono tabular-nums">{timeLabel}</div>
                      {slot.label && <div className="truncate text-[9px] opacity-75">{slot.label}</div>}
                      {booking && !past && <div className="truncate text-[9px] opacity-75">{bookedBy}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-gray-500 border-t border-gray-100 pt-2">
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm border border-green-300 bg-green-50" /> Ledigt</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm border border-gray-200 bg-gray-100" /> Bokat</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm border border-gray-100 bg-gray-50" /> Passerat / utanför fönster</span>
      </div>

      {book.error && <p className="text-sm text-red-600">{book.error.message}</p>}
      {book.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Bokad!</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DAYS

function DayBooker({ resource, quota, onBooked }: { resource: Resource; quota: Quota | undefined; onBooked: () => void }) {
  const [checkIn, setCheckIn] = useState(format(new Date(), "yyyy-MM-dd"));
  const [nights, setNights] = useState(1);

  const maxDays = quota?.effectiveAdvanceDays ?? resource.advanceBookingDays;
  const bookingsQuery = trpc.booking.getBookings.useQuery({ resourceId: resource.id, from: new Date(checkIn) });
  const book = trpc.booking.book.useMutation({ onSuccess: () => { bookingsQuery.refetch(); onBooked(); } });

  const checkInDate = new Date(`${checkIn}T00:00:00`);
  const checkOutDate = addDays(checkInDate, nights);

  function handleBook() {
    book.mutate({ resourceId: resource.id, startTime: checkInDate, endTime: checkOutDate });
  }

  const maxNights = resource.maxConsecutiveUnits ?? 14;

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h3 className="text-xs font-semibold text-gray-700 uppercase">Boka dygn</h3>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs text-gray-500">Incheckning</label>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), maxDays), "yyyy-MM-dd")}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Antal dygn</label>
            <select value={nights} onChange={(e) => setNights(parseInt(e.target.value))}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              {Array.from({ length: maxNights }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} dygn</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500">
            Utcheckning: <strong>{format(checkOutDate, "d MMM", { locale: sv })}</strong>
          </div>
        </div>
        {resource.maxConsecutiveUnits != null && (
          <p className="text-xs text-gray-400">Max {resource.maxConsecutiveUnits} dygn i följd.</p>
        )}
        <button onClick={handleBook} disabled={book.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {book.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
          Boka {nights} dygn
        </button>
        {book.error && <p className="text-sm text-red-600">{book.error.message}</p>}
        {book.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Bokad!</p>}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Bokade dygn (kommande 14 dagar)</h3>
        {bookingsQuery.isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        {bookingsQuery.data?.length === 0 && <p className="text-xs text-gray-400">Inga bokningar.</p>}
        <div className="space-y-1">
          {bookingsQuery.data?.map((b) => {
            const startDate = new Date(b.startTime);
            const endDate = new Date(b.endTime);
            const nightCount = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
            return (
              <div key={b.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
                <span className="text-gray-700">
                  {format(startDate, "d MMM", { locale: sv })}–{format(endDate, "d MMM", { locale: sv })} ({nightCount} dygn)
                </span>
                <span className="text-xs text-gray-500">{b.user ? `${b.user.firstName} ${b.user.lastName}` : "Anonym"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
