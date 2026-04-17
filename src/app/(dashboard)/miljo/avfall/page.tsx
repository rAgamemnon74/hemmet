"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { Loader2, Recycle, ChevronDown, ChevronRight, Save } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Utkast",
  ACTIVE: "Aktiv",
  EXPIRED: "Utgangen",
};

type SectionKey =
  | "municipality"
  | "sortingStations"
  | "collectionSchedule"
  | "hazardousWasteRoutine"
  | "recyclingRoomLocation"
  | "recyclingRoomRules";

const SECTIONS: { key: SectionKey; label: string; placeholder: string }[] = [
  { key: "municipality", label: "Kommun", placeholder: "Vilken kommun tillhor foreningen?" },
  { key: "sortingStations", label: "Sorteringsstationer", placeholder: "Beskriv var och hur avfall sorteras..." },
  { key: "collectionSchedule", label: "Hamtningsschema", placeholder: "Nar hamtas olika typer av avfall?" },
  { key: "hazardousWasteRoutine", label: "Farligt avfall", placeholder: "Rutiner for hantering av farligt avfall..." },
  { key: "recyclingRoomLocation", label: "Atervinningsrum", placeholder: "Var ligger atervinningsrummet?" },
  { key: "recyclingRoomRules", label: "Regler for atervinningsrum", placeholder: "Regler och oppettider..." },
];

export default function AvfallPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "environment:manage");

  const utils = trpc.useUtils();
  const planQuery = trpc.environment.getWasteManagementPlan.useQuery();

  const createMutation = trpc.environment.createWasteManagementPlan.useMutation({
    onSuccess: () => utils.environment.getWasteManagementPlan.invalidate(),
  });
  const updateMutation = trpc.environment.updateWasteManagementPlan.useMutation({
    onSuccess: () => utils.environment.getWasteManagementPlan.invalidate(),
  });

  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set());
  const [editValues, setEditValues] = useState<Partial<Record<SectionKey, string>>>({});
  const [createTitle, setCreateTitle] = useState("");

  if (planQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  const plan = planQuery.data;

  function toggleSection(key: SectionKey) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // Initialize edit value from plan data
        if (plan && editValues[key] === undefined) {
          setEditValues((ev) => ({ ...ev, [key]: (plan[key] as string) ?? "" }));
        }
      }
      return next;
    });
  }

  function handleSaveSection(key: SectionKey) {
    if (!plan) return;
    updateMutation.mutate({
      id: plan.id,
      [key]: editValues[key] ?? "",
    });
  }

  function handleSaveAll() {
    if (!plan) return;
    const data: Record<string, string> = {};
    for (const section of SECTIONS) {
      if (editValues[section.key] !== undefined) {
        data[section.key] = editValues[section.key]!;
      }
    }
    if (Object.keys(data).length > 0) {
      updateMutation.mutate({ id: plan.id, ...data });
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ title: createTitle });
  }

  // Empty state — no plan exists
  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Recycle className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Avfallsplan</h1>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <Recycle className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-4">Ingen avfallsplan har skapats annu.</p>
          {canManage ? (
            <form onSubmit={handleCreate} className="inline-flex items-center gap-2">
              <input
                type="text"
                required
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Titel, t.ex. Avfallsplan 2026"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Skapa avfallsplan
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400">Kontakta miljoansvarig for att skapa en avfallsplan.</p>
          )}
          {createMutation.isError && (
            <p className="mt-2 text-sm text-red-600">{createMutation.error.message}</p>
          )}
        </div>
      </div>
    );
  }

  // Plan exists — show sections
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Recycle className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[plan.status] ?? STATUS_STYLES.DRAFT)}>
            {STATUS_LABELS[plan.status] ?? plan.status}
          </span>
        </div>
        {canManage && (
          <button
            onClick={handleSaveAll}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Spara alla andringar
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Giltig fran</p>
            <p className="font-medium text-gray-900">
              {plan.validFrom ? format(new Date(plan.validFrom), "d MMMM yyyy", { locale: sv }) : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Giltig till</p>
            <p className="font-medium text-gray-900">
              {plan.validUntil ? format(new Date(plan.validUntil), "d MMMM yyyy", { locale: sv }) : "Tillsvidare"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Nasta granskning</p>
            <p className="font-medium text-gray-900">
              {plan.nextAuditDate ? format(new Date(plan.nextAuditDate), "d MMMM yyyy", { locale: sv }) : "Ej planerad"}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible sections */}
      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.key);
          const currentValue = (plan[section.key] as string) ?? "";
          const editValue = editValues[section.key] ?? currentValue;

          return (
            <div key={section.key} className="rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => toggleSection(section.key)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{section.label}</h3>
                  {currentValue ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Ifylld</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Tom</span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {canManage ? (
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        value={editValue}
                        onChange={(e) => setEditValues({ ...editValues, [section.key]: e.target.value })}
                        placeholder={section.placeholder}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
                      />
                      <button
                        onClick={() => handleSaveSection(section.key)}
                        disabled={updateMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Spara
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {currentValue || <span className="text-gray-400 italic">Inget innehall annu</span>}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {updateMutation.isError && (
        <p className="text-sm text-red-600">{updateMutation.error.message}</p>
      )}
    </div>
  );
}
