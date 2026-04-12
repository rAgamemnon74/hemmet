"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Inbox, Receipt, ArrowRightLeft, Wrench, Lightbulb, FileText,
  Key, Hammer, ShieldAlert, Filter, Loader2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const typeIcons: Record<string, typeof Inbox> = {
  "Utlägg": Receipt,
  "Överlåtelse": ArrowRightLeft,
  "Felanmälan": Wrench,
  "Förslag": Lightbulb,
  "Motion": FileText,
  "Andrahand": Key,
  "Renovering": Hammer,
  "Störning": ShieldAlert,
};

const typeColors: Record<string, string> = {
  "Utlägg": "text-amber-600",
  "Överlåtelse": "text-purple-600",
  "Felanmälan": "text-red-600",
  "Förslag": "text-blue-600",
  "Motion": "text-indigo-600",
  "Andrahand": "text-teal-600",
  "Renovering": "text-orange-600",
  "Störning": "text-rose-600",
};

const statusLabels: Record<string, string> = {
  SUBMITTED: "Inskickad", UNDER_REVIEW: "Granskas", ACKNOWLEDGED: "Mottagen",
  IN_PROGRESS: "Pågår", INITIATED: "Nytt", MEMBERSHIP_REVIEW: "Prövning",
  APPROVED: "Godkänd", FINANCIAL_SETTLEMENT: "Ekonomisk reglering",
  RECEIVED: "Mottagen", TECHNICAL_REVIEW: "Teknisk bedömning", BOARD_REVIEW: "Styrelsebeslut",
  REPORTED: "Anmäld", FIRST_WARNING: "Tillsägelse", SECOND_WARNING: "Varning",
};

export default function CasesPage() {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const casesQuery = trpc.dashboard.allCases.useQuery();

  if (casesQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const allCases = casesQuery.data ?? [];
  const filtered = typeFilter ? allCases.filter((c) => c.caseType === typeFilter) : allCases;
  const types = [...new Set(allCases.map((c) => c.caseType))];

  const urgentCases = filtered.filter((c) => c.urgency >= 3);
  const actionCases = filtered.filter((c) => c.urgency >= 1 && c.urgency < 3);
  const infoCases = filtered.filter((c) => c.urgency < 1);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="h-6 w-6 text-blue-600" /> Ärenden
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {allCases.length} öppna ärenden
          </p>
        </div>
      </div>

      {/* Type filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setTypeFilter(null)}
          className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !typeFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
          Alla ({allCases.length})
        </button>
        {types.map((type) => {
          const count = allCases.filter((c) => c.caseType === type).length;
          return (
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
                typeFilter === type ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {type} ({count})
            </button>
          );
        })}
      </div>

      {allCases.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga öppna ärenden</h3>
          <p className="mt-1 text-sm text-gray-500">Allt är hanterat.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Urgent */}
          {urgentCases.length > 0 && (
            <CaseGroup title="Kräver omedelbar handling" cases={urgentCases} borderColor="border-red-200" bgColor="bg-red-50/30" />
          )}

          {/* Action needed */}
          {actionCases.length > 0 && (
            <CaseGroup title="Att hantera" cases={actionCases} borderColor="border-amber-200" bgColor="bg-white" />
          )}

          {/* Info */}
          {infoCases.length > 0 && (
            <CaseGroup title="Information" cases={infoCases} borderColor="border-gray-200" bgColor="bg-white" />
          )}
        </div>
      )}
    </div>
  );
}

function CaseGroup({ title, cases, borderColor, bgColor }: {
  title: string;
  cases: Array<{ id: string; caseType: string; title: string; status: string; urgency: number; href: string; createdAt: Date }>;
  borderColor: string;
  bgColor: string;
}) {
  return (
    <div className={cn("rounded-lg border p-4", borderColor, bgColor)}>
      <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">{title} ({cases.length})</h2>
      <div className="space-y-1">
        {cases.map((c) => {
          const Icon = typeIcons[c.caseType] ?? Inbox;
          const color = typeColors[c.caseType] ?? "text-gray-500";
          return (
            <Link key={`${c.caseType}-${c.id}`} href={c.href}
              className="flex items-center justify-between rounded px-3 py-2 hover:bg-white/80 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4 shrink-0", color)} />
                <div>
                  <span className="text-sm text-gray-900">{c.title}</span>
                  <span className="ml-2 text-xs text-gray-400">{c.caseType}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {format(new Date(c.createdAt), "d MMM", { locale: sv })}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {statusLabels[c.status] ?? c.status}
                </span>
                {c.urgency >= 3 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
