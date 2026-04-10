"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { UserPlus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@prisma/client";

type Application = {
  id: string;
  status: ApplicationStatus;
  firstName: string | null;
  lastName: string | null;
  email: string;
  ownershipShare: number;
  submittedAt: Date;
  apartment: {
    number: string;
    building: { name: string };
    ownerships: Array<{ ownershipShare: number; userId: string | null }>;
  };
};

const statusLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: "Inskickad",
  UNDER_REVIEW: "Under granskning",
  APPROVED: "Godkänd",
  REJECTED: "Avslagen",
  WITHDRAWN: "Återtagen",
};

const statusColors: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

export function ApplicationList({ initialData }: { initialData: Application[] }) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">("ALL");

  const filtered = statusFilter === "ALL"
    ? initialData
    : initialData.filter((a) => a.status === statusFilter);

  const pendingCount = initialData.filter((a) => ["SUBMITTED", "UNDER_REVIEW"].includes(a.status)).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medlemsansökningar</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pendingCount > 0
            ? `${pendingCount} ansökningar väntar på behandling`
            : "Inga väntande ansökningar"}
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        {(["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const).map((s) => (
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
            {s === "ALL" ? "Alla" : statusLabels[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <UserPlus className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga ansökningar</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const currentOwnership = app.apartment.ownerships.reduce(
              (s, o) => s + o.ownershipShare, 0
            );
            return (
              <Link
                key={app.id}
                href={`/medlem/ansokningar/${app.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {app.firstName} {app.lastName}
                      </h3>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[app.status])}>
                        {statusLabels[app.status]}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>{app.apartment.building.name}, lgh {app.apartment.number}</span>
                      <span>Begärd andel: {(app.ownershipShare * 100).toFixed(0)}%</span>
                      <span>Nuvarande ägande: {(currentOwnership * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {format(new Date(app.submittedAt), "d MMM yyyy", { locale: sv })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
