"use client";

import Link from "next/link";
import { Wrench, AlertTriangle, CheckCircle, Info, ClipboardCheck, Building2, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const severityStyles = {
  critical: { bg: "bg-red-50 border-red-200", icon: "text-red-500", text: "text-red-800", label: "Akut" },
  warning: { bg: "bg-amber-50 border-amber-200", icon: "text-amber-500", text: "text-amber-800", label: "Varning" },
  info: { bg: "bg-blue-50 border-blue-200", icon: "text-blue-500", text: "text-blue-700", label: "Info" },
};

const typeLabels: Record<string, string> = {
  data: "Databrister", age: "Åldersvarningar", inspection: "Besiktningar", cost: "Kostnad",
};

export default function PropertyManagementPage() {
  const gapQuery = trpc.property.gapAnalysis.useQuery();
  const overdueQuery = trpc.property.getOverdueInspections.useQuery();
  const damageQuery = trpc.dashboard.propertyOverview.useQuery();

  if (gapQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const { gaps, summary } = gapQuery.data ?? { gaps: [], summary: { totalComponents: 0, criticalCount: 0, warningCount: 0, infoCount: 0, totalPlannedCost: 0, componentsPastLifespan: 0, componentsCriticalCondition: 0 } };
  const damage = damageQuery.data;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Building2 className="h-6 w-6 text-blue-600" /> Förvaltning
      </h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <SummaryCard icon={Wrench} label="Komponenter" value={String(summary.totalComponents)}
          href="/forvaltning/komponenter" color="blue" />
        <SummaryCard icon={AlertTriangle} label="Akuta brister" value={String(summary.criticalCount)}
          href="#gaps" color={summary.criticalCount > 0 ? "red" : "green"}
          detail={summary.criticalCount === 0 ? "Inga akuta" : undefined} />
        <SummaryCard icon={ClipboardCheck} label="Förfallna besiktningar" value={String(overdueQuery.data?.length ?? 0)}
          href="/forvaltning/besiktningar" color={(overdueQuery.data?.length ?? 0) > 0 ? "amber" : "green"} />
        {damage && (
          <SummaryCard icon={Wrench} label="Öppna felanmälningar" value={String(damage.openReports)}
            href="/boende/skadeanmalan" color={damage.criticalReports > 0 ? "red" : "amber"}
            detail={damage.criticalReports > 0 ? `${damage.criticalReports} kritiska` : undefined} />
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <QuickLink href="/forvaltning/komponenter" label="Komponentregister" description="K3-register och underhållsplan" />
        <QuickLink href="/forvaltning/besiktningar" label="Besiktningar" description="OVK, hiss, brand, energi" />
        <QuickLink href="/forvaltning/leverantorer" label="Leverantörer" description="Avtal och kontakter" />
        <QuickLink href="/boende/skadeanmalan" label="Felanmälningar" description="Inkomna ärenden" />
      </div>

      {/* Gap analysis */}
      <div id="gaps" className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Gap-analys — brister och varningar</h2>
        <p className="text-xs text-gray-500 mb-4">
          Automatisk analys baserad på komponentregistret och besiktningskalendern.
          {summary.totalComponents === 0 && " Registrera komponenter för att få en fullständig analys."}
        </p>

        {gaps.length === 0 ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm font-medium text-green-800">Inga identifierade brister</p>
            <p className="text-xs text-green-600 mt-1">Komponentregistret och besiktningar ser komplett ut.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Critical first */}
            {gaps.filter((g) => g.severity === "critical").length > 0 && (
              <GapGroup title="Kräver omedelbar handling" gaps={gaps.filter((g) => g.severity === "critical")} severity="critical" />
            )}
            {gaps.filter((g) => g.severity === "warning").length > 0 && (
              <GapGroup title="Bör åtgärdas" gaps={gaps.filter((g) => g.severity === "warning")} severity="warning" />
            )}
            {gaps.filter((g) => g.severity === "info").length > 0 && (
              <GapGroup title="Ofullständig data" gaps={gaps.filter((g) => g.severity === "info")} severity="info" />
            )}
          </div>
        )}

        {/* Cost summary */}
        {summary.totalPlannedCost > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-500">Total uppskattad underhållskostnad:</span>
              <span className="text-lg font-bold text-gray-900">~{summary.totalPlannedCost.toLocaleString("sv-SE")} kr</span>
            </div>
            <p className="text-xs text-gray-400">I {new Date().getFullYear()} års priser. {summary.componentsPastLifespan} komponent{summary.componentsPastLifespan !== 1 ? "er" : ""} har passerat beräknad livslängd.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, href, color, detail }: {
  icon: typeof Wrench; label: string; value: string; href: string;
  color: "blue" | "amber" | "red" | "green"; detail?: string;
}) {
  const bg: Record<string, string> = { blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", red: "bg-red-50 text-red-600", green: "bg-green-50 text-green-600" };
  return (
    <Link href={href} className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-lg p-2", bg[color])}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {detail && <p className="text-xs text-gray-400">{detail}</p>}
        </div>
      </div>
    </Link>
  );
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link href={href} className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </Link>
  );
}

function GapGroup({ title, gaps, severity }: {
  title: string;
  gaps: Array<{ type: string; severity: string; building: string; message: string }>;
  severity: "critical" | "warning" | "info";
}) {
  const style = severityStyles[severity];
  const SeverityIcon = severity === "critical" ? AlertTriangle : severity === "warning" ? AlertTriangle : Info;

  return (
    <div className={cn("rounded-lg border p-3", style.bg)}>
      <h3 className={cn("text-xs font-semibold uppercase mb-2", style.text)}>
        {title} ({gaps.length})
      </h3>
      <div className="space-y-1.5">
        {gaps.map((g, i) => (
          <div key={i} className="flex items-start gap-2">
            <SeverityIcon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", style.icon)} />
            <div>
              <span className="text-xs font-medium text-gray-700">{g.building}: </span>
              <span className="text-xs text-gray-600">{g.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
