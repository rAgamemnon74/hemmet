"use client";

import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ClipboardCheck, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = {
  OVK: "OVK (ventilation)", ELEVATOR: "Hissbesiktning", FIRE_SAFETY: "Brandskydd (SBA)",
  ENERGY: "Energideklaration", RADON: "Radonmätning", PLAYGROUND: "Lekplatsbesiktning",
  CISTERN: "Cisternkontroll", COMPONENT: "Komponentbesiktning", OTHER: "Övrigt",
};
const resultColors: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700", APPROVED_WITH_REMARKS: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700", PENDING: "bg-gray-100 text-gray-500",
};
const resultLabels: Record<string, string> = {
  APPROVED: "Godkänd", APPROVED_WITH_REMARKS: "Godkänd med anmärkningar", FAILED: "Underkänd", PENDING: "Planerad",
};

export default function InspectionsPage() {
  const inspectionsQuery = trpc.property.listInspections.useQuery();
  const overdueQuery = trpc.property.getOverdueInspections.useQuery();

  if (inspectionsQuery.isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  const inspections = inspectionsQuery.data ?? [];
  const overdue = overdueQuery.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ClipboardCheck className="h-6 w-6 text-blue-600" /> Besiktningar
      </h1>

      {overdue.length > 0 && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> {overdue.length} förfallna besiktningar
          </p>
        </div>
      )}

      {inspections.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga besiktningar registrerade</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {inspections.map((insp) => {
            const isOverdue = insp.nextDueAt && new Date(insp.nextDueAt) < new Date();
            return (
              <div key={insp.id} className={cn("rounded-lg border bg-white p-4 flex items-center justify-between",
                isOverdue ? "border-red-200" : "border-gray-200")}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{typeLabels[insp.type] ?? insp.type}</p>
                  <p className="text-xs text-gray-500">{insp.building.name}{insp.component ? ` — ${insp.component.name}` : ""}</p>
                  {insp.inspector && <p className="text-xs text-gray-400">Besiktare: {insp.inspector}</p>}
                </div>
                <div className="flex items-center gap-3 text-right">
                  {insp.completedAt && (
                    <span className="text-xs text-gray-400">Genomförd {format(new Date(insp.completedAt), "d MMM yyyy", { locale: sv })}</span>
                  )}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", resultColors[insp.result])}>
                    {resultLabels[insp.result]}
                  </span>
                  {insp.nextDueAt && (
                    <span className={cn("text-xs", isOverdue ? "text-red-600 font-medium" : "text-gray-500")}>
                      {isOverdue && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                      Nästa: {format(new Date(insp.nextDueAt), "d MMM yyyy", { locale: sv })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
