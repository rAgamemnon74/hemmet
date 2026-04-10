"use client";

import Link from "next/link";
import { ClipboardCheck, CheckCircle, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type Report = {
  id: string;
  fiscalYear: string;
  title: string;
  status: string;
  audit: {
    id: string;
    status: string;
    recommendation: string | null;
  } | null;
};

const auditStatusLabels: Record<string, string> = {
  PENDING: "Väntar på granskning",
  IN_PROGRESS: "Granskning pågår",
  COMPLETED: "Revisionsberättelse klar",
};

const auditStatusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export function AuditList({ reports }: { reports: Report[] }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Årsrevision</h1>
        <p className="mt-1 text-sm text-gray-500">
          Granska årsberättelser och lämna revisionsberättelse
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga revisionsuppdrag</h3>
          <p className="mt-2 text-sm text-gray-500">
            Det finns inga årsberättelser att granska just nu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/revision/${report.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Räkenskapsår {report.fiscalYear}
                  </p>
                </div>
                {report.audit && (
                  <div className="flex items-center gap-2">
                    {report.audit.status === "COMPLETED" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : report.audit.status === "IN_PROGRESS" ? (
                      <Clock className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        auditStatusColors[report.audit.status]
                      )}
                    >
                      {auditStatusLabels[report.audit.status]}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
