"use client";

import { useParams } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarDays, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AttendanceRegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const meetingQuery = trpc.attendance.getMeetingForRegistration.useQuery({ meetingId: id });
  const selfRegister = trpc.attendance.selfRegister.useMutation({
    onSuccess: () => meetingQuery.refetch(),
  });

  if (meetingQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (meetingQuery.error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-red-600">{meetingQuery.error.message}</p>
      </div>
    );
  }

  const meeting = meetingQuery.data;
  if (!meeting) return null;

  const typeLabel = meeting.type === "BOARD" ? "Styrelsemöte" : meeting.type === "ANNUAL" ? "Ordinarie stämma" : "Extra stämma";

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{typeLabel}</p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {format(new Date(meeting.scheduledAt), "d MMMM yyyy 'kl.' HH:mm", { locale: sv })}
          </span>
          {meeting.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {meeting.location}
            </span>
          )}
        </div>

        <div className="mt-8">
          {!["SCHEDULED", "IN_PROGRESS"].includes(meeting.status) ? (
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">
                {meeting.status === "DRAFT"
                  ? "Mötet är inte publicerat ännu."
                  : "Mötet är inte längre öppet för incheckning."}
              </p>
            </div>
          ) : meeting.isPresent ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <p className="mt-3 text-lg font-semibold text-green-800">Du är registrerad som närvarande</p>
              <p className="mt-1 text-sm text-green-600">Din närvaro har noterats.</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-600">
                Tryck på knappen nedan för att registrera din närvaro.
              </p>
              <button
                onClick={() => selfRegister.mutate({ meetingId: id })}
                disabled={selfRegister.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {selfRegister.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                Registrera närvaro
              </button>
              {selfRegister.error && (
                <p className="mt-3 text-sm text-red-600">{selfRegister.error.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
