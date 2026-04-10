"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, AnnualReportStatus, AuditStatus, AuditRecommendation } from "@prisma/client";

type ReportData = {
  id: string;
  fiscalYear: string;
  title: string;
  boardMembers: string;
  activities: string;
  maintenance: string | null;
  economy: string | null;
  futureOutlook: string | null;
  status: AnnualReportStatus;
  audit: {
    id: string;
    auditorId: string;
    status: AuditStatus;
    statement: string | null;
    recommendation: AuditRecommendation | null;
    findings: string | null;
    financialReview: string | null;
    boardReview: string | null;
  } | null;
};

type Auditor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

const statusLabels: Record<AnnualReportStatus, string> = {
  DRAFT: "Utkast",
  REVIEW: "Hos revisor",
  REVISED: "Granskad",
  APPROVED: "Godkänd",
  PUBLISHED: "Publicerad",
};

const statusColors: Record<AnnualReportStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  REVIEW: "bg-amber-100 text-amber-700",
  REVISED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
};

const recommendationLabels: Record<AuditRecommendation, string> = {
  APPROVE: "Tillstyrker ansvarsfrihet",
  APPROVE_WITH_REMARKS: "Tillstyrker med anmärkningar",
  DENY: "Avstyrker ansvarsfrihet",
};

const recommendationColors: Record<AuditRecommendation, string> = {
  APPROVE: "bg-green-50 text-green-800",
  APPROVE_WITH_REMARKS: "bg-amber-50 text-amber-800",
  DENY: "bg-red-50 text-red-800",
};

export function AnnualReportDetail({
  report,
  auditors,
}: {
  report: ReportData;
  auditors: Auditor[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canEdit = hasPermission(userRoles, "annual_report:edit");

  const [selectedAuditor, setSelectedAuditor] = useState(auditors[0]?.id ?? "");

  const sendToAudit = trpc.annualReport.sendToAudit.useMutation({
    onSuccess: () => router.refresh(),
  });
  const updateReport = trpc.annualReport.update.useMutation({
    onSuccess: () => router.refresh(),
  });

  const sections = [
    { title: "Styrelsens sammansättning", content: report.boardMembers },
    { title: "Verksamhetsberättelse", content: report.activities },
    { title: "Underhåll och förvaltning", content: report.maintenance },
    { title: "Ekonomisk översikt", content: report.economy },
    { title: "Framtida planer", content: report.futureOutlook },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/styrelse/arsberattelse"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Räkenskapsår {report.fiscalYear}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                statusColors[report.status]
              )}
            >
              {statusLabels[report.status]}
            </span>
          </div>
        </div>

        {/* Content sections */}
        {sections.map(
          (section) =>
            section.content && (
              <div
                key={section.title}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  {section.title}
                </h2>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {section.content}
                </div>
              </div>
            )
        )}

        {/* Audit result */}
        {report.audit?.status === "COMPLETED" && report.audit.recommendation && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Revisionsberättelse
            </h2>
            <div
              className={cn(
                "rounded-md p-3 mb-4",
                recommendationColors[report.audit.recommendation]
              )}
            >
              <p className="text-sm font-medium">
                {recommendationLabels[report.audit.recommendation]}
              </p>
            </div>
            {report.audit.statement && (
              <div className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                {report.audit.statement}
              </div>
            )}
            {report.audit.findings && (
              <div className="mt-3 rounded-md bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800">Anmärkningar:</p>
                <p className="mt-1 text-sm text-amber-700 whitespace-pre-wrap">
                  {report.audit.findings}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {canEdit && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            {report.status === "DRAFT" && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Skicka till revision
                </h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-500">Välj revisor</label>
                    <select
                      value={selectedAuditor}
                      onChange={(e) => setSelectedAuditor(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {auditors.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.firstName} {a.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() =>
                      sendToAudit.mutate({
                        id: report.id,
                        auditorId: selectedAuditor,
                      })
                    }
                    disabled={!selectedAuditor || sendToAudit.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {sendToAudit.isPending ? "Skickar..." : "Skicka till revisor"}
                  </button>
                </div>
              </div>
            )}

            {report.status === "REVISED" && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateReport.mutate({ id: report.id, status: "APPROVED" })
                  }
                  disabled={updateReport.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Godkänn
                </button>
                <button
                  onClick={() =>
                    updateReport.mutate({ id: report.id, status: "PUBLISHED" })
                  }
                  disabled={updateReport.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Publicera
                </button>
              </div>
            )}

            {report.status === "APPROVED" && (
              <button
                onClick={() =>
                  updateReport.mutate({ id: report.id, status: "PUBLISHED" })
                }
                disabled={updateReport.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Publicera till medlemmar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
