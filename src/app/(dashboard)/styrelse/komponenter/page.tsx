"use client";

import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Wrench, Plus, Loader2, ChevronDown, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { K3_COMPONENT_TEMPLATES, CATEGORY_LABELS, CONDITION_LABELS, CONDITION_COLORS } from "@/lib/k3-components";

export default function ComponentRegistryPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [form, setForm] = useState({
    buildingId: "", category: "ROOF" as string, name: "",
    installYear: "", expectedLifespan: "", condition: "GOOD" as string,
    nextActionYear: "", estimatedCost: "", notes: "",
  });
  const [view, setView] = useState<"register" | "timeline">("register");

  const componentsQuery = trpc.property.listComponents.useQuery();
  const buildingsQuery = trpc.member.getApartments.useQuery();
  const addComponent = trpc.property.addComponent.useMutation({
    onSuccess: () => { setShowForm(false); componentsQuery.refetch(); },
  });

  const components = componentsQuery.data ?? [];
  const currentYear = new Date().getFullYear();

  // Group by category
  const byCategory = components.reduce((acc, c) => {
    const cat = c.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {} as Record<string, typeof components>);

  // Timeline: next 30 years
  const timelineYears = Array.from({ length: 30 }, (_, i) => currentYear + i);
  const componentsByYear = timelineYears.map((year) => ({
    year,
    components: components.filter((c) => c.nextActionYear === year),
    totalCost: components.filter((c) => c.nextActionYear === year).reduce((s, c) => s + (c.estimatedCost ?? 0), 0),
  })).filter((y) => y.components.length > 0);

  function applyTemplate(templateName: string) {
    const tmpl = K3_COMPONENT_TEMPLATES.find((t) => t.name === templateName);
    if (tmpl) {
      setForm((f) => ({
        ...f,
        category: tmpl.category,
        name: tmpl.name,
        expectedLifespan: String(tmpl.typicalLifespan),
        notes: tmpl.description,
      }));
    }
  }

  // Get unique buildings from components
  const buildings = [...new Map(components.map((c) => [c.building.name, c.building])).values()];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" /> Komponentregister
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            K3-kompatibelt register — {components.length} komponenter
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("register")}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium", view === "register" ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50")}>
            Register
          </button>
          <button onClick={() => setView("timeline")}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium", view === "timeline" ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50")}>
            Underhållsplan
          </button>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Ny komponent
          </button>
        </div>
      </div>

      {/* Add component form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Lägg till komponent</h2>

          <div>
            <label className="text-xs text-gray-500">Välj från K3-mall (valfritt)</label>
            <select value={selectedTemplate} onChange={(e) => { setSelectedTemplate(e.target.value); applyTemplate(e.target.value); }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              <option value="">— Välj mall eller fyll i manuellt —</option>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                const templates = K3_COMPONENT_TEMPLATES.filter((t) => t.category === cat);
                if (templates.length === 0) return null;
                return (
                  <optgroup key={cat} label={label}>
                    {templates.map((t) => (
                      <option key={t.name} value={t.name}>{t.name} ({t.typicalLifespan} år)</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Byggnad</label>
              <select value={form.buildingId} onChange={(e) => setForm((f) => ({ ...f, buildingId: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                <option value="">Välj byggnad...</option>
                {/* We need building IDs - use a simple approach */}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Kategori</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Namn</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="T.ex. Yttertak — Hus A"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500">Installationsår</label>
              <input type="number" value={form.installYear} onChange={(e) => setForm((f) => ({ ...f, installYear: e.target.value }))}
                placeholder="1972" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Livslängd (år)</label>
              <input type="number" value={form.expectedLifespan} onChange={(e) => setForm((f) => ({ ...f, expectedLifespan: e.target.value }))}
                placeholder="30" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Skick</label>
              <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Planerat åtgärdsår</label>
              <input type="number" value={form.nextActionYear} onChange={(e) => setForm((f) => ({ ...f, nextActionYear: e.target.value }))}
                placeholder={String(currentYear + 5)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Beräknad åtgärdskostnad (kr)</label>
            <input type="number" value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
              placeholder="500000" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>

          <div>
            <label className="text-xs text-gray-500">Anteckningar</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => {
              if (!form.name || !form.buildingId) return;
              addComponent.mutate({
                buildingId: form.buildingId,
                category: form.category as never,
                name: form.name,
                installYear: form.installYear ? parseInt(form.installYear) : undefined,
                expectedLifespan: form.expectedLifespan ? parseInt(form.expectedLifespan) : undefined,
                condition: form.condition as never,
                nextActionYear: form.nextActionYear ? parseInt(form.nextActionYear) : undefined,
                estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
                notes: form.notes || undefined,
              });
            }} disabled={addComponent.isPending || !form.name}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {addComponent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Spara"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Avbryt</button>
          </div>
          {addComponent.error && <p className="text-sm text-red-600">{addComponent.error.message}</p>}
        </div>
      )}

      {componentsQuery.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}

      {/* Register view */}
      {view === "register" && !componentsQuery.isLoading && (
        <div className="space-y-4">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">{CATEGORY_LABELS[category] ?? category} ({items.length})</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-2">Komponent</th>
                    <th className="px-4 py-2">Byggnad</th>
                    <th className="px-4 py-2">Installerad</th>
                    <th className="px-4 py-2">Livslängd</th>
                    <th className="px-4 py-2">Skick</th>
                    <th className="px-4 py-2">Åtgärd</th>
                    <th className="px-4 py-2 text-right">Kostnad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((c) => {
                    const age = c.installYear ? currentYear - c.installYear : null;
                    const overdue = c.nextActionYear && c.nextActionYear <= currentYear;
                    return (
                      <tr key={c.id} className={cn("hover:bg-gray-50", overdue && "bg-red-50/50")}>
                        <td className="px-4 py-2 text-sm text-gray-900">{c.name}</td>
                        <td className="px-4 py-2 text-xs text-gray-500">{c.building.name}</td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {c.installYear ?? "—"}
                          {age !== null && <span className="text-gray-400"> ({age} år)</span>}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">{c.expectedLifespan ? `${c.expectedLifespan} år` : "—"}</td>
                        <td className="px-4 py-2">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CONDITION_COLORS[c.condition])}>
                            {CONDITION_LABELS[c.condition]}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {c.nextActionYear ? (
                            <span className={cn(overdue ? "text-red-600 font-medium" : "text-gray-700")}>
                              {overdue && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                              {c.nextActionYear}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-700 text-right">
                          {c.estimatedCost ? `${c.estimatedCost.toLocaleString("sv-SE")} kr` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
          {components.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Inga komponenter registrerade</h3>
              <p className="mt-1 text-sm text-gray-500">Lägg till komponenter från K3-mallarna för att bygga ert register.</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline view (Underhållsplan) */}
      {view === "timeline" && !componentsQuery.isLoading && (
        <div className="space-y-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" /> Underhållsplan — 30 år
              </h2>
              <div className="text-sm text-gray-500">
                Total planerad kostnad: <span className="font-bold text-gray-900">
                  {components.reduce((s, c) => s + (c.estimatedCost ?? 0), 0).toLocaleString("sv-SE")} kr
                </span>
              </div>
            </div>
          </div>

          {componentsByYear.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">Inga planerade åtgärder. Ange planerat åtgärdsår på komponenter i registret.</p>
            </div>
          ) : (
            componentsByYear.map(({ year, components: yearComponents, totalCost }) => (
              <div key={year} className={cn("rounded-lg border bg-white p-4",
                year <= currentYear ? "border-red-200 bg-red-50/30" :
                year <= currentYear + 2 ? "border-amber-200" : "border-gray-200")}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {year <= currentYear && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {year}
                    {year === currentYear && <span className="text-xs text-gray-400">(i år)</span>}
                  </h3>
                  <span className="text-sm font-bold text-gray-700">{totalCost.toLocaleString("sv-SE")} kr</span>
                </div>
                <div className="space-y-1">
                  {yearComponents.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CONDITION_COLORS[c.condition])}>
                          {CONDITION_LABELS[c.condition]}
                        </span>
                        <span className="text-gray-700">{c.name}</span>
                        <span className="text-xs text-gray-400">({CATEGORY_LABELS[c.category]})</span>
                      </div>
                      <span className="text-xs text-gray-600">{c.estimatedCost ? `${c.estimatedCost.toLocaleString("sv-SE")} kr` : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
