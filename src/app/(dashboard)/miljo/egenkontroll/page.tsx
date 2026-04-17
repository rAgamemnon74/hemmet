"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ClipboardCheck, Plus, Loader2, ChevronRight, AlertTriangle,
  FileText, Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

type EgenkontrollStatus = "DRAFT" | "ACTIVE" | "UNDER_REVIEW" | "ARCHIVED";

const statusLabels: Record<EgenkontrollStatus, string> = {
  DRAFT: "Utkast",
  ACTIVE: "Aktiv",
  UNDER_REVIEW: "Under granskning",
  ARCHIVED: "Arkiverad",
};

const statusColors: Record<EgenkontrollStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

const statusIcons: Record<EgenkontrollStatus, typeof ClipboardCheck> = {
  DRAFT: FileText,
  ACTIVE: ClipboardCheck,
  UNDER_REVIEW: AlertTriangle,
  ARCHIVED: Archive,
};

export default function EgenkontrollListPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "environment:manage");

  const [statusFilter, setStatusFilter] = useState<EgenkontrollStatus | null>(null);

  const egenkontrollerQuery = trpc.environment.listEgenkontroller.useQuery();

  if (egenkontrollerQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  const allItems = egenkontrollerQuery.data ?? [];
  const items = statusFilter
    ? allItems.filter((e) => e.status === statusFilter)
    : allItems;

  const statusCounts = allItems.reduce(
    (acc, e) => {
      acc[e.status as EgenkontrollStatus] = (acc[e.status as EgenkontrollStatus] ?? 0) + 1;
      return acc;
    },
    {} as Record<EgenkontrollStatus, number>,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-6 w-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Egenkontrollprogram</h1>
            <p className="text-sm text-gray-500">
              Systematiskt miljöarbete enligt förordning 1998:901
            </p>
          </div>
        </div>
        {canManage && (
          <Link
            href="/miljo/egenkontroll/nytt"
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            <Plus className="h-4 w-4" /> Nytt program
          </Link>
        )}
      </div>

      {/* Status filter */}
      {allItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !statusFilter
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            Alla ({allItems.length})
          </button>
          {(["ACTIVE", "DRAFT", "UNDER_REVIEW", "ARCHIVED"] as EgenkontrollStatus[]).map(
            (status) =>
              (statusCounts[status] ?? 0) > 0 && (
                <button
                  key={status}
                  onClick={() =>
                    setStatusFilter(statusFilter === status ? null : status)
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    statusFilter === status
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {statusLabels[status]} ({statusCounts[status]})
                </button>
              ),
          )}
        </div>
      )}

      {/* List */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((ek) => {
            const status = ek.status as EgenkontrollStatus;
            const StatusIcon = statusIcons[status] ?? FileText;
            const isOverdue =
              ek.nextReviewDate && new Date(ek.nextReviewDate) < new Date();

            return (
              <Link
                key={ek.id}
                href={`/miljo/egenkontroll/${ek.id}`}
                className={cn(
                  "flex items-center justify-between rounded-lg border bg-white px-5 py-4 hover:shadow-sm transition-shadow",
                  isOverdue && status === "ACTIVE"
                    ? "border-amber-200"
                    : "border-gray-200",
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <StatusIcon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      status === "ACTIVE"
                        ? "text-green-500"
                        : status === "UNDER_REVIEW"
                          ? "text-amber-500"
                          : "text-gray-400",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {ek.title}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          statusColors[status],
                        )}
                      >
                        {statusLabels[status]}
                      </span>
                      {ek.version && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                          v{ek.version}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      {ek._count.riskAssessments != null && (
                        <span>
                          {ek._count.riskAssessments} riskbedömning{ek._count.riskAssessments !== 1 ? "ar" : ""}
                        </span>
                      )}
                      {ek.nextReviewDate && (
                        <span
                          className={cn(
                            isOverdue && "text-amber-600 font-medium",
                          )}
                        >
                          {isOverdue ? "F\u00f6rsenad granskning: " : "N\u00e4sta granskning: "}
                          {format(new Date(ek.nextReviewDate), "d MMM yyyy", {
                            locale: sv,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Inget egenkontrollprogram
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Skapa ett egenkontrollprogram f&ouml;r att uppfylla kraven i f&ouml;rordning 1998:901.
          </p>
          {canManage && (
            <Link
              href="/miljo/egenkontroll/nytt"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
            >
              <Plus className="h-4 w-4" /> Skapa egenkontrollprogram
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
