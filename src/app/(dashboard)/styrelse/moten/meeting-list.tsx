"use client";

import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, CalendarDays, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import { Role, type MeetingStatus, type MeetingType } from "@prisma/client";

type Meeting = {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduledAt: Date;
  location: string | null;
  _count: { agendaItems: number; attendances: number; decisions: number };
};

const statusLabels: Record<MeetingStatus, string> = {
  DRAFT: "Utkast",
  SCHEDULED: "Planerat",
  IN_PROGRESS: "Pågår",
  FINALIZING: "Efterbehandling",
  COMPLETED: "Avslutat",
  CANCELLED: "Inställt",
};

const statusColors: Record<MeetingStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-green-100 text-green-700",
  FINALIZING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

const typeLabels: Record<MeetingType, string> = {
  BOARD: "Styrelsemöte",
  ANNUAL: "Årsmöte",
  EXTRAORDINARY: "Extra stämma",
};

export function MeetingList({ initialData }: { initialData: Meeting[] }) {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canCreate = hasPermission(userRoles, "meeting:create");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Möten</h1>
          <p className="mt-1 text-sm text-gray-500">
            Hantera styrelsemöten, årsmöten och extra stämmor
          </p>
        </div>
        {canCreate && (
          <Link
            href="/styrelse/moten/nytt"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nytt möte
          </Link>
        )}
      </div>

      {initialData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga möten</h3>
          <p className="mt-2 text-sm text-gray-500">
            {canCreate
              ? "Skapa ditt första möte för att komma igång."
              : "Inga möten har skapats ännu."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialData.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/styrelse/moten/${meeting.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {meeting.title}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColors[meeting.status]
                      )}
                    >
                      {statusLabels[meeting.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {typeLabels[meeting.type]}
                    {meeting.location && ` — ${meeting.location}`}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p className="font-medium">
                    {format(new Date(meeting.scheduledAt), "d MMMM yyyy", { locale: sv })}
                  </p>
                  <p>{format(new Date(meeting.scheduledAt), "HH:mm")}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {meeting._count.agendaItems} punkter
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {meeting._count.attendances} närvarande
                </span>
                <span>{meeting._count.decisions} beslut</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
