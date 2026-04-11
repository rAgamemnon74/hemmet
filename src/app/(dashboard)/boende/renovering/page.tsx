"use client";

import { useState } from "react";
import { Hammer, Plus, Loader2, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = {
  KITCHEN: "Kök", BATHROOM: "Badrum", FLOORING: "Golv", WALLS: "Väggar",
  ELECTRICAL: "El", PLUMBING: "VVS", VENTILATION: "Ventilation", BALCONY: "Balkong", OTHER: "Övrigt",
};

export default function RenovationPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "KITCHEN" as string, description: "", affectsStructure: false,
    affectsPlumbing: false, affectsElectrical: false, affectsVentilation: false,
    plannedStartDate: "", plannedEndDate: "", estimatedCost: "",
  });

  const profileQuery = trpc.profile.get.useQuery();
  const submit = trpc.renovation.submit.useMutation({
    onSuccess: () => { setShowForm(false); },
  });

  const profile = profileQuery.data;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Hammer className="h-6 w-6 text-blue-600" /> Renoveringsansökan
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Ansök om tillstånd för renovering av din lägenhet. Renoveringar som påverkar bärande konstruktion, VVS, el eller ventilation kräver styrelsens godkännande.
      </p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="mb-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Ny ansökan
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Ansökan om renovering</h2>

          <div>
            <label className="text-xs font-medium text-gray-500">Typ av renovering</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Beskrivning av arbetet</label>
            <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Beskriv vad du planerar att göra..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Renoveringen påverkar:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "affectsStructure", label: "Bärande konstruktion" },
                { key: "affectsPlumbing", label: "VVS / stammar" },
                { key: "affectsElectrical", label: "El / elcentral" },
                { key: "affectsVentilation", label: "Ventilation" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 rounded border border-gray-200 p-2 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={(form as Record<string, unknown>)[key] as boolean}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            {(form.affectsStructure || form.affectsPlumbing || form.affectsElectrical || form.affectsVentilation) && (
              <p className="mt-2 text-xs text-amber-600">Renoveringen påverkar byggnadens installationer — teknisk bedömning av fastighetsansvarig krävs.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Planerad start</label>
              <input type="date" value={form.plannedStartDate} onChange={(e) => setForm((f) => ({ ...f, plannedStartDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Planerat slut</label>
              <input type="date" value={form.plannedEndDate} onChange={(e) => setForm((f) => ({ ...f, plannedEndDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Uppskattad kostnad (kr)</label>
            <input type="number" value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
              placeholder="Valfritt"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => {
              if (!profile?.apartment) return;
              submit.mutate({
                apartmentId: profile.apartment.id,
                type: form.type as never,
                description: form.description,
                affectsStructure: form.affectsStructure,
                affectsPlumbing: form.affectsPlumbing,
                affectsElectrical: form.affectsElectrical,
                affectsVentilation: form.affectsVentilation,
                plannedStartDate: form.plannedStartDate ? new Date(form.plannedStartDate) : undefined,
                plannedEndDate: form.plannedEndDate ? new Date(form.plannedEndDate) : undefined,
                estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
              });
            }} disabled={submit.isPending || !form.description}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skicka ansökan"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Avbryt
            </button>
          </div>
          {submit.error && <p className="text-sm text-red-600">{submit.error.message}</p>}
          {submit.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Ansökan skickad!</p>}
        </div>
      )}
    </div>
  );
}
