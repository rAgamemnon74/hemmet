"use client";

import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { sv } from "date-fns/locale";
import {
  FileText, AlertTriangle, CheckCircle, Clock, Plus, X,
  Shield, ChevronDown, ChevronRight, Bell, ArrowRight, Loader2, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const categoryLabels: Record<string, string> = {
  SERVICE: "Driftsavtal", INSURANCE: "Försäkring", FINANCIAL: "Finansiellt",
  MANAGEMENT: "Förvaltning", UTILITY: "Media/Bredband", PROJECT: "Projekt",
  CONSULTING: "Konsult", OTHER: "Övrigt",
};

const categoryColors: Record<string, string> = {
  SERVICE: "bg-blue-100 text-blue-700", INSURANCE: "bg-green-100 text-green-700",
  FINANCIAL: "bg-purple-100 text-purple-700", MANAGEMENT: "bg-indigo-100 text-indigo-700",
  UTILITY: "bg-teal-100 text-teal-700", PROJECT: "bg-orange-100 text-orange-700",
  CONSULTING: "bg-cyan-100 text-cyan-700", OTHER: "bg-gray-100 text-gray-600",
};

const mandateLabels: Record<string, string> = {
  DELEGATED: "Delegation", BOARD: "Styrelsebeslut", ANNUAL_MEETING: "Stämmobeslut",
};

const CATEGORIES = ["SERVICE", "INSURANCE", "FINANCIAL", "MANAGEMENT", "UTILITY", "PROJECT", "CONSULTING", "OTHER"] as const;
const now = new Date();

// Prisma Decimal → number
function dec(v: unknown): number | null {
  if (v == null) return null;
  return Number(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContractRow = any;

function getUrgency(c: ContractRow): { level: "critical" | "warning" | "info" | "ok"; label: string } {
  if (c.status === "EXPIRING") {
    const days = c.endDate ? differenceInDays(new Date(c.endDate), now) : 0;
    if (days < 0) return { level: "critical", label: "Utgått" };
    if (days < 30) return { level: "critical", label: `Löper ut om ${days} dagar` };
    return { level: "warning", label: `Löper ut ${format(new Date(c.endDate!), "d MMM", { locale: sv })}` };
  }
  if (c.noticeDeadline) {
    const days = differenceInDays(new Date(c.noticeDeadline), now);
    if (days < 0) return { level: "info", label: "Uppsägningstid passerad" };
    if (days < 30) return { level: "critical", label: `Uppsägning senast om ${days} dagar` };
    if (days < 90) return { level: "warning", label: `Uppsägning senast ${format(new Date(c.noticeDeadline), "d MMM", { locale: sv })}` };
    if (days < 180) return { level: "info", label: `Uppsägning ${format(new Date(c.noticeDeadline), "d MMM yyyy", { locale: sv })}` };
  }
  return { level: "ok", label: "" };
}

export default function ContractsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "SERVICE" as string, counterpartyName: "", counterpartyOrg: "",
    annualCost: "", startDate: "", endDate: "", autoRenewal: false,
    renewalPeriodMonths: "", noticePeriodMonths: "", mandateLevel: "BOARD" as string,
    decisionRef: "", isFrameworkAgreement: false, annualCeiling: "", notes: "",
  });

  const contractsQuery = trpc.contract.list.useQuery();
  const contractorsQuery = trpc.contractor.list.useQuery();
  const createMutation = trpc.contract.create.useMutation({
    onSuccess: () => { setShowForm(false); contractsQuery.refetch(); },
  });

  if (contractsQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const contracts = contractsQuery.data ?? [];
  const contractors = contractorsQuery.data ?? [];
  const filtered = categoryFilter ? contracts.filter((c) => c.category === categoryFilter) : contracts;

  const needsAction = filtered.filter((c) => {
    const u = getUrgency(c);
    return u.level === "critical" || u.level === "warning" || c.status === "EXPIRING" || c.status === "RENEWAL_PENDING";
  });
  const active = filtered.filter((c) => !needsAction.includes(c) && ["ACTIVE"].includes(c.status));
  const other = filtered.filter((c) => !needsAction.includes(c) && !active.includes(c));

  const categories = [...new Set(contracts.map((c) => c.category))];
  const totalAnnualCost = contracts.reduce((sum, c) => sum + (dec(c.annualCost) ?? 0), 0);

  // Call-off totals per contract
  function getCallOffTotal(c: ContractRow): number {
    return (c.callOffs ?? []).reduce((sum: number, co: { actualCost: unknown; estimatedCost: unknown }) => sum + (dec(co.actualCost) ?? dec(co.estimatedCost) ?? 0), 0);
  }

  function handleCreate() {
    createMutation.mutate({
      title: form.title,
      category: form.category as never,
      counterpartyName: form.counterpartyName,
      counterpartyOrg: form.counterpartyOrg || undefined,
      annualCost: form.annualCost ? parseFloat(form.annualCost) : undefined,
      startDate: new Date(form.startDate),
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      autoRenewal: form.autoRenewal,
      renewalPeriodMonths: form.renewalPeriodMonths ? parseInt(form.renewalPeriodMonths) : undefined,
      noticePeriodMonths: form.noticePeriodMonths ? parseInt(form.noticePeriodMonths) : undefined,
      mandateLevel: form.mandateLevel as never,
      decisionRef: form.decisionRef || undefined,
      isFrameworkAgreement: form.isFrameworkAgreement,
      annualCeiling: form.annualCeiling ? parseFloat(form.annualCeiling) : undefined,
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" /> Avtal
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {contracts.length} avtal{totalAnnualCost > 0 && ` · Total årskostnad: ${totalAnnualCost.toLocaleString("sv-SE")} kr`}
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nytt avtal
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Nytt avtal</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Titel *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="t.ex. Hisserviceavtal" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Kategori *</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{categoryLabels[cat]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Motpart *</label>
              {contractors.length > 0 ? (
                <select value={form.counterpartyName} onChange={(e) => {
                  const c = contractors.find((ct) => ct.name === e.target.value);
                  setForm((f) => ({ ...f, counterpartyName: e.target.value, counterpartyOrg: c?.orgNumber ?? "" }));
                }} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="">Välj eller skriv...</option>
                  {contractors.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              ) : (
                <input type="text" value={form.counterpartyName} onChange={(e) => setForm((f) => ({ ...f, counterpartyName: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Årskostnad (kr)</label>
              <input type="number" value={form.annualCost} onChange={(e) => setForm((f) => ({ ...f, annualCost: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Startdatum *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Slutdatum</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Uppsägningstid (mån)</label>
              <input type="number" value={form.noticePeriodMonths} onChange={(e) => setForm((f) => ({ ...f, noticePeriodMonths: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Beslutsnivå</label>
              <select value={form.mandateLevel} onChange={(e) => setForm((f) => ({ ...f, mandateLevel: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                <option value="DELEGATED">Delegation</option>
                <option value="BOARD">Styrelsebeslut</option>
                <option value="ANNUAL_MEETING">Stämmobeslut</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.autoRenewal} onChange={(e) => setForm((f) => ({ ...f, autoRenewal: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600" /> Auto-förlängning
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isFrameworkAgreement} onChange={(e) => setForm((f) => ({ ...f, isFrameworkAgreement: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600" /> Ramavtal
            </label>
          </div>
          {form.isFrameworkAgreement && (
            <div className="w-1/2">
              <label className="text-xs font-medium text-gray-500">Årstak (kr)</label>
              <input type="number" value={form.annualCeiling} onChange={(e) => setForm((f) => ({ ...f, annualCeiling: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-500">Beslut / referens</label>
            <input type="text" value={form.decisionRef} onChange={(e) => setForm((f) => ({ ...f, decisionRef: e.target.value }))}
              placeholder="t.ex. Styrelsemöte 2024-11-18, §9" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.title || !form.counterpartyName || !form.startDate}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Spara
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
          </div>
          {createMutation.error && <p className="text-sm text-red-600">{createMutation.error.message}</p>}
        </div>
      )}

      {/* Category filter */}
      {contracts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={() => setCategoryFilter(null)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !categoryFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
            Alla ({contracts.length})
          </button>
          {categories.map((cat) => {
            const count = contracts.filter((c) => c.category === cat).length;
            return (
              <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  categoryFilter === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                {categoryLabels[cat] ?? cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {contracts.length === 0 && !showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga avtal registrerade</h3>
          <p className="mt-1 text-sm text-gray-500">Registrera föreningens avtal för att bevaka uppsägningstider.</p>
        </div>
      )}

      {/* Needs action */}
      {needsAction.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
            <Bell className="h-3 w-3" /> Kräver åtgärd ({needsAction.length})
          </h2>
          <div className="space-y-2">
            {needsAction.map((c) => (
              <ContractCard key={c.id} contract={c} expanded={expandedId === c.id}
                callOffTotal={getCallOffTotal(c)}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />
            ))}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Aktiva avtal ({active.length})</h2>
          <div className="space-y-2">
            {active.map((c) => (
              <ContractCard key={c.id} contract={c} expanded={expandedId === c.id}
                callOffTotal={getCallOffTotal(c)}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Övriga ({other.length})</h2>
          <div className="space-y-2">
            {other.map((c) => (
              <ContractCard key={c.id} contract={c} expanded={expandedId === c.id}
                callOffTotal={getCallOffTotal(c)}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContractCard({ contract: c, expanded, callOffTotal, onToggle }: {
  contract: ContractRow; expanded: boolean; callOffTotal: number; onToggle: () => void;
}) {
  const urgency = getUrgency(c);
  const annualCost = dec(c.annualCost);
  const ceiling = dec(c.annualCeiling);

  return (
    <div className={cn(
      "rounded-lg border bg-white overflow-hidden transition-colors",
      urgency.level === "critical" ? "border-red-200" : urgency.level === "warning" ? "border-amber-200" : "border-gray-200"
    )}>
      <button onClick={onToggle} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{c.title}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[c.category] ?? categoryColors.OTHER)}>
                  {categoryLabels[c.category] ?? c.category}
                </span>
                {c.isFrameworkAgreement && (
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-600">Ramavtal</span>
                )}
                {c.pubAgreement && (
                  <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-xs text-green-600 flex items-center gap-0.5">
                    <Shield className="h-3 w-3" /> PUB
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {c.counterpartyName}
                {c.contractor && <span className="text-gray-400"> ({c.contractor.category})</span>}
                {annualCost !== null && <span className="ml-2 text-gray-400">{annualCost.toLocaleString("sv-SE")} kr/år</span>}
                {c.isFrameworkAgreement && ceiling && (
                  <span className="ml-2 text-gray-400">Årstak: {ceiling.toLocaleString("sv-SE")} kr</span>
                )}
              </p>
              {c.isFrameworkAgreement && ceiling && ceiling > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", (callOffTotal / ceiling) > 0.8 ? "bg-amber-500" : "bg-blue-500")}
                      style={{ width: `${Math.min(100, (callOffTotal / ceiling) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {callOffTotal.toLocaleString("sv-SE")} / {ceiling.toLocaleString("sv-SE")} kr
                    ({Math.round((callOffTotal / ceiling) * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {urgency.level !== "ok" && (
              <span className={cn("flex items-center gap-1 text-xs font-medium",
                urgency.level === "critical" ? "text-red-600" : urgency.level === "warning" ? "text-amber-600" : "text-gray-500"
              )}>
                {urgency.level === "critical" && <AlertTriangle className="h-3.5 w-3.5" />}
                {urgency.level === "warning" && <Clock className="h-3.5 w-3.5" />}
                {urgency.label}
              </span>
            )}
            {c.endDate && urgency.level === "ok" && (
              <span className="text-xs text-gray-400">t.o.m. {format(new Date(c.endDate), "yyyy-MM-dd")}</span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500">Period</p>
              <p className="text-gray-900">
                {format(new Date(c.startDate), "yyyy-MM-dd")} — {c.endDate ? format(new Date(c.endDate), "yyyy-MM-dd") : "Tillsvidare"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Årskostnad</p>
              <p className="text-gray-900">{annualCost !== null ? `${annualCost.toLocaleString("sv-SE")} kr` : "—"}</p>
            </div>
            {c.autoRenewal && c.renewalPeriodMonths && (
              <div>
                <p className="text-xs font-medium text-gray-500">Auto-förlängning</p>
                <p className="text-gray-900">{c.renewalPeriodMonths} månader</p>
              </div>
            )}
            {c.noticePeriodMonths && (
              <div>
                <p className="text-xs font-medium text-gray-500">Uppsägningstid</p>
                <p className="text-gray-900">
                  {c.noticePeriodMonths} månader
                  {c.noticeDeadline && (
                    <span className={cn("ml-1", urgency.level === "critical" ? "text-red-600 font-medium" : "text-gray-500")}>
                      (senast {format(new Date(c.noticeDeadline), "d MMM yyyy", { locale: sv })})
                    </span>
                  )}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500">Beslutsnivå</p>
              <p className="text-gray-900">{mandateLabels[c.mandateLevel]}</p>
            </div>
            {c.decisionRef && (
              <div>
                <p className="text-xs font-medium text-gray-500">Beslut</p>
                <p className="text-blue-600 text-sm">{c.decisionRef}</p>
              </div>
            )}
          </div>

          {c.isFrameworkAgreement && ceiling && ceiling > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Ramavtal — avrop</h4>
              <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-blue-700">Årstak: {ceiling.toLocaleString("sv-SE")} kr</span>
                  <span className="text-sm font-medium text-blue-700">
                    {callOffTotal.toLocaleString("sv-SE")} kr avropat ({c._count.callOffs} avrop)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", (callOffTotal / ceiling) > 0.8 ? "bg-amber-500" : "bg-blue-500")}
                    style={{ width: `${Math.min(100, (callOffTotal / ceiling) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-blue-600">
                  Kvar: {(ceiling - callOffTotal).toLocaleString("sv-SE")} kr
                  ({Math.round(((ceiling - callOffTotal) / ceiling) * 100)}% av tak)
                </p>
              </div>
            </div>
          )}

          {c.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500">Notering</p>
              <p className="text-sm text-gray-600 italic">{c.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
            {c.isFrameworkAgreement && c.status === "ACTIVE" && (
              <button className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                <Plus className="h-3 w-3" /> Nytt avrop
              </button>
            )}
            {(c.status === "RENEWAL_PENDING" || c.status === "EXPIRING" || urgency.level !== "ok") && (
              <>
                <button className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  <ArrowRight className="h-3 w-3" /> Starta upphandling
                </button>
                {c.autoRenewal && (
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    <CheckCircle className="h-3 w-3" /> Förnya
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
