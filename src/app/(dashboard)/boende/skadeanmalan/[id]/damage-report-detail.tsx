"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, Send, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission, isBoardMember } from "@/lib/permissions";
import type { Role, ReportStatus, Severity } from "@prisma/client";

type ReportData = {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: Severity;
  status: ReportStatus;
  resolution: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  reporter: { id: string; firstName: string; lastName: string; email: string };
  apartment: { number: string; building: { name: string } } | null;
  comments: Array<{
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    author: { id: string; firstName: string; lastName: string };
  }>;
  photos: Array<{ id: string; fileName: string; fileUrl: string }>;
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
  LOW: "text-gray-500",
  NORMAL: "text-blue-600",
  HIGH: "text-amber-600",
  CRITICAL: "text-red-600",
};

export function DamageReportDetail({ report }: { report: ReportData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "report:manage");
  const isBoard = isBoardMember(userRoles);

  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [resolution, setResolution] = useState("");

  const updateStatus = trpc.damageReport.updateStatus.useMutation({
    onSuccess: () => router.refresh(),
  });
  const addComment = trpc.damageReport.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      router.refresh();
    },
  });

  function handleStatusChange(status: ReportStatus) {
    updateStatus.mutate({
      id: report.id,
      status,
      resolution: status === "RESOLVED" ? resolution : undefined,
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/boende/skadeanmalan"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till felanmälningar
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  statusColors[report.status]
                )}
              >
                {statusLabels[report.status]}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {report.description}
            </p>

            {report.resolution && (
              <div className="mt-4 rounded-md bg-green-50 p-3">
                <p className="text-sm font-medium text-green-800">Åtgärd:</p>
                <p className="mt-1 text-sm text-green-700">{report.resolution}</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Kommentarer ({report.comments.length})
            </h2>

            {report.comments.length > 0 && (
              <div className="space-y-4 mb-4">
                {report.comments.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex gap-3 rounded-md p-3",
                      c.isInternal ? "bg-amber-50 border border-amber-200" : ""
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {c.author.firstName[0]}
                      {c.author.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {c.author.firstName} {c.author.lastName}
                        </span>
                        {c.isInternal && (
                          <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                            <Lock className="h-3 w-3" />
                            Intern
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {format(new Date(c.createdAt), "d MMM HH:mm", {
                            locale: sv,
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) {
                  addComment.mutate({
                    damageReportId: report.id,
                    content: comment,
                    isInternal,
                  });
                }
              }}
              className="space-y-2"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Skriv en kommentar..."
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!comment.trim() || addComment.isPending}
                  className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {isBoard && (
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Lock className="h-3 w-3" />
                  Intern kommentar (bara synlig för styrelsen)
                </label>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Plats</p>
              <p className="text-sm text-gray-900">{report.location}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Allvarlighetsgrad</p>
              <p className={cn("text-sm font-medium", severityColors[report.severity])}>
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                {severityLabels[report.severity]}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Anmäld av</p>
              <p className="text-sm text-gray-900">
                {report.reporter.firstName} {report.reporter.lastName}
              </p>
              <p className="text-xs text-gray-500">{report.reporter.email}</p>
            </div>

            {report.apartment && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Lägenhet</p>
                <p className="text-sm text-gray-900">
                  {report.apartment.building.name}, lgh {report.apartment.number}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Anmäld</p>
              <p className="text-sm text-gray-700">
                {format(new Date(report.createdAt), "d MMMM yyyy HH:mm", {
                  locale: sv,
                })}
              </p>
            </div>

            {report.resolvedAt && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Åtgärdad</p>
                <p className="text-sm text-gray-700">
                  {format(new Date(report.resolvedAt), "d MMMM yyyy", {
                    locale: sv,
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Status management for board */}
          {canManage && !["RESOLVED", "CLOSED"].includes(report.status) && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Ändra status</p>
              <div className="space-y-2">
                {report.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleStatusChange("ACKNOWLEDGED")}
                    disabled={updateStatus.isPending}
                    className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Bekräfta mottagande
                  </button>
                )}
                {(report.status === "SUBMITTED" || report.status === "ACKNOWLEDGED") && (
                  <button
                    onClick={() => handleStatusChange("IN_PROGRESS")}
                    disabled={updateStatus.isPending}
                    className="w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    Markera pågående
                  </button>
                )}
                {report.status !== "RESOLVED" && (
                  <div className="space-y-2">
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Beskriv åtgärden..."
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleStatusChange("RESOLVED")}
                      disabled={updateStatus.isPending}
                      className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Markera åtgärdad
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
