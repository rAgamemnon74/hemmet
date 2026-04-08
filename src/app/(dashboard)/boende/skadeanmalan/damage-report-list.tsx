"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, AlertTriangle, Filter, MessageSquare, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportStatus, Severity } from "@prisma/client";

type DamageReport = {
  id: string;
  title: string;
  location: string;
  severity: Severity;
  status: ReportStatus;
  createdAt: Date;
  reporter: { id: string; firstName: string; lastName: string };
  apartment: { number: string; building: { name: string } } | null;
  _count: { comments: number; photos: number };
};

const statusLabels: Record<ReportStatus, string> = {
  SUBMITTED: "Inskickad",
  ACKNOWLEDGED: "Mottagen",
  IN_PROGRESS: "Pågår",
  RESOLVED: "Åtgärdad",
  CLOSED: "Stängd",
};

const statusColors: Record<ReportStatus, string> = {
  SUBMITTED: "bg-amber-100 text-amber-700",
  ACKNOWLEDGED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const severityLabels: Record<Severity, string> = {
  LOW: "Låg",
  NORMAL: "Normal",
  HIGH: "Hög",
  CRITICAL: "Kritisk",
};

const severityColors: Record<Severity, string> = {
  LOW: "text-gray-400",
  NORMAL: "text-blue-500",
  HIGH: "text-amber-500",
  CRITICAL: "text-red-500",
};

export function DamageReportList({ initialData }: { initialData: DamageReport[] }) {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ACTIVE" | "ALL">("ACTIVE");

  const filtered =
    statusFilter === "ALL"
      ? initialData
      : statusFilter === "ACTIVE"
      ? initialData.filter((r) => !["RESOLVED", "CLOSED"].includes(r.status))
      : initialData.filter((r) => r.status === statusFilter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Felanmälan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Anmäl skador och fel i fastigheten
          </p>
        </div>
        <Link
          href="/boende/skadeanmalan/ny"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Ny felanmälan
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        {(["ACTIVE", "SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "ALL"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s === "ACTIVE" ? "Aktiva" : s === "ALL" ? "Alla" : statusLabels[s]}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga felanmälningar</h3>
          <p className="mt-2 text-sm text-gray-500">
            Inga öppna felanmälningar just nu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <Link
              key={report.id}
              href={`/boende/skadeanmalan/${report.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle
                      className={cn("h-4 w-4", severityColors[report.severity])}
                    />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {report.title}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        statusColors[report.status]
                      )}
                    >
                      {statusLabels[report.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>{report.location}</span>
                    <span>
                      {report.reporter.firstName} {report.reporter.lastName}
                    </span>
                    {report.apartment && (
                      <span>
                        {report.apartment.building.name}, lgh {report.apartment.number}
                      </span>
                    )}
                    {report._count.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {report._count.comments}
                      </span>
                    )}
                    {report._count.photos > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {report._count.photos}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {format(new Date(report.createdAt), "d MMM yyyy", { locale: sv })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
