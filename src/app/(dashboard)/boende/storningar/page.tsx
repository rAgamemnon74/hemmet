"use client";

import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ShieldAlert, Plus, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = {
  NOISE: "Buller", SMOKE: "Rök/lukt", THREATS: "Hot/otrygghet",
  PROPERTY_DAMAGE: "Skadegörelse", COMMON_AREA_MISUSE: "Missbruk av gemensamma utrymmen",
  PETS: "Husdjur", WASTE: "Sophantering", OTHER: "Övrigt",
};
const statusLabels: Record<string, string> = {
  REPORTED: "Anmäld", ACKNOWLEDGED: "Noterad", FIRST_WARNING: "Tillsägelse",
  SECOND_WARNING: "Varning", BOARD_REVIEW: "Styrelsegranskning",
  RESOLVED: "Löst", ESCALATED: "Eskalerad", CLOSED: "Stängd",
};
const statusColors: Record<string, string> = {
  REPORTED: "bg-amber-100 text-amber-700", ACKNOWLEDGED: "bg-blue-100 text-blue-700",
  FIRST_WARNING: "bg-orange-100 text-orange-700", SECOND_WARNING: "bg-red-100 text-red-700",
  BOARD_REVIEW: "bg-purple-100 text-purple-700", RESOLVED: "bg-green-100 text-green-700",
  ESCALATED: "bg-red-100 text-red-700", CLOSED: "bg-gray-100 text-gray-500",
};

export default function DisturbancePage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "NOISE" as string, description: "", location: "" });

  const submit = trpc.disturbance.report.useMutation({
    onSuccess: () => { setShowForm(false); setForm({ type: "NOISE", description: "", location: "" }); },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-amber-600" /> Störningsanmälan
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Anmäl störningar i boendet. Styrelsen hanterar ärendet enligt föreningens ordningsregler.
      </p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="mb-6 inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
          <Plus className="h-4 w-4" /> Ny anmälan
        </button>
      ) : (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Anmäl störning</h2>

          <div>
            <label className="text-xs font-medium text-gray-500">Typ av störning</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Beskrivning</label>
            <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Beskriv störningen: vad händer, när, hur ofta..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Plats</label>
            <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="T.ex. Lägenhet 2001, trapphus B, innergården..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => submit.mutate({ type: form.type as never, description: form.description, location: form.location || undefined })}
              disabled={submit.isPending || form.description.length < 10}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skicka anmälan"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Avbryt
            </button>
          </div>
          {submit.error && <p className="text-sm text-red-600">{submit.error.message}</p>}
          {submit.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Anmälan skickad! Styrelsen hanterar ärendet.</p>}
        </div>
      )}
    </div>
  );
}
