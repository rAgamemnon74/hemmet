"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Power, Clock, Users as UsersIcon, Settings2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { ResourceType, ResourceBookingMode } from "@prisma/client";
import { TYPE_DEFAULTS } from "@/lib/resource-defaults";

const TYPE_LABELS: Record<ResourceType, string> = {
  LAUNDRY: "Tvättstuga",
  SAUNA: "Bastu",
  GUEST_APARTMENT: "Gästlägenhet",
  PARTY_ROOM: "Festlokal",
  PARKING: "Gästparkering",
  HOBBY_ROOM: "Hobbyrum",
  OTHER: "Övrigt",
};

const MODE_LABELS: Record<ResourceBookingMode, string> = {
  FREEFORM: "Fri tid (start/slut inom öppettider)",
  SLOTS: "Pass (fördefinierade veckopass)",
  DAYS: "Dygn (midnatt till midnatt)",
};

const DAYS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

type ResourceForm = {
  name: string;
  type: ResourceType;
  bookingMode: ResourceBookingMode;
  description: string;
  location: string;
  groupLabel: string;
  rulesText: string;
  active: boolean;
  maxDurationHours: string;
  openingHour: string;
  closingHour: string;
  advanceBookingDays: string;
  reducedAdvanceBookingDays: string;
  maxActiveBookings: string;
  maxBookingsPerPeriod: string;
  periodDays: string;
  maxConsecutiveUnits: string;
  priorityWindowDays: string;
  cancelLockHours: string;
};

const emptyForm: ResourceForm = {
  name: "", type: "LAUNDRY", bookingMode: "FREEFORM",
  description: "", location: "", groupLabel: "", rulesText: "",
  active: true,
  maxDurationHours: "3", openingHour: "", closingHour: "",
  advanceBookingDays: "14", reducedAdvanceBookingDays: "",
  maxActiveBookings: "", maxBookingsPerPeriod: "", periodDays: "",
  maxConsecutiveUnits: "",
  priorityWindowDays: "", cancelLockHours: "",
};

function toNullableInt(s: string): number | null {
  const v = s.trim();
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function toNullableStr(s: string): string | null {
  const v = s.trim();
  return v ? v : null;
}

export function BokningTab() {
  const resourcesQuery = trpc.booking.adminListResources.useQuery();
  const createResource = trpc.booking.createResource.useMutation({ onSuccess: () => { resourcesQuery.refetch(); setShowForm(false); setForm(emptyForm); } });
  const updateResource = trpc.booking.updateResource.useMutation({ onSuccess: () => { resourcesQuery.refetch(); setEditingId(null); setForm(emptyForm); } });
  const deleteResource = trpc.booking.deleteResource.useMutation({ onSuccess: () => resourcesQuery.refetch() });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyForm);
  const [slotEditorFor, setSlotEditorFor] = useState<string | null>(null);
  const [createDefaultSlots, setCreateDefaultSlots] = useState(true);

  function applyTypeDefaults(type: ResourceType) {
    const d = TYPE_DEFAULTS[type];
    setForm((f) => ({
      ...f,
      type,
      bookingMode: d.bookingMode,
      maxDurationHours: String(d.maxDurationHours),
      advanceBookingDays: String(d.advanceBookingDays),
      reducedAdvanceBookingDays: d.reducedAdvanceBookingDays?.toString() ?? "",
      priorityWindowDays: d.priorityWindowDays?.toString() ?? "",
      cancelLockHours: d.cancelLockHours?.toString() ?? "",
      maxActiveBookings: d.maxActiveBookings?.toString() ?? "",
      maxBookingsPerPeriod: d.maxBookingsPerPeriod?.toString() ?? "",
      periodDays: d.periodDays?.toString() ?? "",
      maxConsecutiveUnits: d.maxConsecutiveUnits?.toString() ?? "",
      openingHour: d.openingHour?.toString() ?? "",
      closingHour: d.closingHour?.toString() ?? "",
    }));
  }

  function startEdit(resource: NonNullable<typeof resourcesQuery.data>[number]) {
    setEditingId(resource.id);
    setShowForm(false);
    setForm({
      name: resource.name,
      type: resource.type,
      bookingMode: resource.bookingMode,
      description: resource.description ?? "",
      location: resource.location ?? "",
      groupLabel: resource.groupLabel ?? "",
      rulesText: resource.rulesText ?? "",
      active: resource.active,
      maxDurationHours: String(resource.maxDurationHours),
      openingHour: resource.openingHour?.toString() ?? "",
      closingHour: resource.closingHour?.toString() ?? "",
      advanceBookingDays: String(resource.advanceBookingDays),
      reducedAdvanceBookingDays: resource.reducedAdvanceBookingDays?.toString() ?? "",
      maxActiveBookings: resource.maxActiveBookings?.toString() ?? "",
      maxBookingsPerPeriod: resource.maxBookingsPerPeriod?.toString() ?? "",
      periodDays: resource.periodDays?.toString() ?? "",
      maxConsecutiveUnits: resource.maxConsecutiveUnits?.toString() ?? "",
      priorityWindowDays: resource.priorityWindowDays?.toString() ?? "",
      cancelLockHours: resource.cancelLockHours?.toString() ?? "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: form.name,
      type: form.type,
      bookingMode: form.bookingMode,
      description: toNullableStr(form.description),
      location: toNullableStr(form.location),
      groupLabel: toNullableStr(form.groupLabel),
      rulesText: toNullableStr(form.rulesText),
      active: form.active,
      maxDurationHours: parseInt(form.maxDurationHours, 10) || 3,
      openingHour: toNullableInt(form.openingHour),
      closingHour: toNullableInt(form.closingHour),
      advanceBookingDays: parseInt(form.advanceBookingDays, 10) || 14,
      reducedAdvanceBookingDays: toNullableInt(form.reducedAdvanceBookingDays),
      maxActiveBookings: toNullableInt(form.maxActiveBookings),
      maxBookingsPerPeriod: toNullableInt(form.maxBookingsPerPeriod),
      periodDays: toNullableInt(form.periodDays),
      maxConsecutiveUnits: toNullableInt(form.maxConsecutiveUnits),
      priorityWindowDays: toNullableInt(form.priorityWindowDays),
      cancelLockHours: toNullableInt(form.cancelLockHours),
    };
    if (editingId) updateResource.mutate({ id: editingId, data });
    else createResource.mutate({ ...data, createDefaultSlots });
  }

  if (resourcesQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;
  const resources = resourcesQuery.data ?? [];

  const isFormOpen = showForm || editingId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bokningsresurser</h2>
          <p className="text-xs text-gray-500">Tvättstugor, bastur, gästlägenheter och andra gemensamma utrymmen som medlemmar kan boka.</p>
        </div>
        {!isFormOpen && (
          <button onClick={() => {
            setShowForm(true);
            setForm(emptyForm);
            applyTypeDefaults("LAUNDRY");
          }}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Ny resurs
          </button>
        )}
      </div>

      {resources.length === 0 && !isFormOpen && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Inga bokningsresurser ännu.</p>
        </div>
      )}

      {resources.map((r) => (
        <div key={r.id} className={`rounded-lg border ${r.active ? "border-gray-200" : "border-gray-200 bg-gray-50 opacity-70"} bg-white p-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-gray-900">{r.name}</h3>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{TYPE_LABELS[r.type]}</span>
                <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">{MODE_LABELS[r.bookingMode]}</span>
                {!r.active && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Inaktiv</span>}
                {r.groupLabel && <span className="text-xs text-gray-500">Grupp: {r.groupLabel}</span>}
              </div>
              {r.description && <p className="mt-1 text-sm text-gray-600">{r.description}</p>}

              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-600">
                <span><Clock className="inline h-3 w-3 mr-0.5" /> Bokningsfönster: {r.advanceBookingDays} dygn{r.reducedAdvanceBookingDays != null && ` (reducerat: ${r.reducedAdvanceBookingDays})`}</span>
                {r.bookingMode === "FREEFORM" && <span>Max längd: {r.maxDurationHours} h</span>}
                {(r.openingHour != null || r.closingHour != null) && <span>Öppet: {r.openingHour ?? 0}–{r.closingHour ?? 24}</span>}
                {r.maxActiveBookings != null && <span><UsersIcon className="inline h-3 w-3 mr-0.5" />Max aktiva: {r.maxActiveBookings}</span>}
                {r.maxBookingsPerPeriod != null && r.periodDays != null && <span>Kvot: {r.maxBookingsPerPeriod} per {r.periodDays} dygn</span>}
                {r.maxConsecutiveUnits != null && <span>Max i följd: {r.maxConsecutiveUnits}</span>}
                {r.priorityWindowDays != null && <span>Priority-fönster: {r.priorityWindowDays} dygn</span>}
                {r.cancelLockHours != null && <span>Avbok-lås: {r.cancelLockHours} h</span>}
                <span>{r._count.bookings} bokningar totalt</span>
              </div>

              {r.bookingMode === "SLOTS" && (
                <div className="mt-3 rounded border border-gray-200 bg-gray-50/50 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Pass ({r.slots.length})</span>
                    <button onClick={() => setSlotEditorFor(slotEditorFor === r.id ? null : r.id)}
                      className="text-xs text-blue-600 hover:underline">
                      {slotEditorFor === r.id ? "Stäng" : "Redigera pass"}
                    </button>
                  </div>
                  {r.slots.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {r.slots.map((s) => (
                        <span key={s.id} className={`rounded px-2 py-0.5 text-xs ${s.active ? "bg-white border border-gray-200 text-gray-700" : "bg-gray-100 text-gray-400 line-through"}`}>
                          {DAYS[s.dayOfWeek]} {String(s.startHour).padStart(2, "0")}:{String(s.startMinute).padStart(2, "0")}–{String(s.endHour).padStart(2, "0")}:{String(s.endMinute).padStart(2, "0")}
                          {s.label && ` ${s.label}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Inga pass definierade — boende kan inte boka förrän pass skapats.</p>
                  )}
                  {slotEditorFor === r.id && <SlotEditor resourceId={r.id} slots={r.slots} onChange={() => resourcesQuery.refetch()} />}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => startEdit(r)}
                className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Redigera">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => { if (confirm(`Ta bort ${r.name}?`)) deleteResource.mutate({ id: r.id }); }}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Ta bort (eller inaktivera om historik finns)">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-blue-200 bg-blue-50/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            {editingId ? "Redigera resurs" : "Ny bokningsresurs"}
          </h3>

          <Section title="Grundinfo">
            <Field label="Namn *" colSpan={2}>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls} placeholder="Tvättstuga 1, Bastu Östra, ..." />
            </Field>
            <Field label="Typ *">
              <select value={form.type} onChange={(e) => {
                const newType = e.target.value as ResourceType;
                if (!editingId) applyTypeDefaults(newType);
                else setForm((f) => ({ ...f, type: newType }));
              }} className={inputCls}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {!editingId && (
                <button type="button" onClick={() => applyTypeDefaults(form.type)}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <Sparkles className="h-3 w-3" /> Återställ standardvärden för {TYPE_LABELS[form.type]}
                </button>
              )}
            </Field>
            <Field label="Bokningsläge *">
              <select value={form.bookingMode} onChange={(e) => setForm((f) => ({ ...f, bookingMode: e.target.value as ResourceBookingMode }))} className={inputCls}>
                {Object.entries(MODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Grupp (för UI-gruppering)">
              <input value={form.groupLabel} onChange={(e) => setForm((f) => ({ ...f, groupLabel: e.target.value }))}
                className={inputCls} placeholder='t.ex. "Tvättstuga 1" (grupperar maskiner)' />
            </Field>
            <Field label="Plats">
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className={inputCls} placeholder="Källarplan, Hus A" />
            </Field>
            <Field label="Beskrivning" colSpan={2}>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Bokningsregler (visas för boende)" colSpan={2}>
              <textarea rows={2} value={form.rulesText} onChange={(e) => setForm((f) => ({ ...f, rulesText: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Aktiv">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Boende kan boka
              </label>
            </Field>
          </Section>

          <Section title="Tidsfönster">
            <Field label="Bokningsfönster (dygn framåt) *">
              <input type="number" min={1} required value={form.advanceBookingDays} onChange={(e) => setForm((f) => ({ ...f, advanceBookingDays: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Reducerat fönster (priority)">
              <input type="number" min={1} value={form.reducedAdvanceBookingDays} onChange={(e) => setForm((f) => ({ ...f, reducedAdvanceBookingDays: e.target.value }))} className={inputCls}
                placeholder="tomt = ingen reducering" />
            </Field>
            {form.bookingMode === "FREEFORM" && (
              <>
                <Field label="Max bokningslängd (h)">
                  <input type="number" min={1} value={form.maxDurationHours} onChange={(e) => setForm((f) => ({ ...f, maxDurationHours: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Öppnar kl (0–23)">
                  <input type="number" min={0} max={23} value={form.openingHour} onChange={(e) => setForm((f) => ({ ...f, openingHour: e.target.value }))} className={inputCls} placeholder="tomt = dygnet runt" />
                </Field>
                <Field label="Stänger kl (1–24)">
                  <input type="number" min={1} max={24} value={form.closingHour} onChange={(e) => setForm((f) => ({ ...f, closingHour: e.target.value }))} className={inputCls} placeholder="tomt = dygnet runt" />
                </Field>
              </>
            )}
          </Section>

          <Section title="Limiter per användare">
            <Field label="Max samtidiga bokningar">
              <input type="number" min={1} value={form.maxActiveBookings} onChange={(e) => setForm((f) => ({ ...f, maxActiveBookings: e.target.value }))} className={inputCls} placeholder="tomt = obegränsat" />
            </Field>
            <Field label="Max bokningar per period">
              <input type="number" min={1} value={form.maxBookingsPerPeriod} onChange={(e) => setForm((f) => ({ ...f, maxBookingsPerPeriod: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Period (dygn)">
              <input type="number" min={1} value={form.periodDays} onChange={(e) => setForm((f) => ({ ...f, periodDays: e.target.value }))} className={inputCls} placeholder="t.ex. 30" />
            </Field>
            <Field label={form.bookingMode === "DAYS" ? "Max dygn i följd" : form.bookingMode === "SLOTS" ? "Max pass i följd" : "Max enheter i följd"}>
              <input type="number" min={1} value={form.maxConsecutiveUnits} onChange={(e) => setForm((f) => ({ ...f, maxConsecutiveUnits: e.target.value }))} className={inputCls} placeholder="tomt = obegränsat" />
            </Field>
          </Section>

          <Section title="Priority & anti-gaming">
            <Field label="Priority-fönster (dygn)">
              <input type="number" min={1} value={form.priorityWindowDays} onChange={(e) => setForm((f) => ({ ...f, priorityWindowDays: e.target.value }))} className={inputCls}
                placeholder="titta tillbaka X dygn på resurstyp" />
            </Field>
            <Field label="Avbok-lås (timmar)">
              <input type="number" min={0} value={form.cancelLockHours} onChange={(e) => setForm((f) => ({ ...f, cancelLockHours: e.target.value }))} className={inputCls}
                placeholder="sen avbokning räknas mot priority" />
            </Field>
          </Section>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-blue-200">
            {!editingId && form.bookingMode === "SLOTS" && TYPE_DEFAULTS[form.type].slotTemplate.length > 0 ? (
              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={createDefaultSlots} onChange={(e) => setCreateDefaultSlots(e.target.checked)} />
                Skapa standard-pass direkt ({TYPE_DEFAULTS[form.type].slotTemplate.length} pass × 7 dagar = {TYPE_DEFAULTS[form.type].slotTemplate.length * 7} pass)
              </label>
            ) : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
              <button type="submit" disabled={createResource.isPending || updateResource.isPending}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {editingId ? (updateResource.isPending ? "Sparar..." : "Spara") : (createResource.isPending ? "Skapar..." : "Skapa")}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, colSpan = 1, children }: { label: string; colSpan?: 1 | 2 | 3; children: React.ReactNode }) {
  const cls = colSpan === 3 ? "col-span-3" : colSpan === 2 ? "col-span-2" : "";
  return (
    <div className={cls}>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SlotEditor
// ─────────────────────────────────────────────────────────────

type Slot = {
  id: string;
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  label: string | null;
  active: boolean;
};

function SlotEditor({ resourceId, slots, onChange }: { resourceId: string; slots: Slot[]; onChange: () => void }) {
  const createSlot = trpc.booking.createSlot.useMutation({ onSuccess: () => { onChange(); resetNew(); } });
  const updateSlot = trpc.booking.updateSlot.useMutation({ onSuccess: () => onChange() });
  const deleteSlot = trpc.booking.deleteSlot.useMutation({ onSuccess: () => onChange() });

  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startHour: 7, startMinute: 0, endHour: 11, endMinute: 0, label: "" });
  function resetNew() { setNewSlot({ dayOfWeek: 1, startHour: 7, startMinute: 0, endHour: 11, endMinute: 0, label: "" }); }

  function addSlot() {
    createSlot.mutate({
      resourceId,
      data: { ...newSlot, label: newSlot.label.trim() || null, active: true },
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="space-y-1">
        {slots.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-xs bg-white rounded border border-gray-200 px-2 py-1">
            <span className="w-10">{DAYS[s.dayOfWeek]}</span>
            <span className="w-24 font-mono">
              {String(s.startHour).padStart(2, "0")}:{String(s.startMinute).padStart(2, "0")}–{String(s.endHour).padStart(2, "0")}:{String(s.endMinute).padStart(2, "0")}
            </span>
            <span className="flex-1 text-gray-500">{s.label ?? ""}</span>
            <button onClick={() => updateSlot.mutate({ id: s.id, data: { dayOfWeek: s.dayOfWeek, startHour: s.startHour, startMinute: s.startMinute, endHour: s.endHour, endMinute: s.endMinute, label: s.label, active: !s.active } })}
              className={`rounded p-1 ${s.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
              title={s.active ? "Inaktivera" : "Aktivera"}>
              <Power className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { if (confirm("Ta bort passet?")) deleteSlot.mutate({ id: s.id }); }}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 text-xs bg-blue-50/60 rounded border border-blue-200 p-2">
        <div>
          <label className="block text-[10px] text-gray-600 mb-0.5">Dag</label>
          <select value={newSlot.dayOfWeek} onChange={(e) => setNewSlot((s) => ({ ...s, dayOfWeek: parseInt(e.target.value) }))}
            className="rounded border border-gray-300 px-1 py-0.5">
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-600 mb-0.5">Från</label>
          <div className="flex items-center gap-0.5">
            <input type="number" min={0} max={23} value={newSlot.startHour} onChange={(e) => setNewSlot((s) => ({ ...s, startHour: parseInt(e.target.value) || 0 }))}
              className="w-12 rounded border border-gray-300 px-1 py-0.5" />:
            <input type="number" min={0} max={59} value={newSlot.startMinute} onChange={(e) => setNewSlot((s) => ({ ...s, startMinute: parseInt(e.target.value) || 0 }))}
              className="w-12 rounded border border-gray-300 px-1 py-0.5" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-600 mb-0.5">Till</label>
          <div className="flex items-center gap-0.5">
            <input type="number" min={0} max={24} value={newSlot.endHour} onChange={(e) => setNewSlot((s) => ({ ...s, endHour: parseInt(e.target.value) || 0 }))}
              className="w-12 rounded border border-gray-300 px-1 py-0.5" />:
            <input type="number" min={0} max={59} value={newSlot.endMinute} onChange={(e) => setNewSlot((s) => ({ ...s, endMinute: parseInt(e.target.value) || 0 }))}
              className="w-12 rounded border border-gray-300 px-1 py-0.5" />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-gray-600 mb-0.5">Etikett</label>
          <input value={newSlot.label} onChange={(e) => setNewSlot((s) => ({ ...s, label: e.target.value }))}
            placeholder="Morgon, Kväll, ..." className="w-full rounded border border-gray-300 px-1 py-0.5" />
        </div>
        <button onClick={addSlot} disabled={createSlot.isPending}
          className="rounded bg-blue-600 px-2 py-1 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
