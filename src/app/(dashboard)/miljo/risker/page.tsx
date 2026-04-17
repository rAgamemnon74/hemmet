"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { Loader2, AlertTriangle, Plus, ChevronUp, Shield } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RiskItem {
  id: string;
  title: string;
  description: string;
  area: string | null;
  riskLevel: string;
  probability: number | null;
  consequence: number | null;
  existingMeasures: string | null;
  plannedMeasures: string | null;
  nextReviewDate: Date | string | null;
  resolvedAt: Date | string | null;
  createdAt: Date | string;
}

const RISK_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
type RiskLevel = (typeof RISK_LEVELS)[number];

const riskLevelStyle: Record<RiskLevel, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW: "bg-green-100 text-green-700 border-green-200",
};

const riskLevelLabel: Record<RiskLevel, string> = {
  CRITICAL: "Kritisk",
  HIGH: "Hog",
  MEDIUM: "Medel",
  LOW: "Lag",
};

const riskCardBorder: Record<RiskLevel, string> = {
  CRITICAL: "border-l-red-500",
  HIGH: "border-l-amber-500",
  MEDIUM: "border-l-yellow-500",
  LOW: "border-l-green-500",
};

const AREAS = [
  "Ventilation", "Avfall", "Kemikalier", "Radon", "Asbest", "PCB", "Ovrigt",
];

export default function RiskerPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "environment:manage");

  const [filterLevel, setFilterLevel] = useState<RiskLevel | "">("");
  const [filterArea, setFilterArea] = useState("");
  const [filterResolved, setFilterResolved] = useState<boolean | undefined>(false);
  const [showForm, setShowForm] = useState(false);

  const utils = trpc.useUtils();
  const risksQuery = trpc.environment.listRiskAssessments.useQuery({
    ...(filterLevel ? { riskLevel: filterLevel } : {}),
    ...(filterArea ? { area: filterArea } : {}),
    ...(filterResolved !== undefined ? { resolved: filterResolved } : {}),
  });

  const createMutation = trpc.environment.createRiskAssessment.useMutation({
    onSuccess: () => {
      utils.environment.listRiskAssessments.invalidate();
      setShowForm(false);
      resetForm();
    },
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    area: "",
    riskLevel: "MEDIUM" as RiskLevel,
    probability: 3,
    consequence: 3,
    existingMeasures: "",
    plannedMeasures: "",
  });

  function resetForm() {
    setForm({
      title: "", description: "", area: "", riskLevel: "MEDIUM",
      probability: 3, consequence: 3, existingMeasures: "", plannedMeasures: "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      title: form.title,
      description: form.description,
      area: form.area || undefined,
      riskLevel: form.riskLevel,
      probability: form.probability,
      consequence: form.consequence,
      existingMeasures: form.existingMeasures || undefined,
      plannedMeasures: form.plannedMeasures || undefined,
    });
  }

  if (risksQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  const risks = (risksQuery.data ?? []) as RiskItem[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Riskbedomningar</h1>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
          >
            {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Ny riskbedomning
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as RiskLevel | "")}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="">Alla riskniver</option>
          {RISK_LEVELS.map((level) => (
            <option key={level} value={level}>{riskLevelLabel[level]}</option>
          ))}
        </select>
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:ring-green-500"
        >
          <option value="">Alla omraden</option>
          {AREAS.map((area) => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
        <div className="flex rounded-md border border-gray-200 text-sm">
          <button
            onClick={() => setFilterResolved(false)}
            className={cn(
              "px-3 py-1.5 rounded-l-md",
              filterResolved === false ? "bg-green-50 text-green-700 font-medium" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            Oppna
          </button>
          <button
            onClick={() => setFilterResolved(true)}
            className={cn(
              "px-3 py-1.5 border-l border-gray-200",
              filterResolved === true ? "bg-gray-100 text-gray-700 font-medium" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            Atgardade
          </button>
          <button
            onClick={() => setFilterResolved(undefined)}
            className={cn(
              "px-3 py-1.5 rounded-r-md border-l border-gray-200",
              filterResolved === undefined ? "bg-gray-100 text-gray-700 font-medium" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            Alla
          </button>
        </div>
      </div>

      {/* Inline add form */}
      {showForm && canManage && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-green-200 bg-green-50/30 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Ny riskbedomning</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Titel *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Beskrivning *</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Omrade</label>
              <select
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">Valj omrade...</option>
                {AREAS.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Riskniva</label>
              <select
                value={form.riskLevel}
                onChange={(e) => setForm({ ...form, riskLevel: e.target.value as RiskLevel })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              >
                {RISK_LEVELS.map((level) => (
                  <option key={level} value={level}>{riskLevelLabel[level]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sannolikhet (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: parseInt(e.target.value) || 1 })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Konsekvens (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.consequence}
                onChange={(e) => setForm({ ...form, consequence: parseInt(e.target.value) || 1 })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Befintliga atgarder</label>
              <textarea
                rows={2}
                value={form.existingMeasures}
                onChange={(e) => setForm({ ...form, existingMeasures: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Planerade atgarder</label>
              <textarea
                rows={2}
                value={form.plannedMeasures}
                onChange={(e) => setForm({ ...form, plannedMeasures: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Spara
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-600">{createMutation.error.message}</p>
          )}
        </form>
      )}

      {/* Risk list */}
      {risks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <Shield className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Inga riskbedomningar hittades</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk) => {
            const level = risk.riskLevel as RiskLevel;
            return (
              <div
                key={risk.id}
                className={cn(
                  "rounded-lg border border-gray-200 border-l-4 bg-white p-4",
                  riskCardBorder[level]
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{risk.title}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", riskLevelStyle[level])}>
                        {riskLevelLabel[level]}
                      </span>
                      {risk.area && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {risk.area}
                        </span>
                      )}
                      {risk.resolvedAt && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Atgardad
                        </span>
                      )}
                    </div>
                    {(risk.probability || risk.consequence) && (
                      <p className="text-xs text-gray-500 mb-1">
                        Sannolikhet: {risk.probability ?? "-"} x Konsekvens: {risk.consequence ?? "-"}
                        {risk.probability && risk.consequence && (
                          <span className="ml-1 font-medium">= {risk.probability * risk.consequence}</span>
                        )}
                      </p>
                    )}
                    {risk.existingMeasures && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Befintliga atgarder:</span>{" "}
                        {risk.existingMeasures.length > 150
                          ? risk.existingMeasures.slice(0, 150) + "..."
                          : risk.existingMeasures}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {risk.nextReviewDate && (
                      <p className="text-xs text-gray-500">
                        Nasta granskning:{" "}
                        <span className={cn(
                          "font-medium",
                          new Date(risk.nextReviewDate) < new Date() ? "text-red-600" : "text-gray-700"
                        )}>
                          {format(new Date(risk.nextReviewDate), "d MMM yyyy", { locale: sv })}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Skapad {format(new Date(risk.createdAt), "d MMM yyyy", { locale: sv })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
