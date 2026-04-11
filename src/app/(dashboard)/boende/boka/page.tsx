"use client";

import { useState } from "react";
import { format, addDays, startOfDay, addHours } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar, Clock, X, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = {
  LAUNDRY: "Tvättstuga", SAUNA: "Bastu", GUEST_APARTMENT: "Gästlägenhet",
  PARTY_ROOM: "Festlokal", GYM: "Gym", OTHER: "Övrigt",
};

export default function BookingPage() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startHour, setStartHour] = useState("09");
  const [endHour, setEndHour] = useState("12");

  const resourcesQuery = trpc.booking.listResources.useQuery();
  const myBookingsQuery = trpc.booking.myBookings.useQuery();
  const bookingsQuery = trpc.booking.getBookings.useQuery(
    { resourceId: selectedResource!, from: new Date(bookingDate) },
    { enabled: !!selectedResource }
  );
  const book = trpc.booking.book.useMutation({
    onSuccess: () => { bookingsQuery.refetch(); myBookingsQuery.refetch(); },
  });
  const cancel = trpc.booking.cancel.useMutation({
    onSuccess: () => { bookingsQuery.refetch(); myBookingsQuery.refetch(); },
  });

  const resources = resourcesQuery.data ?? [];
  const resource = resources.find((r) => r.id === selectedResource);

  function handleBook() {
    if (!selectedResource) return;
    const start = new Date(`${bookingDate}T${startHour}:00:00`);
    const end = new Date(`${bookingDate}T${endHour}:00:00`);
    book.mutate({ resourceId: selectedResource, startTime: start, endTime: end });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Boka</h1>
      <p className="text-sm text-gray-500 mb-6">Boka tvättstuga, bastu och andra gemensamma resurser.</p>

      {/* My bookings */}
      {myBookingsQuery.data && myBookingsQuery.data.length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-xs font-semibold text-blue-700 uppercase mb-2">Mina kommande bokningar</h2>
          <div className="space-y-1">
            {myBookingsQuery.data.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-blue-900">
                  {b.resource.name} — {format(new Date(b.startTime), "d MMM HH:mm", { locale: sv })}–{format(new Date(b.endTime), "HH:mm")}
                </span>
                <button onClick={() => cancel.mutate({ id: b.id })}
                  className="text-xs text-red-600 hover:text-red-800">Avboka</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resource list */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase">Resurser</h2>
          {resources.map((r) => (
            <button key={r.id} onClick={() => setSelectedResource(r.id)}
              className={cn("w-full text-left rounded-lg border p-3 transition-colors",
                selectedResource === r.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
              )}>
              <p className="text-sm font-medium text-gray-900">{r.name}</p>
              <p className="text-xs text-gray-500">{typeLabels[r.type] ?? r.type}</p>
              {r.location && <p className="text-xs text-gray-400">{r.location}</p>}
            </button>
          ))}
          {resources.length === 0 && <p className="text-sm text-gray-400">Inga bokningsbara resurser.</p>}
        </div>

        {/* Booking form + schedule */}
        {selectedResource && resource && (
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">{resource.name}</h2>
              {resource.description && <p className="text-xs text-gray-500 mb-2">{resource.description}</p>}
              <div className="flex gap-4 text-xs text-gray-400">
                <span>Max {resource.maxDurationHours} timmar</span>
                <span>Boka {resource.advanceBookingDays} dagar framåt</span>
              </div>
              {resource.rulesText && (
                <p className="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">{resource.rulesText}</p>
              )}
            </div>

            {/* Book form */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-700 uppercase">Ny bokning</h3>
              <div className="flex gap-3">
                <div>
                  <label className="text-xs text-gray-500">Datum</label>
                  <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                    max={format(addDays(new Date(), resource.advanceBookingDays), "yyyy-MM-dd")}
                    className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Från</label>
                  <select value={startHour} onChange={(e) => setStartHour(e.target.value)}
                    className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                    {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => (
                      <option key={h} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Till</label>
                  <select value={endHour} onChange={(e) => setEndHour(e.target.value)}
                    className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                    {Array.from({ length: 16 }, (_, i) => i + 7).map((h) => (
                      <option key={h} value={String(h).padStart(2, "0")}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={handleBook} disabled={book.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {book.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                Boka
              </button>
              {book.error && <p className="text-sm text-red-600">{book.error.message}</p>}
              {book.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Bokad!</p>}
            </div>

            {/* Existing bookings */}
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
                    <span className="text-xs text-gray-500">{b.user.firstName} {b.user.lastName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
