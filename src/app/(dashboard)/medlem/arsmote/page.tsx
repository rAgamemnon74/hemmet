"use client";

import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Users, CalendarDays, FileText, Vote, ClipboardList, UserCheck,
  CheckCircle, Clock, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { MeetingType, MeetingStatus } from "@prisma/client";

const typeLabels: Record<MeetingType, string> = {
  BOARD: "Styrelsemöte",
  ANNUAL: "Ordinarie föreningsstämma",
  EXTRAORDINARY: "Extra föreningsstämma",
};

const statusLabels: Record<MeetingStatus, string> = {
  DRAFT: "Utkast",
  SCHEDULED: "Kallad",
  IN_PROGRESS: "Pågår",
  FINALIZING: "Efterbehandling",
  COMPLETED: "Avslutad",
  CANCELLED: "Inställd",
};

const statusColors: Record<MeetingStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-green-100 text-green-700",
  FINALIZING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AnnualMeetingsPage() {
  const meetingsQuery = trpc.annualMeeting.list.useQuery();

  if (meetingsQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  const meetings = meetingsQuery.data ?? [];
  const upcoming = meetings.filter((m) => ["DRAFT", "SCHEDULED", "IN_PROGRESS", "FINALIZING"].includes(m.status));
  const historical = meetings.filter((m) => ["COMPLETED", "CANCELLED"].includes(m.status));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Föreningsstämmor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ordinarie och extra stämmor — kallelser, motioner, handlingar och protokoll
        </p>
      </div>

      {/* Upcoming / active */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Aktuella</h2>
          <div className="space-y-3">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} highlight />
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-8 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Ingen stämma planerad</h3>
          <p className="mt-2 text-sm text-gray-500">
            Nästa ordinarie föreningsstämma har inte kallats ännu.
          </p>
        </div>
      )}

      {/* Historical */}
      {historical.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Historik</h2>
          <div className="space-y-2">
            {historical.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type MeetingListItem = {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduledAt: Date;
  location: string | null;
  _count: {
    agendaItems: number;
    attendances: number;
    decisions: number;
    motions: number;
    documents: number;
  };
  protocol: { id: string; signedAt: Date | null } | null;
  voterRegistry: {
    id: string;
    locked: boolean;
    entries: Array<{ id: string; checkedIn: boolean }>;
  } | null;
  proxies: Array<{ id: string; approved: boolean }>;
};

function MeetingCard({ meeting: m, highlight }: { meeting: MeetingListItem; highlight?: boolean }) {
  const checkedIn = m.voterRegistry?.entries.filter((e) => e.checkedIn).length ?? 0;
  const totalEntries = m.voterRegistry?.entries.length ?? 0;
  const approvedProxies = m.proxies.filter((p) => p.approved).length;

  return (
    <Link
      href={`/medlem/arsmote/${m.id}`}
      className={cn(
        "block rounded-lg border bg-white p-5 transition-shadow hover:shadow-md",
        highlight ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900">{m.title}</h3>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[m.status])}>
              {statusLabels[m.status]}
            </span>
            {m.type === "EXTRAORDINARY" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Extra stämma
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {typeLabels[m.type]}
            {m.location && ` — ${m.location}`}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {m._count.agendaItems} punkter
            </span>
            <span className="flex items-center gap-1">
              <Vote className="h-3.5 w-3.5" />
              {m._count.motions} motioner
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {m._count.decisions} beslut
            </span>
            {m.voterRegistry && (
              <span className="flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5" />
                {checkedIn}/{totalEntries} incheckade
              </span>
            )}
            {approvedProxies > 0 && (
              <span className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                {approvedProxies} ombud
              </span>
            )}
            {m.protocol && (
              <span className="flex items-center gap-1 text-green-600">
                <FileText className="h-3.5 w-3.5" />
                Protokoll {m.protocol.signedAt ? "justerat" : "ej justerat"}
              </span>
            )}
            {m._count.documents > 0 && (
              <span>{m._count.documents} handlingar</span>
            )}
          </div>
        </div>

        <div className="text-right text-sm text-gray-500 shrink-0 ml-4">
          <p className="font-medium">
            {format(new Date(m.scheduledAt), "d MMMM yyyy", { locale: sv })}
          </p>
          <p>{format(new Date(m.scheduledAt), "HH:mm")}</p>
        </div>
      </div>
    </Link>
  );
}
