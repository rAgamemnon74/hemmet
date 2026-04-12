"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, Send, CheckCircle, PenLine, Save, X, History, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc"
import { AttachmentSection } from "@/components/attachments";
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

type Auditor = { id: string; firstName: string; lastName: string; email: string };

const statusLabels: Record<AnnualReportStatus, string> = {
  DRAFT: "Utkast", FINAL_UPLOADED: "Slutprodukt uppladdad", SIGNED: "Signerad",
  REVIEW: "Hos revisor", REVISED: "Granskad", APPROVED: "Godkänd", PUBLISHED: "Publicerad",
};
const statusColors: Record<AnnualReportStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700", FINAL_UPLOADED: "bg-blue-100 text-blue-700", SIGNED: "bg-green-100 text-green-700",
  REVIEW: "bg-amber-100 text-amber-700", REVISED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700", PUBLISHED: "bg-emerald-100 text-emerald-700",
};
const recommendationLabels: Record<AuditRecommendation, string> = {
  APPROVE: "Tillstyrker ansvarsfrihet", APPROVE_WITH_REMARKS: "Tillstyrker med anmärkningar", DENY: "Avstyrker ansvarsfrihet",
};
const recommendationColors: Record<AuditRecommendation, string> = {
  APPROVE: "bg-green-50 text-green-800", APPROVE_WITH_REMARKS: "bg-amber-50 text-amber-800", DENY: "bg-red-50 text-red-800",
};

type SectionKey = "boardMembers" | "activities" | "maintenance" | "economy" | "futureOutlook";
const sectionDefs: Array<{ key: SectionKey; title: string }> = [
  { key: "boardMembers", title: "Styrelsens sammansättning" },
  { key: "activities", title: "Verksamhetsberättelse" },
  { key: "maintenance", title: "Underhåll och förvaltning" },
  { key: "economy", title: "Ekonomisk översikt" },
  { key: "futureOutlook", title: "Framtida planer" },
];

export function AnnualReportDetail({ report, auditors }: { report: ReportData; auditors: Auditor[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canEdit = hasPermission(userRoles, "annual_report:edit") && report.status === "DRAFT";

  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAuditor, setSelectedAuditor] = useState(auditors[0]?.id ?? "");

  const sendToAudit = trpc.annualReport.sendToAudit.useMutation({ onSuccess: () => router.refresh() });
  const updateReport = trpc.annualReport.update.useMutation({ onSuccess: () => { setEditingSection(null); router.refresh(); } });
  const historyQuery = trpc.annualReport.getHistory.useQuery({ id: report.id }, { enabled: showHistory });

  function startEditing(key: SectionKey) {
    setEditValue(report[key] ?? "");
    setEditingSection(key);
  }

  function saveSection() {
    if (!editingSection) return;
    updateReport.mutate({ id: report.id, [editingSection]: editValue });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/styrelse/arsberattelse" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Tillbaka
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
            <div className="flex items-center gap-2">
              <button onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                <History className="h-3 w-3" /> Ändringshistorik
              </button>
              <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusColors[report.status])}>
                {statusLabels[report.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Change history */}
        {showHistory && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" /> Ändringshistorik
            </h2>
            {historyQuery.isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            {historyQuery.data?.length === 0 && <p className="text-xs text-gray-400">Inga ändringar registrerade.</p>}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historyQuery.data?.map((entry) => (
                <div key={entry.id} className="border-l-2 border-gray-200 pl-3 py-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-gray-700">{entry.userName}</span>
                    <span className="text-xs text-gray-400">{format(new Date(entry.createdAt), "d MMM yyyy HH:mm", { locale: sv })}</span>
                  </div>
                  <p className="text-xs text-gray-600">{entry.description}</p>
                  {entry.before && entry.after && (() => {
                    const before = JSON.parse(entry.before) as Record<string, string>;
                    const after = JSON.parse(entry.after) as Record<string, string>;
                    return (
                      <div className="mt-1 space-y-1">
                        {Object.keys(after).map((key) => (
                          <div key={key} className="text-xs">
                            <span className="text-gray-400">{key}:</span>
                            {before[key] && (
                              <span className="ml-1 text-red-400 line-through">{String(before[key]).substring(0, 80)}{String(before[key]).length > 80 ? "..." : ""}</span>
                            )}
                            <span className="ml-1 text-green-600">{String(after[key]).substring(0, 80)}{String(after[key]).length > 80 ? "..." : ""}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content sections with inline editing */}
        {sectionDefs.map((section) => {
          const content = report[section.key];
          const isEditing = editingSection === section.key;

          return (
            <div key={section.key} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">{section.title}</h2>
                {canEdit && !isEditing && (
                  <button onClick={() => startEditing(section.key)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                    <PenLine className="h-3 w-3" /> Redigera
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea rows={8} value={editValue} onChange={(e) => setEditValue(e.target.value)}
                    className="w-full rounded-md border border-blue-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <div className="flex gap-2">
                    <button onClick={saveSection} disabled={updateReport.isPending}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                      <Save className="h-3 w-3" /> {updateReport.isPending ? "Sparar..." : "Spara"}
                    </button>
                    <button onClick={() => setEditingSection(null)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                      <X className="h-3 w-3" /> Avbryt
                    </button>
                  </div>
                  {updateReport.error && <p className="text-xs text-red-600">{updateReport.error.message}</p>}
                </div>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {content || <span className="text-gray-400 italic">Inte ifyllt ännu{canEdit ? " — klicka Redigera" : ""}</span>}
                </div>
              )}
            </div>
          );
        })}

        {/* Audit result */}
        {report.audit?.status === "COMPLETED" && report.audit.recommendation && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Revisionsberättelse
            </h2>
            <div className={cn("rounded-md p-3 mb-4", recommendationColors[report.audit.recommendation])}>
              <p className="text-sm font-medium">{recommendationLabels[report.audit.recommendation]}</p>
            </div>
            {report.audit.statement && <div className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{report.audit.statement}</div>}
            {report.audit.findings && (
              <div className="mt-3 rounded-md bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800">Anmärkningar:</p>
                <p className="mt-1 text-sm text-amber-700 whitespace-pre-wrap">{report.audit.findings}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {hasPermission(userRoles, "annual_report:edit") && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            {report.status === "DRAFT" && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Skicka till revision</h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-500">Välj revisor</label>
                    <select value={selectedAuditor} onChange={(e) => setSelectedAuditor(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      {auditors.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                    </select>
                  </div>
                  <button onClick={() => sendToAudit.mutate({ id: report.id, auditorId: selectedAuditor })}
                    disabled={!selectedAuditor || sendToAudit.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                    <Send className="h-4 w-4" /> {sendToAudit.isPending ? "Skickar..." : "Skicka till revisor"}
                  </button>
                </div>
              </div>
            )}

            {report.status === "REVISED" && (
              <div className="flex gap-2">
                <button onClick={() => updateReport.mutate({ id: report.id, status: "APPROVED" })} disabled={updateReport.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  <CheckCircle className="h-4 w-4" /> Godkänn
                </button>
                <button onClick={() => updateReport.mutate({ id: report.id, status: "PUBLISHED" })} disabled={updateReport.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  Publicera
                </button>
              </div>
            )}

            {report.status === "APPROVED" && (
              <button onClick={() => updateReport.mutate({ id: report.id, status: "PUBLISHED" })} disabled={updateReport.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                Publicera
              </button>
            )}
          </div>
        )}

        {/* Bilagor */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <AttachmentSection entityType="AnnualReport" entityId={report.id} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}
