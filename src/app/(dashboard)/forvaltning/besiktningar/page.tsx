"use client";

import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ClipboardCheck, AlertTriangle, CheckCircle, Plus, Save, X, Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const INSPECTION_TYPES = [
  { type: "OVK", label: "OVK (ventilation)", requiredAlways: true, requiredComponent: null, interval: "3-6 år" },
  { type: "ELEVATOR", label: "Hissbesiktning", requiredAlways: false, requiredComponent: "ELEVATOR", interval: "Årlig" },
  { type: "FIRE_SAFETY", label: "Brandskydd (SBA)", requiredAlways: true, requiredComponent: null, interval: "Löpande" },
  { type: "ENERGY", label: "Energideklaration", requiredAlways: true, requiredComponent: null, interval: "10 år" },
  { type: "RADON", label: "Radonmätning", requiredAlways: false, requiredComponent: null, interval: "Vid behov" },
  { type: "PLAYGROUND", label: "Lekplatsbesiktning", requiredAlways: false, requiredComponent: "OUTDOOR", interval: "Årlig" },
  { type: "CISTERN", label: "Cisternkontroll", requiredAlways: false, requiredComponent: null, interval: "6-12 år" },
] as const;

const resultLabels: Record<string, string> = {
  APPROVED: "Godkänd", APPROVED_WITH_REMARKS: "Med anmärkningar", FAILED: "Underkänd", PENDING: "Planerad",
};
const resultColors: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700", APPROVED_WITH_REMARKS: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700", PENDING: "bg-gray-100 text-gray-500",
};

export default function InspectionsPage() {
  const [addingFor, setAddingFor] = useState<{ buildingId: string; type: string } | null>(null);
  const [form, setForm] = useState({ completedAt: "", result: "PENDING", inspector: "", nextDueAt: "", remarks: "" });

  const buildingsQuery = trpc.property.listBuildingsWithComponents.useQuery();
  const inspectionsQuery = trpc.property.listInspections.useQuery();
  const addInspection = trpc.property.addInspection.useMutation({
    onSuccess: () => { setAddingFor(null); inspectionsQuery.refetch(); },
  });

  if (buildingsQuery.isLoading || inspectionsQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const buildings = buildingsQuery.data ?? [];
  const inspections = inspectionsQuery.data ?? [];
  const now = new Date();

  function handleSave() {
    if (!addingFor) return;
    addInspection.mutate({
      buildingId: addingFor.buildingId,
      type: addingFor.type as never,
      completedAt: form.completedAt ? new Date(form.completedAt) : undefined,
      result: form.result as never,
      inspector: form.inspector || undefined,
      nextDueAt: form.nextDueAt ? new Date(form.nextDueAt) : undefined,
      remarks: form.remarks || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ClipboardCheck className="h-6 w-6 text-blue-600" /> Besiktningar
      </h1>

      {buildings.map((building) => {
        const excluded = new Set(building.excludedComponentCategories);
        const hasComponent = (cat: string) => building.components.some((c) => c.category === cat);
        const buildingInspections = inspections.filter((i) => i.building.name === building.name);

        // Relevant types based on building's actual components
        const relevantTypes = INSPECTION_TYPES.filter((t) => {
          if (t.requiredAlways) return true;
          if (t.requiredComponent) return hasComponent(t.requiredComponent) && !excluded.has(t.requiredComponent);
          return false;
        });

        const existingTypes = new Set(buildingInspections.map((i) => i.type));
        const allTypes = [...new Set([...relevantTypes.map((t) => t.type), ...existingTypes])];
        const hiddenTypes = INSPECTION_TYPES.filter((t) => !allTypes.includes(t.type));

        return (
          <div key={building.id} className="mb-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">{building.name}</h2>
              <span className="text-xs text-gray-500">{building.address}</span>
            </div>

            <div className="divide-y divide-gray-100">
              {allTypes.map((type) => {
                const typeInfo = INSPECTION_TYPES.find((t) => t.type === type);
                const typeInspections = buildingInspections.filter((i) => i.type === type);
                const latest = typeInspections[0];
                const isOverdue = latest?.nextDueAt && new Date(latest.nextDueAt) < now;
                const noInspection = typeInspections.length === 0;
                const isAdding = addingFor?.buildingId === building.id && addingFor?.type === type;

                return (
                  <div key={type} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {noInspection ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : isOverdue ? (
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{typeInfo?.label ?? type}</p>
                          <p className="text-xs text-gray-400">Intervall: {typeInfo?.interval ?? "—"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {latest ? (
                          <>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", resultColors[latest.result])}>
                              {resultLabels[latest.result]}
                            </span>
                            {latest.completedAt && (
                              <span className="text-xs text-gray-400">
                                {format(new Date(latest.completedAt), "d MMM yyyy", { locale: sv })}
                              </span>
                            )}
                            {latest.nextDueAt && (
                              <span className={cn("text-xs", isOverdue ? "text-red-600 font-medium" : "text-gray-500")}>
                                {isOverdue ? "Förfallen: " : "Nästa: "}
                                {format(new Date(latest.nextDueAt), "d MMM yyyy", { locale: sv })}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-amber-600">Ej registrerad</span>
                        )}
                        <button onClick={() => { setAddingFor({ buildingId: building.id, type }); setForm({ completedAt: "", result: "PENDING", inspector: "", nextDueAt: "", remarks: "" }); }}
                          className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                          <Plus className="h-3 w-3" /> {latest ? "Ny" : "Registrera"}
                        </button>
                      </div>
                    </div>

                    {/* History */}
                    {typeInspections.length > 1 && (
                      <div className="mt-2 ml-7 space-y-1">
                        {typeInspections.slice(1).map((insp) => (
                          <div key={insp.id} className="flex items-center gap-2 text-xs text-gray-400">
                            <span className={cn("rounded-full px-1.5 py-0.5", resultColors[insp.result])}>
                              {resultLabels[insp.result]}
                            </span>
                            {insp.completedAt && format(new Date(insp.completedAt), "d MMM yyyy", { locale: sv })}
                            {insp.inspector && <span>({insp.inspector})</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add form */}
                    {isAdding && (
                      <div className="mt-3 ml-7 rounded border border-blue-200 bg-blue-50/30 p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">Genomförd</label>
                            <input type="date" value={form.completedAt} onChange={(e) => setForm((f) => ({ ...f, completedAt: e.target.value }))}
                              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Resultat</label>
                            <select value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs">
                              <option value="PENDING">Planerad</option>
                              <option value="APPROVED">Godkänd</option>
                              <option value="APPROVED_WITH_REMARKS">Med anmärkningar</option>
                              <option value="FAILED">Underkänd</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Nästa besiktning</label>
                            <input type="date" value={form.nextDueAt} onChange={(e) => setForm((f) => ({ ...f, nextDueAt: e.target.value }))}
                              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">Besiktare</label>
                            <input type="text" value={form.inspector} onChange={(e) => setForm((f) => ({ ...f, inspector: e.target.value }))}
                              placeholder="Namn / företag" className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Anmärkningar</label>
                            <input type="text" value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSave} disabled={addInspection.isPending}
                            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
                            <Save className="h-3 w-3" /> Spara
                          </button>
                          <button onClick={() => setAddingFor(null)}
                            className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600">
                            <X className="h-3 w-3" /> Avbryt
                          </button>
                        </div>
                        {addInspection.error && <p className="text-xs text-red-600">{addInspection.error.message}</p>}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Hidden optional types */}
              {hiddenTypes.length > 0 && (
                <div className="px-5 py-2">
                  <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-600">Visa övriga besiktningstyper</summary>
                    <div className="mt-2 space-y-1">
                      {hiddenTypes.map((t) => (
                        <div key={t.type} className="flex items-center justify-between py-1">
                          <span className="text-gray-500">{t.label}</span>
                          <button onClick={() => { setAddingFor({ buildingId: building.id, type: t.type }); setForm({ completedAt: "", result: "PENDING", inspector: "", nextDueAt: "", remarks: "" }); }}
                            className="text-blue-600 hover:text-blue-800">Lägg till</button>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
