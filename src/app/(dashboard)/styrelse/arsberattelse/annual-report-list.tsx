"use client";

import Link from "next/link";
import { Plus, ScrollText, CheckCircle, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, AnnualReportStatus } from "@prisma/client";

type AnnualReport = {
  id: string;
  fiscalYear: string;
  title: string;
  status: AnnualReportStatus;
  publishedAt: Date | null;
  audit: {
    id: string;
    status: string;
    recommendation: string | null;
    auditorId: string;
  } | null;
};

const statusLabels: Record<AnnualReportStatus, string> = {
  DRAFT: "Utkast",
  FINAL_UPLOADED: "Slutprodukt uppladdad",
  SIGNED: "Signerad",
  REVIEW: "Hos revisor",
  REVISED: "Granskad",
  APPROVED: "Godkänd",
  PUBLISHED: "Publicerad",
};

const statusColors: Record<AnnualReportStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  FINAL_UPLOADED: "bg-blue-100 text-blue-700",
  SIGNED: "bg-green-100 text-green-700",
  REVIEW: "bg-amber-100 text-amber-700",
  REVISED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
};

export function AnnualReportList({ initialData }: { initialData: AnnualReport[] }) {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canEdit = hasPermission(userRoles, "annual_report:edit");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Årsberättelse</h1>
          <p className="mt-1 text-sm text-gray-500">
            Verksamhetsberättelse och förvaltningsberättelse per räkenskapsår
          </p>
        </div>
        {canEdit && (
          <Link
            href="/styrelse/arsberattelse/ny"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Ny årsberättelse
          </Link>
        )}
      </div>

      {initialData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <ScrollText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga årsberättelser</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {initialData.map((report) => (
            <Link
              key={report.id}
              href={`/styrelse/arsberattelse/${report.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {report.title}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColors[report.status]
                      )}
                    >
                      {statusLabels[report.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Räkenskapsår {report.fiscalYear}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {report.audit && (
                    <span className="flex items-center gap-1">
                      {report.audit.status === "COMPLETED" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      ) : report.audit.status === "IN_PROGRESS" ? (
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-gray-400" />
                      )}
                      Revision: {report.audit.status === "COMPLETED" ? "Klar" : report.audit.status === "IN_PROGRESS" ? "Pågår" : "Väntar"}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
