"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const statusLabels: Record<string, string> = {
  REPORTED: "Rapporterad",
  INVESTIGATING: "Utreds",
  REPORTED_TO_AUTHORITY: "Anmäld till myndighet",
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

export default function IncidentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "environment:manage");

  const incidentQuery = trpc.environment.getIncident.useQuery({ id });
  const updateMutation = trpc.environment.updateIncident.useMutation({
    onSuccess: () => {
      incidentQuery.refetch();
      setAuthorityName("");
      setAuthorityReference("");
      setResolution("");
    },
  });

  const [authorityName, setAuthorityName] = useState("");
  const [authorityReference, setAuthorityReference] = useState("");
  const [resolution, setResolution] = useState("");

  if (incidentQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>;
  }

  if (incidentQuery.error) {
    return (
      <div className="mx-auto max-w-3xl text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-300" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Incidenten kunde inte hittas</h2>
        <Link href="/miljo/incidenter" className="mt-4 inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till incidenter
        </Link>
      </div>
    );
  }

  const incident = incidentQuery.data!;
  const status = incident.status as string;

  function handleStatusChange(newStatus: string, extra?: Record<string, unknown>) {
    updateMutation.mutate({
      id,
      status: newStatus as never,
      ...extra,
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/miljo/incidenter"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Tillbaka till incidenter
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{incident.title}</h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[status])}>
                {statusLabels[status] ?? status}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {incidentTypeLabels[incident.incidentType] ?? incident.incidentType}
              </span>
              {incident.location && (
                <span className="text-xs text-gray-500">{incident.location}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Tidslinje</h2>
        <div className="grid grid-cols-2 gap-4">
          <TimelineItem
            label="Inträffade"
            date={incident.occurredAt}
          />
          <TimelineItem
            label="Upptäckt"
            date={incident.discoveredAt}
          />
          <TimelineItem
            label="Anmäld till myndighet"
            date={incident.reportedToAuthorityAt}
          />
          <TimelineItem
            label="Avhjälpt"
            date={incident.resolvedAt}
          />
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 mb-4 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Beskrivning</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.description}</p>
        </div>

        {incident.immediateMeasures && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Omedelbara åtgärder</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.immediateMeasures}</p>
          </div>
        )}

        {incident.followUpMeasures && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Uppföljande åtgärder</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.followUpMeasures}</p>
          </div>
        )}

        {incident.resolution && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Avhjälpning</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.resolution}</p>
          </div>
        )}
      </div>

      {/* Authority reporting */}
      {(incident.authorityName || incident.authorityReference) && (
        <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-5 mb-4">
          <h2 className="text-xs font-semibold text-purple-600 uppercase mb-3">Myndighetsrapportering</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {incident.authorityName && (
              <div>
                <span className="text-xs text-gray-500">Myndighet</span>
                <p className="font-medium text-gray-900">{incident.authorityName}</p>
              </div>
            )}
            {incident.authorityReference && (
              <div>
                <span className="text-xs text-gray-500">Referensnummer</span>
                <p className="font-medium text-gray-900">{incident.authorityReference}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status change actions */}
      {canManage && status !== "CLOSED" && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Hantera incident</h2>

          {updateMutation.error && (
            <p className="text-sm text-red-600 mb-3">{updateMutation.error.message}</p>
          )}

          <div className="space-y-3">
            {/* REPORTED -> INVESTIGATING */}
            {status === "REPORTED" && (
              <button
                onClick={() => handleStatusChange("INVESTIGATING")}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Starta utredning
              </button>
            )}

            {/* INVESTIGATING -> REPORTED_TO_AUTHORITY */}
            {status === "INVESTIGATING" && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Anmäl till myndighet:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Myndighet</label>
                    <input
                      type="text"
                      value={authorityName}
                      onChange={(e) => setAuthorityName(e.target.value)}
                      placeholder="T.ex. Miljöförvaltningen"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Referensnummer</label>
                    <input
                      type="text"
                      value={authorityReference}
                      onChange={(e) => setAuthorityReference(e.target.value)}
                      placeholder="Ärendenummer"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleStatusChange("REPORTED_TO_AUTHORITY", {
                    authorityName: authorityName || undefined,
                    authorityReference: authorityReference || undefined,
                    reportedToAuthorityAt: new Date(),
                  })}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Markera som anmäld
                </button>
              </div>
            )}

            {/* any open -> RESOLVED */}
            {status !== "RESOLVED" && status !== "CLOSED" && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Markera som avhjälpt:</p>
                <div>
                  <label className="text-xs font-medium text-gray-500">Avhjälpning</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                    placeholder="Beskriv hur incidenten avhjälptes..."
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <button
                  onClick={() => handleStatusChange("RESOLVED", {
                    resolution: resolution || undefined,
                    resolvedAt: new Date(),
                  })}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Markera som avhjälpt
                </button>
              </div>
            )}

            {/* RESOLVED -> CLOSED */}
            {status === "RESOLVED" && (
              <button
                onClick={() => handleStatusChange("CLOSED")}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Stäng incident
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: Date | string | null | undefined }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      {date ? (
        <p className="text-sm font-medium text-gray-900">
          {format(new Date(date), "d MMM yyyy, HH:mm", { locale: sv })}
        </p>
      ) : (
        <p className="text-sm text-gray-400">--</p>
      )}
    </div>
  );
}
