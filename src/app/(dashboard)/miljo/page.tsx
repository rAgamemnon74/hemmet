"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Leaf, ClipboardCheck, FlaskConical, Recycle, AlertTriangle,
  Loader2, Plus, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const severityColor = { critical: "text-red-600 bg-red-50", warning: "text-amber-600 bg-amber-50", info: "text-blue-600 bg-blue-50" };
const severityLabel = { critical: "Kritisk", warning: "Varning", info: "Info" };

export default function MiljoPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "environment:manage");

  const overviewQuery = trpc.environment.overview.useQuery();
  const gapQuery = trpc.environment.environmentGapAnalysis.useQuery();

  const overview = overviewQuery.data;
  const gap = gapQuery.data;

  if (overviewQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Leaf className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Miljö</h1>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Link href="/miljo/egenkontroll" className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50">
              <Plus className="h-4 w-4" /> Egenkontroll
            </Link>
            <Link href="/miljo/incidenter" className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50">
              <Plus className="h-4 w-4" /> Rapportera incident
            </Link>
          </div>
        )}
      </div>

      {/* Sammanfattningskort */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={ClipboardCheck}
          label="Egenkontroll"
          value={overview?.activeEgenkontroll ? overview.activeEgenkontroll.title : "Saknas"}
          status={overview?.activeEgenkontroll ? "ok" : "error"}
          href="/miljo/egenkontroll"
        />
        <SummaryCard
          icon={FlaskConical}
          label="Kemikalier"
          value={`${overview?.chemicalCount ?? 0} registrerade`}
          status="neutral"
          href="/miljo/kemikalier"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Incidenter"
          value={overview?.openIncidents ? `${overview.openIncidents} öppna` : "Inga"}
          status={overview?.openIncidents ? "warning" : "ok"}
          href="/miljo/incidenter"
        />
        <SummaryCard
          icon={Recycle}
          label="Avfallsplan"
          value={overview?.wastePlan ? overview.wastePlan.title : "Saknas"}
          status={overview?.wastePlan ? "ok" : "neutral"}
          href="/miljo/avfall"
        />
      </div>

      {/* Gapanalys */}
      {gap && gap.gaps.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-4">
            Miljö-gapanalys
            {gap.summary.criticalCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {gap.summary.criticalCount} kritiska
              </span>
            )}
            {gap.summary.warningCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {gap.summary.warningCount} varningar
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {gap.gaps.map((g) => (
              <div key={g.key} className="flex items-start gap-3 rounded-md border border-gray-100 p-3">
                <span className={cn("mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium", severityColor[g.severity])}>
                  {severityLabel[g.severity]}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{g.title}</p>
                  <p className="text-xs text-gray-500">{g.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gap && gap.gaps.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50/50 p-5 text-center">
          <Leaf className="mx-auto h-8 w-8 text-green-500 mb-2" />
          <p className="text-sm text-green-700 font-medium">Inga identifierade miljöbrister</p>
          <p className="text-xs text-green-600/60 mt-1">Egenkontroll, kemikalier och inspektioner ser bra ut</p>
        </div>
      )}

      {/* Snabblänkar */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Miljöarbete</h2>
        <div className="space-y-1">
          <QuickLink href="/miljo/egenkontroll" label="Egenkontrollprogram" description="Ansvarsfördelning, rutiner, riskbedömning (förordning 1998:901)" />
          <QuickLink href="/miljo/risker" label="Riskbedömningar" description="Identifierade miljö- och hälsorisker" />
          <QuickLink href="/miljo/kemikalier" label="Kemikalieförteckning" description="Register över kemiska produkter i gemensamma utrymmen" />
          <QuickLink href="/miljo/avfall" label="Avfallsplan" description="Sortering, hämtning och farligt avfall" />
          <QuickLink href="/miljo/incidenter" label="Incidenter" description="Driftstörningar och rapporter till myndigheter" />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, status, href }: {
  icon: typeof Leaf; label: string; value: string; status: "ok" | "warning" | "error" | "neutral"; href: string;
}) {
  const statusStyles = {
    ok: "border-green-200 bg-green-50/30",
    warning: "border-amber-200 bg-amber-50/30",
    error: "border-red-200 bg-red-50/30",
    neutral: "border-gray-200 bg-white",
  };
  return (
    <Link href={href} className={cn("rounded-lg border p-4 hover:shadow-sm transition-shadow", statusStyles[status])}>
      <Icon className="h-5 w-5 text-gray-400 mb-2" />
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
    </Link>
  );
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-gray-50 -mx-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </Link>
  );
}
