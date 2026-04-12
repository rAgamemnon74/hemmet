"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ShoppingCart, Plus, FileText, ArrowRight, Clock, CheckCircle,
  AlertTriangle, Users, Loader2, ChevronRight, Send, Package,
  Scale, Building2, Wrench, Link2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Mock data — ersätts med tRPC i fas 1
// ============================================================

type MockProcurement = {
  id: string;
  title: string;
  status: string;
  estimatedCost: number | null;
  actualCost: number | null;
  quotesDeadline: Date | null;
  createdAt: Date;
  createdBy: string;
  quotesReceived: number;
  quotesSent: number;
  selectedContractor: string | null;
  trigger?: { type: string; title: string };
  quotes: MockQuote[];
};

type MockQuote = {
  id: string;
  companyName: string;
  amount: number | null;
  receivedAt: Date | null;
  status: string;
  warrantyMonths: number | null;
  proposedStart: Date | null;
  proposedEnd: Date | null;
};

const statusLabels: Record<string, string> = {
  NEED: "Behov registrerat",
  NEED_DEFERRED: "Avvaktar",
  APPROVED: "Godkänd — ej påbörjad",
  SPECIFICATION: "Kravspec",
  RFQ_SENT: "Förfrågan skickad",
  COLLECTING_QUOTES: "Inväntar offerter",
  COMPARING: "Jämförelse",
  DECISION_PENDING: "Inväntar leverantörsval",
  ORDERED: "Beställd",
  IN_PROGRESS: "Pågår",
  COMPLETED: "Slutförd",
  CANCELLED: "Avbruten",
  REJECTED: "Avslagen",
};

const statusColors: Record<string, string> = {
  NEED: "bg-amber-100 text-amber-700",
  NEED_DEFERRED: "bg-gray-100 text-gray-600",
  APPROVED: "bg-blue-100 text-blue-700",
  SPECIFICATION: "bg-blue-100 text-blue-700",
  RFQ_SENT: "bg-blue-100 text-blue-700",
  COLLECTING_QUOTES: "bg-blue-100 text-blue-700",
  COMPARING: "bg-purple-100 text-purple-700",
  DECISION_PENDING: "bg-amber-100 text-amber-700",
  ORDERED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
  REJECTED: "bg-red-100 text-red-600",
};

const statusIcons: Record<string, typeof Clock> = {
  NEED: AlertTriangle,
  NEED_DEFERRED: Clock,
  APPROVED: CheckCircle,
  SPECIFICATION: FileText,
  RFQ_SENT: Send,
  COLLECTING_QUOTES: Clock,
  COMPARING: Scale,
  DECISION_PENDING: AlertTriangle,
  ORDERED: Package,
  IN_PROGRESS: Wrench,
  COMPLETED: CheckCircle,
};

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

const MOCK_PROCUREMENTS: MockProcurement[] = [
  {
    id: "uph-001", title: "Ommålning fasad Byggnad A", status: "COMPARING",
    estimatedCost: 300000, actualCost: null,
    quotesDeadline: daysAgo(-3), createdAt: daysAgo(21), createdBy: "Erik Larsson",
    quotesReceived: 2, quotesSent: 3,
    selectedContractor: null,
    trigger: { type: "Besiktning", title: "Fasadbesiktning 2025" },
    quotes: [
      { id: "q1", companyName: "Målare Andersson AB", amount: 285000, receivedAt: daysAgo(10),
        status: "RECEIVED", warrantyMonths: 60, proposedStart: new Date("2026-06-01"), proposedEnd: new Date("2026-08-15") },
      { id: "q2", companyName: "Fasadspecialisten AB", amount: 342000, receivedAt: daysAgo(6),
        status: "RECEIVED", warrantyMonths: 120, proposedStart: new Date("2026-08-01"), proposedEnd: new Date("2026-10-15") },
      { id: "q3", companyName: "Bygg & Färg AB", amount: null, receivedAt: null,
        status: "PENDING", warrantyMonths: null, proposedStart: null, proposedEnd: null },
    ],
  },
  {
    id: "uph-002", title: "Nytt städavtal 2027", status: "RFQ_SENT",
    estimatedCost: 150000, actualCost: null,
    quotesDeadline: new Date("2026-05-15"), createdAt: daysAgo(5), createdBy: "Erik Larsson",
    quotesReceived: 0, quotesSent: 4,
    selectedContractor: null,
    trigger: { type: "Avtal", title: "Städ CleanTeam löper ut 2026-12-31" },
    quotes: [
      { id: "q4", companyName: "CleanTeam AB", amount: null, receivedAt: null, status: "PENDING", warrantyMonths: null, proposedStart: null, proposedEnd: null },
      { id: "q5", companyName: "Städbolaget AB", amount: null, receivedAt: null, status: "PENDING", warrantyMonths: null, proposedStart: null, proposedEnd: null },
      { id: "q6", companyName: "Rent & Fint AB", amount: null, receivedAt: null, status: "PENDING", warrantyMonths: null, proposedStart: null, proposedEnd: null },
      { id: "q7", companyName: "ProClean AB", amount: null, receivedAt: null, status: "PENDING", warrantyMonths: null, proposedStart: null, proposedEnd: null },
    ],
  },
  {
    id: "uph-003", title: "Reparation vattenläcka källare B", status: "COMPLETED",
    estimatedCost: 20000, actualCost: 18750,
    quotesDeadline: null, createdAt: daysAgo(30), createdBy: "Erik Larsson",
    quotesReceived: 1, quotesSent: 1,
    selectedContractor: "Andersson VVS AB",
    trigger: { type: "Felanmälan", title: "#142 — Vattenläcka källare B" },
    quotes: [
      { id: "q8", companyName: "Andersson VVS AB", amount: 18750, receivedAt: daysAgo(28),
        status: "SELECTED", warrantyMonths: 12, proposedStart: daysAgo(25), proposedEnd: daysAgo(25) },
    ],
  },
  {
    id: "uph-004", title: "Larmuppgradering", status: "DECISION_PENDING",
    estimatedCost: 65000, actualCost: null,
    quotesDeadline: daysAgo(7), createdAt: daysAgo(35), createdBy: "Erik Larsson",
    quotesReceived: 2, quotesSent: 2,
    selectedContractor: null,
    trigger: { type: "Avtal", title: "Larm Securitas löper ut 2026-06-30" },
    quotes: [
      { id: "q9", companyName: "Securitas AB", amount: 58000, receivedAt: daysAgo(14),
        status: "RECEIVED", warrantyMonths: 24, proposedStart: new Date("2026-06-15"), proposedEnd: new Date("2026-06-20") },
      { id: "q10", companyName: "Verisure AB", amount: 72000, receivedAt: daysAgo(10),
        status: "RECEIVED", warrantyMonths: 36, proposedStart: new Date("2026-06-01"), proposedEnd: new Date("2026-06-10") },
    ],
  },
  // Behov — registrerade, inväntar styrelsebeslut
  {
    id: "uph-005", title: "OVK-besiktning 2026", status: "NEED",
    estimatedCost: 25000, actualCost: null,
    quotesDeadline: null, createdAt: daysAgo(2), createdBy: "Erik Larsson",
    quotesReceived: 0, quotesSent: 0,
    selectedContractor: null,
    trigger: { type: "Besiktning", title: "OVK förfaller 2026-09 (lagkrav)" },
    quotes: [],
  },
  {
    id: "uph-006", title: "Utvärdera bredbandsavtal", status: "NEED",
    estimatedCost: 336000, actualCost: null,
    quotesDeadline: null, createdAt: daysAgo(10), createdBy: "Sara Ek",
    quotesReceived: 0, quotesSent: 0,
    selectedContractor: null,
    trigger: { type: "Avtal", title: "Bredband Telia löper ut 2026-09-30" },
    quotes: [],
  },
  {
    id: "uph-007", title: "Bokföringssystem — byta från Excel", status: "NEED_DEFERRED",
    estimatedCost: 12000, actualCost: null,
    quotesDeadline: null, createdAt: daysAgo(45), createdBy: "Maria Kassör",
    quotesReceived: 0, quotesSent: 0,
    selectedContractor: null,
    trigger: undefined,
    quotes: [],
  },
  {
    id: "uph-008", title: "Ny trädgårdsentreprenör", status: "REJECTED",
    estimatedCost: 80000, actualCost: null,
    quotesDeadline: null, createdAt: daysAgo(60), createdBy: "Erik Larsson",
    quotesReceived: 0, quotesSent: 0,
    selectedContractor: null,
    trigger: undefined,
    quotes: [],
  },
];

// ============================================================
// Components
// ============================================================

export default function ProcurementPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const procurements = MOCK_PROCUREMENTS;
  const filtered = statusFilter ? procurements.filter((p) => p.status === statusFilter) : procurements;
  const selected = selectedId ? procurements.find((p) => p.id === selectedId) : null;

  // Group: needs → active → completed/rejected
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
            {active.length} pågående · {completed.length} avslutade
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Ny upphandling
        </button>
      </div>

      {/* Status filter */}
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
              {statusLabels[s]} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 min-h-[500px]">
        {/* List */}
        <div className={cn("space-y-2", selected ? "w-2/5 shrink-0" : "w-full")}>
          {/* Needs — awaiting board decision */}
          {needs.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-amber-600 uppercase flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Behov — inväntar styrelsebeslut ({needs.length})
              </h2>
              {needs.map((p) => (
                <ProcurementCard key={p.id} procurement={p}
                  isSelected={selectedId === p.id}
                  compact={!!selected}
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} />
              ))}
            </>
          )}

          {/* Active procurements */}
          {active.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-gray-500 uppercase mt-4">Pågående upphandlingar ({active.length})</h2>
              {active.map((p) => (
                <ProcurementCard key={p.id} procurement={p}
                  isSelected={selectedId === p.id}
                  compact={!!selected}
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} />
              ))}
            </>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-gray-500 uppercase mt-4">Avslutade ({completed.length})</h2>
              {completed.map((p) => (
                <ProcurementCard key={p.id} procurement={p}
                  isSelected={selectedId === p.id}
                  compact={!!selected}
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} />
              ))}
            </>
          )}

          {filtered.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Inga upphandlingar</h3>
            </div>
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
                  {selected.trigger && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> {selected.trigger.type}: {selected.trigger.title}
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
                    {selected.estimatedCost ? `${selected.estimatedCost.toLocaleString("sv-SE")} kr` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Offerter</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.quotesReceived} / {selected.quotesSent} mottagna
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.quotesDeadline
                      ? format(selected.quotesDeadline, "d MMM yyyy", { locale: sv })
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Quotes */}
              {selected.quotes.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-50">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Offerter ({selected.quotes.length})
                  </h3>

                  {/* Comparison table if multiple received */}
                  {selected.quotes.filter((q) => q.amount !== null).length >= 2 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500 border-b border-gray-100">
                            <th className="text-left py-2 font-medium">Leverantör</th>
                            <th className="text-right py-2 font-medium">Belopp</th>
                            <th className="text-right py-2 font-medium">Garanti</th>
                            <th className="text-center py-2 font-medium">Tidsplan</th>
                            <th className="text-center py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.quotes.map((q) => {
                            const isLowest = q.amount !== null && q.amount === Math.min(
                              ...selected.quotes.filter((qq) => qq.amount !== null).map((qq) => qq.amount!)
                            );
                            return (
                              <tr key={q.id} className="border-b border-gray-50">
                                <td className="py-2">
                                  <span className="font-medium text-gray-900">{q.companyName}</span>
                                </td>
                                <td className="py-2 text-right">
                                  {q.amount !== null ? (
                                    <span className={cn(isLowest && "text-green-600 font-medium")}>
                                      {q.amount.toLocaleString("sv-SE")} kr
                                      {isLowest && " ★"}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">Inväntar</span>
                                  )}
                                </td>
                                <td className="py-2 text-right text-gray-600">
                                  {q.warrantyMonths ? `${q.warrantyMonths / 12} år` : "—"}
                                </td>
                                <td className="py-2 text-center text-xs text-gray-500">
                                  {q.proposedStart && q.proposedEnd
                                    ? `${format(q.proposedStart, "MMM", { locale: sv })}–${format(q.proposedEnd, "MMM", { locale: sv })}`
                                    : "—"}
                                </td>
                                <td className="py-2 text-center">
                                  {q.status === "SELECTED" ? (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Vald</span>
                                  ) : q.status === "RECEIVED" ? (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Mottagen</span>
                                  ) : (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Inväntar</span>
                                  )}
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
                          <div>
                            <p className="text-sm font-medium text-gray-900">{q.companyName}</p>
                            {q.receivedAt && (
                              <p className="text-xs text-gray-400">
                                Mottagen {format(q.receivedAt, "d MMM", { locale: sv })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {q.amount !== null ? (
                              <span className="text-sm font-medium text-gray-900">
                                {q.amount.toLocaleString("sv-SE")} kr
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Inväntar</span>
                            )}
                            {q.status === "SELECTED" && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected contractor / result */}
              {selected.selectedContractor && (
                <div className="px-5 py-3 border-b border-gray-50">
                  <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Vald leverantör: <span className="font-medium">{selected.selectedContractor}</span>
                      {selected.actualCost && (
                        <span className="ml-2 text-green-600">
                          {selected.actualCost.toLocaleString("sv-SE")} kr
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Need info (for NEED/NEED_DEFERRED) */}
              {["NEED", "NEED_DEFERRED"].includes(selected.status) && (
                <div className="px-5 py-3 border-b border-gray-50">
                  <div className={cn(
                    "rounded-md border px-3 py-2",
                    selected.status === "NEED" ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
                  )}>
                    <p className="text-sm text-gray-700">
                      {selected.status === "NEED"
                        ? "Behovet är registrerat och väntar på behandling vid nästa styrelsemöte."
                        : "Styrelsen avvaktade med detta behov. Tas upp igen vid kommande möte."}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Registrerat av {selected.createdBy}, {format(selected.createdAt, "d MMM yyyy", { locale: sv })}
                    </p>
                  </div>
                </div>
              )}

              {/* Process steps (only for approved+) */}
              {!["NEED", "NEED_DEFERRED", "REJECTED"].includes(selected.status) && (
              <div className="px-5 py-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Process</h3>
                <div className="space-y-1">
                  {[
                    { step: "APPROVED", label: "Godkänd av styrelsen" },
                    { step: "RFQ_SENT", label: "Offertförfrågan skickad" },
                    { step: "COLLECTING_QUOTES", label: "Offerter insamlade" },
                    { step: "COMPARING", label: "Jämförelse" },
                    { step: "DECISION_PENDING", label: "Styrelsebeslut" },
                    { step: "ORDERED", label: "Beställd" },
                    { step: "IN_PROGRESS", label: "Utförande" },
                    { step: "COMPLETED", label: "Slutförd" },
                  ].map(({ step, label }) => {
                    const stepOrder = ["APPROVED", "RFQ_SENT", "COLLECTING_QUOTES", "COMPARING", "DECISION_PENDING", "ORDERED", "IN_PROGRESS", "COMPLETED"];
                    const currentIdx = stepOrder.indexOf(selected.status);
                    const stepIdx = stepOrder.indexOf(step);
                    const isDone = stepIdx < currentIdx;
                    const isCurrent = stepIdx === currentIdx;

                    return (
                      <div key={step} className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : isCurrent ? (
                          <div className="h-4 w-4 rounded-full border-2 border-blue-600 bg-blue-100 shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-200 shrink-0" />
                        )}
                        <span className={cn("text-sm",
                          isDone ? "text-gray-500" : isCurrent ? "text-blue-700 font-medium" : "text-gray-400"
                        )}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
              {["NEED", "NEED_DEFERRED"].includes(selected.status) && (
                <>
                  <button className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                    <CheckCircle className="h-3.5 w-3.5" /> Lägg på dagordning
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Redigera behov
                  </button>
                </>
              )}
              {selected.status === "APPROVED" && (
                <button className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                  <Send className="h-3.5 w-3.5" /> Skicka offertförfrågan
                </button>
              )}
              {selected.status === "COLLECTING_QUOTES" && (
                <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  <Clock className="h-3.5 w-3.5" /> Skicka påminnelse
                </button>
              )}
              {selected.status === "COMPARING" && (
                <>
                  <button className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                    <Scale className="h-3.5 w-3.5" /> Välj leverantör
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Exportera jämförelse (PDF)
                  </button>
                </>
              )}
              {selected.status === "DECISION_PENDING" && (
                <button className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                  <FileText className="h-3.5 w-3.5" /> Lägg till på dagordning
                </button>
              )}
              {selected.status === "ORDERED" && (
                <button className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                  <CheckCircle className="h-3.5 w-3.5" /> Godkänn utfört arbete
                </button>
              )}
              {selected.status === "COMPLETED" && (
                <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  <FileText className="h-3.5 w-3.5" /> Skapa avtal
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProcurementCard({ procurement: p, isSelected, compact, onClick }: {
  procurement: MockProcurement; isSelected: boolean; compact: boolean; onClick: () => void;
}) {
  const Icon = statusIcons[p.status] ?? Clock;
  const deadlinePassed = p.quotesDeadline && p.quotesDeadline < now;
  const allQuotesIn = p.quotesSent > 0 && p.quotesReceived === p.quotesSent;

  return (
    <button onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border bg-white p-4 hover:bg-gray-50 transition-colors",
        isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200"
      )}>
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
              {p.trigger && (
                <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> {p.trigger.type}: {p.trigger.title}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                {p.estimatedCost && (
                  <span>~{p.estimatedCost.toLocaleString("sv-SE")} kr</span>
                )}
                {p.quotesSent > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {p.quotesReceived}/{p.quotesSent} offerter
                    {allQuotesIn && <CheckCircle className="h-3 w-3 text-green-500" />}
                  </span>
                )}
                {p.selectedContractor && (
                  <span className="text-green-600 font-medium">{p.selectedContractor}</span>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(p.createdAt, { locale: sv, addSuffix: true })}
          </span>
          {p.quotesDeadline && !["COMPLETED", "CANCELLED", "ORDERED", "IN_PROGRESS"].includes(p.status) && (
            <span className={cn("text-xs", deadlinePassed ? "text-red-600" : "text-gray-400")}>
              {deadlinePassed ? "Deadline passerad" : `Deadline ${format(p.quotesDeadline, "d MMM", { locale: sv })}`}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
