"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft, ClipboardCheck, ChevronDown, ChevronRight, Save,
  Loader2, AlertTriangle, CheckCircle, Eye, Edit3, Shield,
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

// Valid status transitions
const statusTransitions: Record<EgenkontrollStatus, { target: EgenkontrollStatus; label: string }[]> = {
  DRAFT: [{ target: "ACTIVE", label: "Aktivera" }],
  ACTIVE: [{ target: "UNDER_REVIEW", label: "Skicka till granskning" }],
  UNDER_REVIEW: [
    { target: "ACTIVE", label: "Godkänn granskning" },
    { target: "ARCHIVED", label: "Arkivera" },
  ],
  ARCHIVED: [{ target: "DRAFT", label: "Återaktivera som utkast" }],
};

type SectionKey =
  | "responsibilities"
  | "operatingProcedures"
  | "riskAssessment"
  | "chemicalInventory"
  | "incidentProcedure";

const sections: { key: SectionKey; title: string; description: string; legalRef: string }[] = [
  {
    key: "responsibilities",
    title: "Ansvarsfördelning",
    description: "Vem ansvarar för vad i det systematiska miljöarbetet",
    legalRef: "\u00a74 F\u00f6rordning 1998:901",
  },
  {
    key: "operatingProcedures",
    title: "Driftrutiner",
    description: "Rutiner f\u00f6r drift och underh\u00e5ll av fastighetens installationer",
    legalRef: "\u00a75 F\u00f6rordning 1998:901",
  },
  {
    key: "riskAssessment",
    title: "Riskbed\u00f6mning",
    description: "Identifiering och bed\u00f6mning av milj\u00f6- och h\u00e4lsorisker",
    legalRef: "\u00a76 F\u00f6rordning 1998:901",
  },
  {
    key: "chemicalInventory",
    title: "Kemikalief\u00f6rteckning",
    description: "F\u00f6rteckning \u00f6ver kemiska produkter i fastigheten",
    legalRef: "\u00a77 F\u00f6rordning 1998:901",
  },
  {
    key: "incidentProcedure",
    title: "Incidentrutin",
    description: "Rutiner vid driftst\u00f6rningar och rapportering till myndigheter",
    legalRef: "Milj\u00f6balken 26 kap",
  },
];

export default function EgenkontrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "environment:manage");

  const egenkontrollQuery = trpc.environment.getEgenkontroll.useQuery({ id });
  const updateMutation = trpc.environment.updateEgenkontroll.useMutation({
    onSuccess: () => egenkontrollQuery.refetch(),
  });

  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    () => new Set<SectionKey>(["responsibilities"]),
  );
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [sectionDraft, setSectionDraft] = useState("");

  if (egenkontrollQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (egenkontrollQuery.error) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm text-red-600">
          Kunde inte h\u00e4mta egenkontrollprogrammet.
        </p>
        <Link
          href="/miljo/egenkontroll"
          className="mt-4 inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4" /> Tillbaka till \u00f6versikt
        </Link>
      </div>
    );
  }

  const ek = egenkontrollQuery.data;
  if (!ek) return null;

  const status = ek.status as EgenkontrollStatus;
  const transitions = canManage ? statusTransitions[status] ?? [] : [];

  function toggleSection(key: SectionKey) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        if (editingSection === key) setEditingSection(null);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function startEditing(key: SectionKey) {
    const currentValue = (ek as Record<string, unknown>)[key] as string ?? "";
    setSectionDraft(currentValue);
    setEditingSection(key);
  }

  function saveSection(key: SectionKey) {
    updateMutation.mutate(
      { id, [key]: sectionDraft },
      {
        onSuccess: () => setEditingSection(null),
      },
    );
  }

  function changeStatus(newStatus: EgenkontrollStatus) {
    updateMutation.mutate({ id, status: newStatus });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/miljo/egenkontroll"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Egenkontrollprogram
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ek.title}</h1>
              <div className="mt-1 flex items-center gap-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    statusColors[status],
                  )}
                >
                  {statusLabels[status]}
                </span>
                {ek.version && (
                  <span className="text-xs text-gray-500">
                    Version {ek.version}
                  </span>
                )}
                {ek.nextReviewDate && (
                  <span
                    className={cn(
                      "text-xs",
                      new Date(ek.nextReviewDate) < new Date()
                        ? "text-amber-600 font-medium"
                        : "text-gray-500",
                    )}
                  >
                    N\u00e4sta granskning:{" "}
                    {format(new Date(ek.nextReviewDate), "d MMMM yyyy", {
                      locale: sv,
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status transitions */}
          {transitions.length > 0 && (
            <div className="flex gap-2">
              {transitions.map((t) => (
                <button
                  key={t.target}
                  onClick={() => changeStatus(t.target)}
                  disabled={updateMutation.isPending}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                    t.target === "ACTIVE"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : t.target === "ARCHIVED"
                        ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "bg-amber-600 text-white hover:bg-amber-700",
                  )}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : t.target === "ACTIVE" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : t.target === "ARCHIVED" ? (
                    <Shield className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {updateMutation.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{updateMutation.error.message}</p>
        </div>
      )}

      {/* Permission notice */}
      {!canManage && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700">
            Du har l\u00e4sbeh\u00f6righet. Kontakta milj\u00f6ansvarig f\u00f6r att g\u00f6ra \u00e4ndringar.
          </p>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.key);
          const isEditing = editingSection === section.key;
          const content = (ek as Record<string, unknown>)[section.key] as string | null;
          const hasContent = content && content.trim().length > 0;

          return (
            <div
              key={section.key}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {section.title}
                        </span>
                        <span className="text-xs text-gray-400">
                          {section.legalRef}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  {!hasContent && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600 shrink-0">
                      Saknas
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={sectionDraft}
                        onChange={(e) => setSectionDraft(e.target.value)}
                        rows={8}
                        placeholder={`Beskriv ${section.title.toLowerCase()}...`}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveSection(section.key)}
                          disabled={updateMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Spara
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {hasContent ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Inget inneh\u00e5ll \u00e4nnu.
                        </p>
                      )}
                      {canManage && (
                        <button
                          onClick={() => startEditing(section.key)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          {hasContent ? "Redigera" : "L\u00e4gg till inneh\u00e5ll"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Linked risk assessments */}
      {ek.riskAssessments && ek.riskAssessments.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase">
              Kopplade riskbed\u00f6mningar ({ek.riskAssessments.length})
            </h2>
            <Link
              href="/miljo/risker"
              className="text-xs text-green-600 hover:text-green-800"
            >
              Visa alla risker
            </Link>
          </div>
          <div className="space-y-2">
            {ek.riskAssessments.map(
              (ra: {
                id: string;
                title: string;
                riskLevel: string;
                updatedAt: string | Date;
              }) => {
                const riskColors: Record<string, string> = {
                  LOW: "bg-green-100 text-green-700",
                  MEDIUM: "bg-amber-100 text-amber-700",
                  HIGH: "bg-red-100 text-red-700",
                };
                const riskLabels: Record<string, string> = {
                  LOW: "L\u00e5g",
                  MEDIUM: "Medel",
                  HIGH: "H\u00f6g",
                };

                return (
                  <Link
                    key={ra.id}
                    href={`/miljo/risker`}
                    className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2.5 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4",
                          ra.riskLevel === "HIGH"
                            ? "text-red-500"
                            : ra.riskLevel === "MEDIUM"
                              ? "text-amber-500"
                              : "text-green-500",
                        )}
                      />
                      <span className="text-sm text-gray-900">{ra.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          riskColors[ra.riskLevel] ?? "bg-gray-100 text-gray-600",
                        )}
                      >
                        {riskLabels[ra.riskLevel] ?? ra.riskLevel}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(ra.updatedAt), "d MMM yyyy", {
                          locale: sv,
                        })}
                      </span>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Link to risk assessments if none are linked */}
      {(!ek.riskAssessments || ek.riskAssessments.length === 0) && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            Inga riskbed\u00f6mningar kopplade till detta program.
          </p>
          <Link
            href="/miljo/risker"
            className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
          >
            G\u00e5 till riskbed\u00f6mningar <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
