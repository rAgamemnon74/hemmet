"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ShoppingCart, Plus, FileText, Clock, CheckCircle,
  AlertTriangle, Users, Loader2, Send, Package,
  Scale, Wrench, Link2, X, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const statusLabels: Record<string, string> = {
  NEED: "Behov registrerat", NEED_DEFERRED: "Avvaktar",
  APPROVED: "Godkänd", SPECIFICATION: "Kravspec",
  RFQ_SENT: "Förfrågan skickad", COLLECTING_QUOTES: "Inväntar offerter",
  EVALUATION: "Jämförelse", DECISION_PENDING: "Inväntar leverantörsval",
  ORDERED: "Beställd", IN_PROGRESS: "Pågår",
  COMPLETED: "Slutförd", CANCELLED: "Avbruten", REJECTED: "Avslagen",
};

const statusColors: Record<string, string> = {
  NEED: "bg-amber-100 text-amber-700", NEED_DEFERRED: "bg-gray-100 text-gray-600",
  APPROVED: "bg-blue-100 text-blue-700", SPECIFICATION: "bg-blue-100 text-blue-700",
  RFQ_SENT: "bg-blue-100 text-blue-700", COLLECTING_QUOTES: "bg-blue-100 text-blue-700",
  EVALUATION: "bg-purple-100 text-purple-700", DECISION_PENDING: "bg-amber-100 text-amber-700",
  ORDERED: "bg-green-100 text-green-700", IN_PROGRESS: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-600", CANCELLED: "bg-red-100 text-red-600",
  REJECTED: "bg-red-100 text-red-600",
};

const statusIcons: Record<string, typeof Clock> = {
  NEED: AlertTriangle, NEED_DEFERRED: Clock, APPROVED: CheckCircle,
  SPECIFICATION: FileText, RFQ_SENT: Send, COLLECTING_QUOTES: Clock,
  EVALUATION: Scale, DECISION_PENDING: AlertTriangle,
  ORDERED: Package, IN_PROGRESS: Wrench, COMPLETED: CheckCircle,
};

const categoryLabels: Record<string, string> = {
  PHYSICAL: "Fysisk", SERVICE: "Tjänst", IT_DIGITAL: "IT/Digital",
  FINANCIAL: "Finansiell", INSURANCE: "Försäkring", UTILITY: "Infrastruktur",
};

const CATEGORIES = ["PHYSICAL", "SERVICE", "IT_DIGITAL", "FINANCIAL", "INSURANCE", "UTILITY"] as const;

function dec(v: unknown): number | null {
  if (v == null) return null;
  return Number(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcRow = any;

const now = new Date();

export default function ProcurementPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "PHYSICAL" as string,
    urgency: "PLANNED" as string, estimatedCost: "", triggerTitle: "",
  });

  const procsQuery = trpc.procurement.list.useQuery();
  const createMutation = trpc.procurement.create.useMutation({
    onSuccess: () => { setShowForm(false); procsQuery.refetch(); },
  });

  if (procsQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const procurements = procsQuery.data ?? [];
  const filtered = statusFilter ? procurements.filter((p) => p.status === statusFilter) : procurements;
  const selected = selectedId ? procurements.find((p) => p.id === selectedId) : null;

  const needs = filtered.filter((p) => ["NEED", "NEED_DEFERRED"].includes(p.status));
  const active = filtered.filter((p) => !["NEED", "NEED_DEFERRED", "COMPLETED", "CANCELLED", "REJECTED"].includes(p.status));
  const completed = filtered.filter((p) => ["COMPLETED", "CANCELLED", "REJECTED"].includes(p.status));
  const statuses = [...new Set(procurements.map((p) => p.status))];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" /> Upphandlingar
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {needs.length + active.length} pågående · {completed.length} avslutade
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Registrera behov
          </button>
        )}
      </div>

      {/* Create need form */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Registrera behov</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Titel *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="t.ex. Nytt städavtal" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Kategori</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{categoryLabels[cat]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Uppskattad kostnad (kr)</label>
              <input type="number" value={form.estimatedCost} onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Brådskande</label>
              <select value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                <option value="PLANNED">Planerat</option>
                <option value="ACUTE">Akut</option>
                <option value="EXPLORATORY">Utredande</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Beskrivning</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Beskriv behovet..." className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Kopplat till (valfritt)</label>
            <input type="text" value={form.triggerTitle} onChange={(e) => setForm((f) => ({ ...f, triggerTitle: e.target.value }))}
              placeholder="t.ex. Avtal CleanTeam löper ut 2026-12-31" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate({
              title: form.title, description: form.description || undefined,
              category: form.category as never, urgency: form.urgency as never,
              estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
              triggerTitle: form.triggerTitle || undefined,
            })} disabled={createMutation.isPending || !form.title}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Registrera
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
          </div>
          {createMutation.error && <p className="text-sm text-red-600">{createMutation.error.message}</p>}
        </div>
      )}

      {/* Status filter */}
      {procurements.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setStatusFilter(null)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !statusFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
            Alla ({procurements.length})
          </button>
          {statuses.map((s) => {
            const count = procurements.filter((p) => p.status === s).length;
            return (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                {statusLabels[s] ?? s} ({count})
              </button>
            );
          })}
        </div>
      )}

      {procurements.length === 0 && !showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga upphandlingar</h3>
          <p className="mt-1 text-sm text-gray-500">Registrera ett behov för att komma igång.</p>
        </div>
      )}

      <div className="flex gap-4 min-h-[500px]">
        {/* List */}
        <div className={cn("space-y-2", selected ? "w-2/5 shrink-0" : "w-full")}>
          {needs.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-amber-600 uppercase flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Behov — inväntar styrelsebeslut ({needs.length})
              </h2>
              {needs.map((p) => (
                <ProcCard key={p.id} proc={p} isSelected={selectedId === p.id} compact={!!selected}
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} />
              ))}
            </>
          )}
          {active.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-gray-500 uppercase mt-4">Pågående ({active.length})</h2>
              {active.map((p) => (
                <ProcCard key={p.id} proc={p} isSelected={selectedId === p.id} compact={!!selected}
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} />
              ))}
            </>
          )}
          {completed.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-gray-500 uppercase mt-4">Avslutade ({completed.length})</h2>
              {completed.map((p) => (
                <ProcCard key={p.id} proc={p} isSelected={selectedId === p.id} compact={!!selected}
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} />
              ))}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="flex-1 rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col">
            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{selected.title}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[selected.status])}>
                    {statusLabels[selected.status]}
                  </span>
                  {selected.triggerTitle && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> {selected.triggerTitle}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Summary */}
              <div className="px-5 py-3 grid grid-cols-3 gap-3 border-b border-gray-50">
                <div>
                  <p className="text-xs text-gray-500">Estimerad kostnad</p>
                  <p className="text-sm font-medium text-gray-900">
                    {dec(selected.estimatedCost) ? `${dec(selected.estimatedCost)!.toLocaleString("sv-SE")} kr` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Offerter</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.quotes.filter((q) => q.status === "RECEIVED" || q.status === "SELECTED").length} / {selected.quotes.length} mottagna
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Skapad av</p>
                  <p className="text-sm text-gray-900">
                    {selected.createdBy.firstName} {selected.createdBy.lastName}
                  </p>
                </div>
              </div>

              {selected.description && (
                <div className="px-5 py-3 border-b border-gray-50">
                  <p className="text-sm text-gray-700">{selected.description}</p>
                </div>
              )}

              {/* Quotes */}
              {selected.quotes.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-50">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Offerter ({selected.quotes.length})</h3>
                  {selected.quotes.filter((q) => q.amount != null).length >= 2 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500 border-b border-gray-100">
                            <th className="text-left py-2 font-medium">Leverantör</th>
                            <th className="text-right py-2 font-medium">Belopp</th>
                            <th className="text-center py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.quotes.map((q) => {
                            const amt = dec(q.amount);
                            const allAmounts = selected.quotes.map((qq) => dec(qq.amount)).filter((a): a is number => a !== null);
                            const isLowest = amt !== null && amt === Math.min(...allAmounts);
                            return (
                              <tr key={q.id} className="border-b border-gray-50">
                                <td className="py-2 font-medium text-gray-900">{q.companyName}</td>
                                <td className="py-2 text-right">
                                  {amt !== null ? (
                                    <span className={cn(isLowest && "text-green-600 font-medium")}>
                                      {amt.toLocaleString("sv-SE")} kr{isLowest && " ★"}
                                    </span>
                                  ) : <span className="text-gray-400">Inväntar</span>}
                                </td>
                                <td className="py-2 text-center">
                                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                                    q.status === "SELECTED" ? "bg-green-100 text-green-700" :
                                    q.status === "RECEIVED" ? "bg-blue-100 text-blue-700" :
                                    "bg-gray-100 text-gray-500"
                                  )}>
                                    {q.status === "SELECTED" ? "Vald" : q.status === "RECEIVED" ? "Mottagen" : "Inväntar"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selected.quotes.map((q) => (
                        <div key={q.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium text-gray-900">{q.companyName}</span>
                          <div className="flex items-center gap-2">
                            {dec(q.amount) !== null
                              ? <span className="text-sm text-gray-900">{dec(q.amount)!.toLocaleString("sv-SE")} kr</span>
                              : <span className="text-xs text-gray-400">Inväntar</span>}
                            {q.status === "SELECTED" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Process steps */}
              {!["NEED", "NEED_DEFERRED", "REJECTED"].includes(selected.status) && (
                <div className="px-5 py-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Process</h3>
                  <div className="space-y-1">
                    {[
                      { step: "APPROVED", label: "Godkänd av styrelsen" },
                      { step: "RFQ_SENT", label: "Offertförfrågan skickad" },
                      { step: "COLLECTING_QUOTES", label: "Offerter insamlade" },
                      { step: "EVALUATION", label: "Jämförelse" },
                      { step: "DECISION_PENDING", label: "Styrelsebeslut" },
                      { step: "ORDERED", label: "Beställd" },
                      { step: "IN_PROGRESS", label: "Utförande" },
                      { step: "COMPLETED", label: "Slutförd" },
                    ].map(({ step, label }) => {
                      const stepOrder = ["APPROVED", "SPECIFICATION", "RFQ_SENT", "COLLECTING_QUOTES", "EVALUATION", "DECISION_PENDING", "ORDERED", "IN_PROGRESS", "COMPLETED"];
                      const currentIdx = stepOrder.indexOf(selected.status);
                      const stepIdx = stepOrder.indexOf(step);
                      const isDone = stepIdx < currentIdx;
                      const isCurrent = stepIdx === currentIdx;
                      return (
                        <div key={step} className="flex items-center gap-2">
                          {isDone ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            : isCurrent ? <div className="h-4 w-4 rounded-full border-2 border-blue-600 bg-blue-100 shrink-0" />
                            : <div className="h-4 w-4 rounded-full border-2 border-gray-200 shrink-0" />}
                          <span className={cn("text-sm", isDone ? "text-gray-500" : isCurrent ? "text-blue-700 font-medium" : "text-gray-400")}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {["NEED", "NEED_DEFERRED"].includes(selected.status) && (
                <div className="px-5 py-3">
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                    <p className="text-sm text-gray-700">
                      {selected.status === "NEED"
                        ? "Behovet är registrerat och väntar på behandling vid nästa styrelsemöte."
                        : "Styrelsen avvaktade. Tas upp igen vid kommande möte."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProcCard({ proc: p, isSelected, compact, onClick }: {
  proc: ProcRow; isSelected: boolean; compact: boolean; onClick: () => void;
}) {
  const receivedCount = (p.quotes ?? []).filter((q: { status: string }) => q.status === "RECEIVED" || q.status === "SELECTED").length;
  const cost = dec(p.estimatedCost);

  return (
    <button onClick={onClick}
      className={cn("w-full text-left rounded-lg border bg-white p-4 hover:bg-gray-50 transition-colors",
        isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{p.title}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[p.status])}>
              {statusLabels[p.status]}
            </span>
          </div>
          {!compact && (
            <>
              {p.triggerTitle && (
                <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> {p.triggerTitle}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                {cost && <span>~{cost.toLocaleString("sv-SE")} kr</span>}
                {p.quotes.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {receivedCount}/{p.quotes.length} offerter
                  </span>
                )}
                {p.owner && <span>{p.owner.firstName} {p.owner.lastName}</span>}
              </div>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {formatDistanceToNow(new Date(p.createdAt), { locale: sv, addSuffix: true })}
        </span>
      </div>
    </button>
  );
}
