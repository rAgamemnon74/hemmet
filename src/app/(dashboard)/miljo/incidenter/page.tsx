"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { AlertTriangle, Plus, Loader2, Save, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const statusLabels: Record<string, string> = {
  REPORTED: "Rapporterad",
  INVESTIGATING: "Utreds",
  REPORTED_TO_AUTHORITY: "Anmäld",
  RESOLVED: "Avhjälpt",
  CLOSED: "Stängd",
};

const statusColors: Record<string, string> = {
  REPORTED: "bg-blue-100 text-blue-700",
  INVESTIGATING: "bg-amber-100 text-amber-700",
  REPORTED_TO_AUTHORITY: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const incidentTypeLabels: Record<string, string> = {
  WATER_DAMAGE: "Vattenskada",
  CHEMICAL_SPILL: "Kemikalieutsläpp",
  REFRIGERANT_LEAK: "Köldmedialäcka",
  RADON_EXCEEDANCE: "Radon över gränsvärde",
  ASBESTOS_EXPOSURE: "Asbestexponering",
  OTHER: "Övrigt",
};

const INCIDENT_TYPES = Object.entries(incidentTypeLabels);
const STATUSES = Object.entries(statusLabels);

export default function IncidenterPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "environment:manage");

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    incidentType: "WATER_DAMAGE",
    occurredAt: "",
    location: "",
    immediateMeasures: "",
  });

  const incidentsQuery = trpc.environment.listIncidents.useQuery(
    statusFilter ? { status: statusFilter } : undefined
  );
  const createMutation = trpc.environment.createIncident.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setForm({ title: "", description: "", incidentType: "WATER_DAMAGE", occurredAt: "", location: "", immediateMeasures: "" });
      incidentsQuery.refetch();
    },
  });

  if (incidentsQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>;
  }

  const incidents = incidentsQuery.data ?? [];

  function handleCreate() {
    createMutation.mutate({
      title: form.title,
      description: form.description,
      incidentType: form.incidentType,
      occurredAt: new Date(form.occurredAt),
      location: form.location || undefined,
      immediateMeasures: form.immediateMeasures || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-green-600" /> Incidenter
          </h1>
          <p className="mt-1 text-sm text-gray-500">{incidents.length} incidenter</p>
        </div>
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            <Plus className="h-4 w-4" /> Rapportera incident
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Rapportera incident</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500">Titel *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Typ *</label>
              <select
                value={form.incidentType}
                onChange={(e) => setForm((f) => ({ ...f, incidentType: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {INCIDENT_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Inträffade *</label>
              <input
                type="date"
                value={form.occurredAt}
                onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500">Plats</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="T.ex. Trapphus B, källare"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500">Beskrivning *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500">Omedelbara åtgärder</label>
              <textarea
                value={form.immediateMeasures}
                onChange={(e) => setForm((f) => ({ ...f, immediateMeasures: e.target.value }))}
                rows={2}
                placeholder="Vilka åtgärder vidtogs direkt?"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.title || !form.description || !form.occurredAt}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Spara
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4" /> Avbryt
            </button>
          </div>
          {createMutation.error && <p className="text-sm text-red-600">{createMutation.error.message}</p>}
        </div>
      )}

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !statusFilter ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Alla
        </button>
        {STATUSES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setStatusFilter(statusFilter === value ? null : value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === value ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {incidents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga incidenter</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter ? "Inga incidenter med vald status." : "Inga incidenter har rapporterats."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/miljo/incidenter/${incident.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{incident.title}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[incident.status])}>
                    {statusLabels[incident.status] ?? incident.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {incidentTypeLabels[incident.incidentType] ?? incident.incidentType}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                  <span>{format(new Date(incident.occurredAt), "d MMM yyyy", { locale: sv })}</span>
                  {incident.location && <span>{incident.location}</span>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
