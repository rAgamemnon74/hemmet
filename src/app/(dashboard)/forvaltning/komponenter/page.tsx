"use client";

import { useState } from "react";
import {
  Wrench, Plus, Loader2, Calendar, AlertTriangle, Building2,
  ChevronDown, ChevronRight, X, Save, EyeOff, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { K3_COMPONENT_TEMPLATES, CATEGORY_LABELS, CONDITION_LABELS, CONDITION_COLORS } from "@/lib/k3-components";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);
const currentYear = new Date().getFullYear();

export default function ComponentRegistryPage() {
  const [view, setView] = useState<"register" | "timeline">("register");

  const propertiesQuery = trpc.property.listPropertiesWithBuildings.useQuery();
  const componentsQuery = trpc.property.listComponents.useQuery();
  const addComponent = trpc.property.addComponent.useMutation({ onSuccess: () => { propertiesQuery.refetch(); componentsQuery.refetch(); } });
  const updateComponent = trpc.property.updateComponent.useMutation({ onSuccess: () => { propertiesQuery.refetch(); componentsQuery.refetch(); } });
  const toggleCategory = trpc.property.toggleCategoryExclusion.useMutation({ onSuccess: () => propertiesQuery.refetch() });

  const properties = propertiesQuery.data ?? [];
  const buildings = properties.flatMap((p) => p.buildings);
  const allComponents = componentsQuery.data ?? [];

  // Timeline data
  const timelineYears = Array.from({ length: 30 }, (_, i) => currentYear + i);
  const componentsByYear = timelineYears.map((year) => ({
    year,
    components: allComponents.filter((c) => c.nextActionYear === year),
    totalCost: allComponents.filter((c) => c.nextActionYear === year).reduce((s, c) => s + (c.estimatedCost ?? 0), 0),
  })).filter((y) => y.components.length > 0);

  if (propertiesQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const totalComponents = buildings.reduce((s, b) => s + b.components.length, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" /> Komponentregister
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            K3-kompatibelt register — {totalComponents} komponenter i {buildings.length} byggnader
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
        </div>
      </div>

      {/* Register view — property → building → components */}
      {view === "register" && (
        <div className="space-y-8">
          {properties.map((prop) => (
            <div key={prop.id}>
              {/* Property header */}
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {prop.propertyDesignation ?? prop.address}
                </h2>
                <span className="text-sm text-gray-500">{prop.address}{prop.city ? `, ${prop.city}` : ""}</span>
                {prop.plotArea && <span className="text-xs text-gray-400">{prop.plotArea.toLocaleString("sv-SE")} kvm tomt</span>}
              </div>

              {/* Buildings under this property */}
              <div className="space-y-4">
                {prop.buildings.map((building) => (
                  <BuildingSection key={building.id} building={building}
                    onAddComponent={(data) => addComponent.mutate(data as never)}
                    onUpdateComponent={(data) => updateComponent.mutate(data as never)}
                    onToggleCategory={(category, excluded) => toggleCategory.mutate({ buildingId: building.id, category, excluded })}
                    saving={addComponent.isPending || updateComponent.isPending} />
                ))}
                {prop.buildings.length === 0 && (
                  <p className="text-sm text-gray-400 pl-2">Inga hus registrerade på denna fastighet.</p>
                )}
              </div>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Inga fastigheter registrerade</h3>
              <p className="mt-1 text-sm text-gray-500">Lägg till fastigheter under Inställningar.</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline view */}
      {view === "timeline" && (
        <div className="space-y-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" /> Underhållsplan — 30 år
              </h2>
              <div className="text-sm text-gray-500">
                Uppskattad total: <span className="font-bold text-gray-900">
                  ~{allComponents.reduce((s, c) => s + (c.estimatedCost ?? 0), 0).toLocaleString("sv-SE")} kr
                </span>
                <span className="text-xs text-gray-400 ml-1">({currentYear} års priser)</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Alla belopp är uppskattningar i {currentYear} års penningvärde. Faktisk kostnad påverkas av inflation, marknadspriser och åtgärdens omfattning.
          </p>
          {componentsByYear.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">Inga planerade åtgärder. Ange planerat åtgärdsår i registret.</p>
            </div>
          ) : (
            componentsByYear.map(({ year, components, totalCost }) => (
              <div key={year} className={cn("rounded-lg border bg-white p-4",
                year <= currentYear ? "border-red-200 bg-red-50/30" :
                year <= currentYear + 2 ? "border-amber-200" : "border-gray-200")}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {year <= currentYear && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {year} {year === currentYear && <span className="text-xs text-gray-400">(i år)</span>}
                  </h3>
                  <span className="text-sm font-bold text-gray-700">{totalCost.toLocaleString("sv-SE")} kr</span>
                </div>
                <div className="space-y-1">
                  {components.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CONDITION_COLORS[c.condition])}>
                          {CONDITION_LABELS[c.condition]}
                        </span>
                        <span className="text-gray-700">{c.name}</span>
                        <span className="text-xs text-gray-400">{c.building.name}</span>
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

type BuildingData = {
  id: string; name: string; address: string; constructionYear: number | null;
  excludedComponentCategories: string[];
  components: Array<{
    id: string; category: string; name: string; installYear: number | null;
    expectedLifespan: number | null; condition: string; lastInspectedAt: Date | null;
    nextActionYear: number | null; estimatedCost: number | null; notes: string | null;
  }>;
};

function BuildingSection({ building, onAddComponent, onUpdateComponent, onToggleCategory, saving }: {
  building: BuildingData;
  onAddComponent: (data: Record<string, unknown>) => void;
  onUpdateComponent: (data: Record<string, unknown>) => void;
  onToggleCategory: (category: string, excluded: boolean) => void;
  saving: boolean;
}) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", installYear: "", expectedLifespan: "", condition: "GOOD", nextActionYear: "", estimatedCost: "", notes: "" });
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const excluded = new Set(building.excludedComponentCategories);
  const componentsByCategory = building.components.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, typeof building.components>);

  function startAdd(category: string) {
    setAddingTo(category);
    setSelectedTemplate("");
    setForm({ name: "", installYear: building.constructionYear ? String(building.constructionYear) : "", expectedLifespan: "", condition: "GOOD", nextActionYear: "", estimatedCost: "", notes: "" });
  }

  function startEdit(comp: typeof building.components[0]) {
    setEditingId(comp.id);
    setForm({
      name: comp.name, installYear: comp.installYear ? String(comp.installYear) : "",
      expectedLifespan: comp.expectedLifespan ? String(comp.expectedLifespan) : "",
      condition: comp.condition, nextActionYear: comp.nextActionYear ? String(comp.nextActionYear) : "",
      estimatedCost: comp.estimatedCost ? String(comp.estimatedCost) : "", notes: comp.notes ?? "",
    });
  }

  function applyTemplate(name: string) {
    const tmpl = K3_COMPONENT_TEMPLATES.find((t) => t.name === name);
    if (tmpl) {
      setForm((f) => ({ ...f, name: tmpl.name, expectedLifespan: String(tmpl.typicalLifespan), notes: tmpl.description }));
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Building header */}
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">{building.name}</h2>
            <span className="text-sm text-gray-500">{building.address}</span>
            {building.constructionYear && <span className="text-xs text-gray-400">Byggt {building.constructionYear}</span>}
          </div>
          <span className="text-xs text-gray-400">{building.components.length} komponenter</span>
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100">
        {ALL_CATEGORIES.map((category) => {
          if (excluded.has(category)) {
            return (
              <div key={category} className="px-5 py-2 flex items-center justify-between bg-gray-50/50">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <EyeOff className="h-3.5 w-3.5" />
                  {CATEGORY_LABELS[category]} — ej aktuellt
                </span>
                <button onClick={() => onToggleCategory(category, false)}
                  className="text-xs text-blue-600 hover:text-blue-800">
                  <Eye className="inline h-3 w-3 mr-0.5" /> Aktivera
                </button>
              </div>
            );
          }

          const items = componentsByCategory[category] ?? [];
          const isExpanded = expandedCat === category;

          return (
            <div key={category}>
              <button onClick={() => setExpandedCat(isExpanded ? null : category)}
                className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-gray-50 text-left">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  <span className="text-sm font-medium text-gray-700">{CATEGORY_LABELS[category]}</span>
                  <span className="text-xs text-gray-400">
                    {items.length > 0 ? `${items.length} st` : "inga registrerade"}
                  </span>
                  {items.some((c) => c.nextActionYear && c.nextActionYear <= currentYear) && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {items.reduce((s, c) => s + (c.estimatedCost ?? 0), 0).toLocaleString("sv-SE")} kr planerat
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-3 space-y-2">
                  {/* Existing components */}
                  {items.map((comp) => {
                    const age = comp.installYear ? currentYear - comp.installYear : null;
                    const overdue = comp.nextActionYear && comp.nextActionYear <= currentYear;
                    const isEditing = editingId === comp.id;

                    if (isEditing) {
                      return (
                        <div key={comp.id} className="rounded border border-blue-200 bg-blue-50/30 p-3 space-y-2">
                          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                          <div className="grid grid-cols-5 gap-2">
                            <div>
                              <label className="text-xs text-gray-500">Installerad</label>
                              <input type="number" value={form.installYear} onChange={(e) => setForm((f) => ({ ...f, installYear: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Livslängd</label>
                              <input type="number" value={form.expectedLifespan} onChange={(e) => setForm((f) => ({ ...f, expectedLifespan: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Skick</label>
                              <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs">
                                {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Åtgärdsår</label>
                              <input type="number" value={form.nextActionYear} onChange={(e) => setForm((f) => ({ ...f, nextActionYear: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Uppskattad kostnad (kr)</label>
                              <input type="number" value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              onUpdateComponent({
                                id: comp.id,
                                condition: form.condition as never,
                                nextActionYear: form.nextActionYear ? parseInt(form.nextActionYear) : undefined,
                                estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
                                notes: form.notes || undefined,
                              });
                              setEditingId(null);
                            }} className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">
                              <Save className="h-3 w-3" /> Spara
                            </button>
                            <button onClick={() => setEditingId(null)} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">Avbryt</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={comp.id} onClick={() => startEdit(comp)}
                        className={cn("rounded border p-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50",
                          overdue ? "border-red-200 bg-red-50/30" : "border-gray-100")}>
                        <div className="flex items-center gap-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CONDITION_COLORS[comp.condition])}>
                            {CONDITION_LABELS[comp.condition]}
                          </span>
                          <span className="text-sm text-gray-900">{comp.name}</span>
                          {age !== null && <span className="text-xs text-gray-400">{comp.installYear} ({age} år)</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {comp.expectedLifespan && <span className="text-gray-400">{comp.expectedLifespan} års livslängd</span>}
                          {comp.nextActionYear && (
                            <span className={overdue ? "text-red-600 font-medium" : "text-gray-600"}>
                              {overdue && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                              Åtgärd {comp.nextActionYear}
                            </span>
                          )}
                          {comp.estimatedCost && <span className="text-gray-600">{comp.estimatedCost.toLocaleString("sv-SE")} kr</span>}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add form */}
                  {addingTo === category ? (
                    <div className="rounded border border-green-200 bg-green-50/30 p-3 space-y-2">
                      <select value={selectedTemplate} onChange={(e) => { setSelectedTemplate(e.target.value); applyTemplate(e.target.value); }}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                        <option value="">— Välj K3-mall eller fyll i manuellt —</option>
                        {K3_COMPONENT_TEMPLATES.filter((t) => t.category === category).map((t) => (
                          <option key={t.name} value={t.name}>{t.name} ({t.typicalLifespan} år)</option>
                        ))}
                      </select>
                      <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Komponentnamn" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                      <div className="grid grid-cols-4 gap-2">
                        <input type="number" value={form.installYear} onChange={(e) => setForm((f) => ({ ...f, installYear: e.target.value }))}
                          placeholder="Installerad" className="rounded-md border border-gray-300 px-2 py-1 text-xs" />
                        <input type="number" value={form.expectedLifespan} onChange={(e) => setForm((f) => ({ ...f, expectedLifespan: e.target.value }))}
                          placeholder="Livslängd (år)" className="rounded-md border border-gray-300 px-2 py-1 text-xs" />
                        <input type="number" value={form.nextActionYear} onChange={(e) => setForm((f) => ({ ...f, nextActionYear: e.target.value }))}
                          placeholder="Åtgärdsår" className="rounded-md border border-gray-300 px-2 py-1 text-xs" />
                        <input type="number" value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                          placeholder="Uppskattad kostnad (kr)" className="rounded-md border border-gray-300 px-2 py-1 text-xs" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          if (!form.name) return;
                          onAddComponent({
                            buildingId: building.id, category: category as never, name: form.name,
                            installYear: form.installYear ? parseInt(form.installYear) : undefined,
                            expectedLifespan: form.expectedLifespan ? parseInt(form.expectedLifespan) : undefined,
                            condition: form.condition as never,
                            nextActionYear: form.nextActionYear ? parseInt(form.nextActionYear) : undefined,
                            estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
                            notes: form.notes || undefined,
                          });
                          setAddingTo(null);
                        }} disabled={saving || !form.name}
                          className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50">
                          <Plus className="h-3 w-3" /> Lägg till
                        </button>
                        <button onClick={() => setAddingTo(null)} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600">Avbryt</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => startAdd(category)}
                        className="inline-flex items-center gap-1 rounded border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600">
                        <Plus className="h-3 w-3" /> Lägg till komponent
                      </button>
                      <button onClick={() => onToggleCategory(category, true)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-600">
                        <EyeOff className="h-3 w-3" /> Inte aktuellt
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
