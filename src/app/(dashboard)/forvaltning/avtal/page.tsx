"use client";

import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { sv } from "date-fns/locale";
import {
  FileText, AlertTriangle, CheckCircle, Clock, Plus, X,
  Building2, Shield, ExternalLink, ChevronDown, ChevronRight,
  Bell, Calendar, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Mock data — ersätts med tRPC i fas 1
// ============================================================

type MockContract = {
  id: string;
  title: string;
  category: string;
  status: string;
  counterpartyName: string;
  counterpartyOrg?: string;
  annualCost: number | null;
  startDate: Date;
  endDate: Date | null;
  autoRenewal: boolean;
  renewalPeriodMonths?: number;
  noticePeriodMonths?: number;
  noticeDeadline: Date | null;
  mandateLevel: string;
  decisionRef?: string;
  pubAgreement: boolean;
  documentUrl?: string;
};

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

const now = new Date();

const MOCK_CONTRACTS: MockContract[] = [
  {
    id: "c1", title: "Hisservice", category: "SERVICE", status: "RENEWAL_PENDING",
    counterpartyName: "KONE AB", counterpartyOrg: "556XXX-0001",
    annualCost: 84000, startDate: new Date("2024-01-01"), endDate: new Date("2026-12-31"),
    autoRenewal: true, renewalPeriodMonths: 24, noticePeriodMonths: 9,
    noticeDeadline: new Date("2026-03-31"),
    mandateLevel: "BOARD", decisionRef: "Styrelsemöte 2023-11-20, §12",
    pubAgreement: false,
  },
  {
    id: "c2", title: "Städning trapphus", category: "SERVICE", status: "ACTIVE",
    counterpartyName: "CleanTeam AB", counterpartyOrg: "556XXX-0002",
    annualCost: 148000, startDate: new Date("2025-01-01"), endDate: new Date("2026-12-31"),
    autoRenewal: false, noticePeriodMonths: 3,
    noticeDeadline: new Date("2026-09-30"),
    mandateLevel: "BOARD", decisionRef: "Styrelsemöte 2024-10-15, §8",
    pubAgreement: true,
  },
  {
    id: "c3", title: "Trädgårdsskötsel", category: "SERVICE", status: "ACTIVE",
    counterpartyName: "Grönyta AB",
    annualCost: 72000, startDate: new Date("2025-04-01"), endDate: new Date("2027-10-31"),
    autoRenewal: true, renewalPeriodMonths: 12, noticePeriodMonths: 3,
    noticeDeadline: new Date("2027-07-31"),
    mandateLevel: "BOARD",
    pubAgreement: false,
  },
  {
    id: "c4", title: "Snöröjning", category: "SERVICE", status: "ACTIVE",
    counterpartyName: "NordSnö AB",
    annualCost: 45000, startDate: new Date("2025-11-01"), endDate: new Date("2027-04-30"),
    autoRenewal: true, renewalPeriodMonths: 12, noticePeriodMonths: 3,
    noticeDeadline: new Date("2027-01-31"),
    mandateLevel: "BOARD",
    pubAgreement: false,
  },
  {
    id: "c5", title: "Bredband", category: "UTILITY", status: "ACTIVE",
    counterpartyName: "Telia AB", counterpartyOrg: "556XXX-0005",
    annualCost: 336000, startDate: new Date("2023-10-01"), endDate: new Date("2026-09-30"),
    autoRenewal: true, renewalPeriodMonths: 12, noticePeriodMonths: 6,
    noticeDeadline: new Date("2026-03-31"),
    mandateLevel: "BOARD", decisionRef: "Styrelsemöte 2023-08-20, §5",
    pubAgreement: false,
  },
  {
    id: "c6", title: "Larm och bevakning", category: "SERVICE", status: "EXPIRING",
    counterpartyName: "Securitas AB", counterpartyOrg: "556XXX-0006",
    annualCost: 42000, startDate: new Date("2024-07-01"), endDate: new Date("2026-06-30"),
    autoRenewal: false,
    noticeDeadline: null,
    mandateLevel: "BOARD",
    pubAgreement: true,
  },
  {
    id: "c7", title: "Fastighetsförsäkring", category: "INSURANCE", status: "ACTIVE",
    counterpartyName: "Länsförsäkringar",
    annualCost: 185000, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"),
    autoRenewal: true, renewalPeriodMonths: 12, noticePeriodMonths: 1,
    noticeDeadline: new Date("2026-11-30"),
    mandateLevel: "BOARD",
    pubAgreement: false,
  },
  {
    id: "c8", title: "Styrelseförsäkring", category: "INSURANCE", status: "ACTIVE",
    counterpartyName: "Länsförsäkringar",
    annualCost: 12000, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"),
    autoRenewal: true, renewalPeriodMonths: 12, noticePeriodMonths: 1,
    noticeDeadline: new Date("2026-11-30"),
    mandateLevel: "BOARD",
    pubAgreement: false,
  },
  {
    id: "c9", title: "Fastighetslån (räntebindning)", category: "FINANCIAL", status: "ACTIVE",
    counterpartyName: "Handelsbanken",
    annualCost: null, startDate: new Date("2024-06-01"), endDate: new Date("2027-05-31"),
    autoRenewal: false, noticePeriodMonths: 3,
    noticeDeadline: new Date("2027-02-28"),
    mandateLevel: "ANNUAL_MEETING", decisionRef: "Stämma 2024-05-22",
    pubAgreement: false,
  },
  {
    id: "c10", title: "Ekonomisk förvaltning", category: "MANAGEMENT", status: "ACTIVE",
    counterpartyName: "Nabo AB", counterpartyOrg: "556XXX-0010",
    annualCost: 96000, startDate: new Date("2024-01-01"), endDate: new Date("2026-12-31"),
    autoRenewal: true, renewalPeriodMonths: 12, noticePeriodMonths: 6,
    noticeDeadline: new Date("2026-06-30"),
    mandateLevel: "BOARD",
    pubAgreement: true,
  },
  {
    id: "c11", title: "Fasadmålning Byggnad A", category: "PROJECT", status: "ACTIVE",
    counterpartyName: "Fasadspecialisten AB",
    annualCost: null, startDate: new Date("2026-08-01"), endDate: new Date("2026-10-31"),
    autoRenewal: false,
    noticeDeadline: null,
    mandateLevel: "ANNUAL_MEETING", decisionRef: "Stämma 2025-05-20",
    pubAgreement: false,
  },
];

// ============================================================
// Helpers
// ============================================================

function getUrgency(contract: MockContract): { level: "critical" | "warning" | "info" | "ok"; label: string } {
  if (contract.status === "EXPIRING") {
    const days = contract.endDate ? differenceInDays(contract.endDate, now) : 0;
    if (days < 0) return { level: "critical", label: "Utgått" };
    if (days < 30) return { level: "critical", label: `Löper ut om ${days} dagar` };
    return { level: "warning", label: `Löper ut ${format(contract.endDate!, "d MMM", { locale: sv })}` };
  }
  if (contract.noticeDeadline) {
    const days = differenceInDays(contract.noticeDeadline, now);
    if (days < 0) return { level: "info", label: "Uppsägningstid passerad — avtal förnyat" };
    if (days < 30) return { level: "critical", label: `Uppsägning senast om ${days} dagar` };
    if (days < 90) return { level: "warning", label: `Uppsägning senast ${format(contract.noticeDeadline, "d MMM", { locale: sv })}` };
    if (days < 180) return { level: "info", label: `Uppsägning ${format(contract.noticeDeadline, "d MMM yyyy", { locale: sv })}` };
  }
  return { level: "ok", label: "" };
}

function formatCost(cost: number | null): string {
  if (cost === null) return "—";
  return `${cost.toLocaleString("sv-SE")} kr/år`;
}

// ============================================================
// Components
// ============================================================

export default function ContractsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const contracts = MOCK_CONTRACTS;
  const filtered = categoryFilter ? contracts.filter((c) => c.category === categoryFilter) : contracts;

  // Group: needs action, active, other
  const needsAction = filtered.filter((c) => {
    const u = getUrgency(c);
    return u.level === "critical" || u.level === "warning" || c.status === "EXPIRING" || c.status === "RENEWAL_PENDING";
  });
  const active = filtered.filter((c) => !needsAction.includes(c) && ["ACTIVE", "RENEWED"].includes(c.status));
  const other = filtered.filter((c) => !needsAction.includes(c) && !active.includes(c));

  const categories = [...new Set(contracts.map((c) => c.category))];
  const totalAnnualCost = contracts.reduce((sum, c) => sum + (c.annualCost ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" /> Avtal
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {contracts.length} avtal · Total årskostnad: {totalAnnualCost.toLocaleString("sv-SE")} kr
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nytt avtal
        </button>
      </div>

      {/* Category filter */}
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

      {/* Needs action */}
      {needsAction.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
            <Bell className="h-3 w-3" /> Kräver åtgärd ({needsAction.length})
          </h2>
          <div className="space-y-2">
            {needsAction.map((c) => (
              <ContractCard key={c.id} contract={c} expanded={expandedId === c.id}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Aktiva avtal ({active.length})
          </h2>
          <div className="space-y-2">
            {active.map((c) => (
              <ContractCard key={c.id} contract={c} expanded={expandedId === c.id}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Other */}
      {other.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Övriga ({other.length})</h2>
          <div className="space-y-2">
            {other.map((c) => (
              <ContractCard key={c.id} contract={c} expanded={expandedId === c.id}
                onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContractCard({ contract: c, expanded, onToggle }: {
  contract: MockContract; expanded: boolean; onToggle: () => void;
}) {
  const urgency = getUrgency(c);

  return (
    <div className={cn(
      "rounded-lg border bg-white overflow-hidden transition-colors",
      urgency.level === "critical" ? "border-red-200" :
      urgency.level === "warning" ? "border-amber-200" : "border-gray-200"
    )}>
      <button onClick={onToggle} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{c.title}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[c.category])}>
                  {categoryLabels[c.category]}
                </span>
                {c.pubAgreement && (
                  <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-xs text-green-600 flex items-center gap-0.5">
                    <Shield className="h-3 w-3" /> PUB
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {c.counterpartyName}
                {c.annualCost !== null && <span className="ml-2 text-gray-400">{formatCost(c.annualCost)}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {urgency.level !== "ok" && (
              <span className={cn("flex items-center gap-1 text-xs font-medium",
                urgency.level === "critical" ? "text-red-600" :
                urgency.level === "warning" ? "text-amber-600" : "text-gray-500"
              )}>
                {urgency.level === "critical" && <AlertTriangle className="h-3.5 w-3.5" />}
                {urgency.level === "warning" && <Clock className="h-3.5 w-3.5" />}
                {urgency.label}
              </span>
            )}
            {c.endDate && urgency.level === "ok" && (
              <span className="text-xs text-gray-400">
                t.o.m. {format(c.endDate, "yyyy-MM-dd")}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500">Period</p>
              <p className="text-gray-900">
                {format(c.startDate, "yyyy-MM-dd")} — {c.endDate ? format(c.endDate, "yyyy-MM-dd") : "Tillsvidare"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Årskostnad</p>
              <p className="text-gray-900">{c.annualCost !== null ? `${c.annualCost.toLocaleString("sv-SE")} kr` : "—"}</p>
            </div>
            {c.autoRenewal && (
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
                      (senast {format(c.noticeDeadline, "d MMM yyyy", { locale: sv })})
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
            {c.counterpartyOrg && (
              <div>
                <p className="text-xs font-medium text-gray-500">Org.nr</p>
                <p className="text-gray-900">{c.counterpartyOrg}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
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
                <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  Säg upp
                </button>
              </>
            )}
            <button className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Redigera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
