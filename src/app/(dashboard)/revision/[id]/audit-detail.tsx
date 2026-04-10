"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, AuditStatus, AuditRecommendation, AnnualReportStatus } from "@prisma/client";

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

export function AuditDetail({ report }: { report: ReportData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canPerform = hasPermission(userRoles, "audit:perform");
  const isAssigned = report.audit?.auditorId === session?.user?.id;
  const canAudit = canPerform && isAssigned;

  const audit = report.audit!;

  const [form, setForm] = useState({
    statement: audit.statement ?? "",
    recommendation: (audit.recommendation ?? "APPROVE") as AuditRecommendation,
    findings: audit.findings ?? "",
    financialReview: audit.financialReview ?? "",
    boardReview: audit.boardReview ?? "",
  });

  const startReview = trpc.audit.startReview.useMutation({
    onSuccess: () => router.refresh(),
  });
  const submitAudit = trpc.audit.submit.useMutation({
    onSuccess: () => router.refresh(),
  });

  const sections = [
    { title: "Styrelsens sammansättning", content: report.boardMembers },
    { title: "Verksamhetsberättelse", content: report.activities },
    { title: "Underhåll och förvaltning", content: report.maintenance },
    { title: "Ekonomisk översikt", content: report.economy },
    { title: "Framtida planer", content: report.futureOutlook },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitAudit.mutate({
      annualReportId: report.id,
      statement: form.statement,
      recommendation: form.recommendation,
      findings: form.findings || undefined,
      financialReview: form.financialReview || undefined,
      boardReview: form.boardReview || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/revision"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Revision: {report.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Räkenskapsår {report.fiscalYear}
        </p>
      </div>

      {/* Annual report content (read-only for auditor) */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Årsberättelse</h2>
        {sections.map(
          (section) =>
            section.content && (
              <div
                key={section.title}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            )
        )}
      </div>

      {/* Audit actions */}
      {canAudit && audit.status === "PENDING" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
          <p className="text-sm text-blue-700 mb-3">
            Klicka nedan för att påbörja granskningen.
          </p>
          <button
            onClick={() => startReview.mutate({ id: audit.id })}
            disabled={startReview.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {startReview.isPending ? "Startar..." : "Påbörja granskning"}
          </button>
        </div>
      )}

      {canAudit && audit.status === "IN_PROGRESS" && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Revisionsberättelse
          </h2>

          {submitAudit.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {submitAudit.error.message}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Granskning av räkenskaper
              </label>
              <textarea
                rows={4}
                value={form.financialReview}
                onChange={(e) => setForm((f) => ({ ...f, financialReview: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Revisorns kommentarer om räkenskaper och ekonomisk förvaltning..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Granskning av förvaltning
              </label>
              <textarea
                rows={4}
                value={form.boardReview}
                onChange={(e) => setForm((f) => ({ ...f, boardReview: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Revisorns kommentarer om styrelsens förvaltning..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Anmärkningar
              </label>
              <textarea
                rows={3}
                value={form.findings}
                onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Eventuella anmärkningar (lämna tomt om inga)..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Revisionsberättelse *
              </label>
              <textarea
                rows={6}
                required
                value={form.statement}
                onChange={(e) => setForm((f) => ({ ...f, statement: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Jag har granskat årsredovisningen och räkenskaperna samt styrelsens förvaltning..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rekommendation *
              </label>
              <select
                value={form.recommendation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    recommendation: e.target.value as AuditRecommendation,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="APPROVE">Tillstyrker ansvarsfrihet</option>
                <option value="APPROVE_WITH_REMARKS">
                  Tillstyrker ansvarsfrihet med anmärkningar
                </option>
                <option value="DENY">Avstyrker ansvarsfrihet</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!form.statement.trim() || submitAudit.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitAudit.isPending ? "Skickar..." : "Lämna revisionsberättelse"}
            </button>
          </div>
        </form>
      )}

      {/* Completed audit view */}
      {audit.status === "COMPLETED" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Revisionsberättelse (inlämnad)
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            {audit.financialReview && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Granskning av räkenskaper</h3>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{audit.financialReview}</p>
              </div>
            )}
            {audit.boardReview && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Granskning av förvaltning</h3>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{audit.boardReview}</p>
              </div>
            )}
            {audit.findings && (
              <div className="rounded-md bg-amber-50 p-3">
                <h3 className="text-sm font-semibold text-amber-800">Anmärkningar</h3>
                <p className="mt-1 text-sm text-amber-700 whitespace-pre-wrap">{audit.findings}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Revisionsberättelse</h3>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{audit.statement}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
