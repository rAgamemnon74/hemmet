"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  FileText,
  Users,
  BookOpen,
  Play,
  CheckCircle,
  XCircle,
  UserCog,
  ClipboardList,
  UserCheck,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { AgendaTab } from "./tabs/agenda-tab";
import { AttendanceTab } from "./tabs/attendance-tab";
import { MeetingRolesTab } from "./tabs/meeting-roles-tab";
import { ProtocolTab } from "./tabs/protocol-tab";
import { DecisionsTab } from "./tabs/decisions-tab";
import { VoterRegistryTab } from "./tabs/voter-registry-tab";
import { ProxyTab } from "./tabs/proxy-tab";
import { MeetingLogTab } from "./tabs/meeting-log-tab";
import type { MeetingStatus, DecisionMethod, AgendaItemType, Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";

type MeetingData = {
  id: string;
  title: string;
  type: string;
  status: MeetingStatus;
  scheduledAt: Date;
  location: string | null;
  description: string | null;
  meetingChairpersonId: string | null;
  meetingSecretaryId: string | null;
  adjusters: string[];
  agendaItems: Array<{
    id: string;
    sortOrder: number;
    title: string;
    description: string | null;
    duration: number | null;
    presenter: string | null;
    voteType: string | null;
    specialType: AgendaItemType | null;
    votes: Array<{
      id: string;
      choice: string;
      user: { id: string; firstName: string; lastName: string };
    }>;
    decisions: Array<{ id: string; reference: string; title: string }>;
  }>;
  attendances: Array<{
    id: string;
    status: string;
    proxyFor: string | null;
    user: { id: string; firstName: string; lastName: string; email: string };
  }>;
  protocol: {
    id: string;
    content: string;
    status: string;
    signedAt: Date | null;
    signedBy: string[];
    finalizedAt: Date | null;
    finalizedBy: string | null;
    archivedAt: Date | null;
  } | null;
  decisions: Array<{
    id: string;
    reference: string;
    title: string;
    decisionText: string;
    decidedAt: Date;
    method: DecisionMethod;
    voteRequestedBy: string | null;
    voteRequestedReason: string | null;
    votesFor: number | null;
    votesAgainst: number | null;
    votesAbstained: number | null;
  }>;
};

type BoardMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Array<{ role: string }>;
};

const statusLabels: Record<string, string> = {
  DRAFT: "Utkast",
  SCHEDULED: "Planerat",
  IN_PROGRESS: "Pågår",
  FINALIZING: "Efterbehandling",
  COMPLETED: "Avslutat",
  CANCELLED: "Inställt",
};

type TabDef = { id: string; label: string; icon: typeof FileText };

const baseTabs: TabDef[] = [
  { id: "agenda", label: "Dagordning", icon: FileText },
  { id: "roles", label: "Mötesroller", icon: UserCog },
  { id: "attendance", label: "Närvaro", icon: Users },
  { id: "protocol", label: "Protokoll", icon: BookOpen },
  { id: "decisions", label: "Beslut", icon: CheckCircle },
];

const annualTabs: TabDef[] = [
  { id: "voter-registry", label: "Röstlängd", icon: ClipboardList },
  { id: "proxies", label: "Ombud", icon: UserCheck },
];

export function MeetingDetail({
  meeting: initialMeeting,
  boardMembers,
}: {
  meeting: MeetingData;
  boardMembers: BoardMember[];
}) {
  const isAnnualMeeting = initialMeeting.type === "ANNUAL" || initialMeeting.type === "EXTRAORDINARY";
  const isBoardMeeting = initialMeeting.type === "BOARD";
  const showLog = initialMeeting.status === "FINALIZING" || initialMeeting.status === "COMPLETED";
  const logTab: TabDef[] = showLog ? [{ id: "log", label: "Möteslogg", icon: ScrollText }] : [];
  const tabs = [...baseTabs, ...(isAnnualMeeting ? annualTabs : []), ...logTab];
  const [activeTab, setActiveTab] = useState("agenda");
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canEdit = hasPermission(userRoles, "meeting:edit");

  const rulesQuery = trpc.brfRules.get.useQuery();
  const rules = rulesQuery.data;

  // Beslutförhet (board meetings)
  const presentCount = initialMeeting.attendances.filter(
    (a) => a.status === "PRESENT" || a.status === "PROXY"
  ).length;
  const totalBoardMembers = boardMembers.length;
  const quorumRequired = Math.floor(totalBoardMembers / 2) + 1;
  const isQuorate = presentCount >= quorumRequired;

  const [noticePeriodWarning, setNoticePeriodWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateStatus = trpc.meeting.update.useMutation({
    onSuccess: () => {
      setErrorMessage(null);
      setNoticePeriodWarning(null);
      router.refresh();
    },
    onError: (error) => {
      if (error.data?.code === "PRECONDITION_FAILED") {
        setNoticePeriodWarning(error.message);
      } else {
        setErrorMessage(error.message);
      }
    },
  });

  function handleStatusChange(status: MeetingStatus, skipNoticePeriodCheck?: boolean) {
    setErrorMessage(null);
    updateStatus.mutate({ id: initialMeeting.id, status, skipNoticePeriodCheck });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/styrelse/moten"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till möten
        </Link>

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {initialMeeting.title}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {format(new Date(initialMeeting.scheduledAt), "d MMMM yyyy 'kl.' HH:mm", {
                  locale: sv,
                })}
              </span>
              {initialMeeting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {initialMeeting.location}
                </span>
              )}
            </div>
            {initialMeeting.description && (
              <p className="mt-2 text-sm text-gray-600">
                {initialMeeting.description}
              </p>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              {initialMeeting.status !== "CANCELLED" && (
                <>
                  <Link href={`/styrelse/moten/${initialMeeting.id}/admin`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100">
                    Mötesadmin
                  </Link>
                  <Link href={`/styrelse/moten/${initialMeeting.id}/presentation`} target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Presentation
                  </Link>
                </>
              )}
              {initialMeeting.status === "DRAFT" && (
                <button
                  onClick={() => handleStatusChange("SCHEDULED")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Publicera kallelse
                </button>
              )}
              {initialMeeting.status === "SCHEDULED" && (
                <button
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Play className="h-3.5 w-3.5" />
                  Starta möte
                </button>
              )}
              {initialMeeting.status === "IN_PROGRESS" && (
                <button
                  onClick={() => handleStatusChange("FINALIZING")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Avsluta → Efterbehandling
                </button>
              )}
              {initialMeeting.status === "FINALIZING" && (
                <button
                  onClick={() => handleStatusChange("COMPLETED")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Lås möte
                </button>
              )}
              {(initialMeeting.status === "DRAFT" || initialMeeting.status === "SCHEDULED") && (
                <button
                  onClick={() => handleStatusChange("CANCELLED")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Ställ in
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status badge + quorum */}
        <div className="mt-3 flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              {
                "bg-gray-100 text-gray-700": initialMeeting.status === "DRAFT",
                "bg-blue-100 text-blue-700": initialMeeting.status === "SCHEDULED",
                "bg-green-100 text-green-700": initialMeeting.status === "IN_PROGRESS",
                "bg-amber-100 text-amber-700": initialMeeting.status === "FINALIZING",
                "bg-gray-100 text-gray-600": initialMeeting.status === "COMPLETED",
                "bg-red-100 text-red-700": initialMeeting.status === "CANCELLED",
              }
            )}
          >
            {statusLabels[initialMeeting.status]}
          </span>

          {isBoardMeeting && initialMeeting.status === "IN_PROGRESS" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                isQuorate
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {isQuorate ? (
                <>Beslutfört ({presentCount}/{totalBoardMembers})</>
              ) : (
                <>Ej beslutfört ({presentCount}/{totalBoardMembers}, krävs {quorumRequired})</>
              )}
            </span>
          )}
        </div>

        {noticePeriodWarning && (
          <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">{noticePeriodWarning}</p>
            <p className="mt-1 text-sm text-amber-700">
              Vill du publicera kallelsen ändå?
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleStatusChange("SCHEDULED", true)}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                Publicera ändå
              </button>
              <button
                onClick={() => setNoticePeriodWarning(null)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "agenda" && (
          <AgendaTab
            meetingId={initialMeeting.id}
            meetingStatus={initialMeeting.status}
            agendaItems={initialMeeting.agendaItems}
            canEdit={canEdit}
          />
        )}
        {activeTab === "roles" && (
          <MeetingRolesTab
            meetingId={initialMeeting.id}
            meetingChairpersonId={initialMeeting.meetingChairpersonId}
            meetingSecretaryId={initialMeeting.meetingSecretaryId}
            adjusters={initialMeeting.adjusters}
            boardMembers={boardMembers}
            canEdit={canEdit}
          />
        )}
        {activeTab === "attendance" && (
          <AttendanceTab
            meetingId={initialMeeting.id}
            attendances={initialMeeting.attendances}
            boardMembers={boardMembers}
            canEdit={canEdit}
          />
        )}
        {activeTab === "protocol" && (
          <ProtocolTab
            meetingId={initialMeeting.id}
            protocol={initialMeeting.protocol}
            canEdit={canEdit}
            meetingChairpersonId={initialMeeting.meetingChairpersonId}
            adjusters={initialMeeting.adjusters}
          />
        )}
        {activeTab === "decisions" && (
          <DecisionsTab
            meetingId={initialMeeting.id}
            decisions={initialMeeting.decisions}
            agendaItems={initialMeeting.agendaItems}
            canEdit={canEdit}
          />
        )}
        {activeTab === "voter-registry" && isAnnualMeeting && (
          <VoterRegistryTab
            meetingId={initialMeeting.id}
            meetingStatus={initialMeeting.status}
            canEdit={canEdit}
          />
        )}
        {activeTab === "proxies" && isAnnualMeeting && (
          <ProxyTab
            meetingId={initialMeeting.id}
            canEdit={canEdit}
          />
        )}
        {activeTab === "log" && showLog && (
          <MeetingLogTab meetingId={initialMeeting.id} />
        )}
      </div>
    </div>
  );
}
