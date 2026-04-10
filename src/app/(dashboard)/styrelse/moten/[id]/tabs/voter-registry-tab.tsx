"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ClipboardList, Check, Lock, Unlock, UserCheck, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, MeetingStatus } from "@prisma/client";

export function VoterRegistryTab({
  meetingId,
  meetingStatus,
  canEdit,
}: {
  meetingId: string;
  meetingStatus: MeetingStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canSchedule = hasPermission(userRoles, "annual:schedule");

  const registryQuery = trpc.voterRegistry.getByMeeting.useQuery({ meetingId });
  const membersQuery = trpc.voterRegistry.getMembers.useQuery();

  const createRegistry = trpc.voterRegistry.create.useMutation({
    onSuccess: () => registryQuery.refetch(),
  });
  const checkIn = trpc.voterRegistry.checkIn.useMutation({
    onSuccess: () => registryQuery.refetch(),
  });
  const selfCheckIn = trpc.voterRegistry.selfCheckIn.useMutation({
    onSuccess: () => registryQuery.refetch(),
  });
  const lockRegistry = trpc.voterRegistry.lock.useMutation({
    onSuccess: () => registryQuery.refetch(),
  });
  const unlockRegistry = trpc.voterRegistry.unlock.useMutation({
    onSuccess: () => registryQuery.refetch(),
  });

  const registry = registryQuery.data;
  const members = membersQuery.data ?? [];

  const checkedInIds = new Set(
    registry?.entries.filter((e) => e.checkedIn).map((e) => e.memberId) ?? []
  );
  const checkedInCount = checkedInIds.size;
  const isSelfCheckedIn = checkedInIds.has(session?.user?.id ?? "");

  if (registryQuery.isLoading || membersQuery.isLoading) {
    return <p className="text-sm text-gray-500">Laddar...</p>;
  }

  // No registry yet
  if (!registry) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Ingen röstlängd</h3>
        <p className="mt-2 text-sm text-gray-500">
          Skapa en röstlängd för att registrera deltagare.
        </p>
        {canSchedule && (
          <button
            onClick={() => createRegistry.mutate({ meetingId, method: "DIGITAL" })}
            disabled={createRegistry.isPending}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Skapa digital röstlängd
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voting rights info */}
      <div className="rounded-md bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700 space-y-0.5">
          <p>Varje medlem har <strong>en röst</strong>. Om flera medlemmar gemensamt äger en bostadsrätt har de tillsammans bara en röst.</p>
          <p>Medlem som innehar flera lägenheter har också bara en röst.</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {checkedInCount} av {members.length} incheckade
          {registry.locked && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Lock className="h-3 w-3" />
              Låst
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {/* Self check-in for members */}
          {meetingStatus === "IN_PROGRESS" && !registry.locked && !isSelfCheckedIn && (
            <button
              onClick={() => selfCheckIn.mutate({ voterRegistryId: registry.id })}
              disabled={selfCheckIn.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              {selfCheckIn.isPending ? "Checkar in..." : "Checka in mig"}
            </button>
          )}
          {isSelfCheckedIn && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Du är incheckad
            </span>
          )}
          {canSchedule && !registry.locked && (
            <button
              onClick={() => lockRegistry.mutate({ id: registry.id })}
              disabled={lockRegistry.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              <Lock className="h-3.5 w-3.5" />
              Lås röstlängd
            </button>
          )}
          {canSchedule && registry.locked && (
            <button
              onClick={() => unlockRegistry.mutate({ id: registry.id })}
              disabled={unlockRegistry.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Unlock className="h-3.5 w-3.5" />
              Lås upp
            </button>
          )}
        </div>
      </div>

      {/* Member list */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Medlem</th>
              <th className="px-4 py-3">Lägenhet</th>
              <th className="px-4 py-3">Andel</th>
              <th className="px-4 py-3">Status</th>
              {canEdit && !registry.locked && <th className="px-4 py-3 w-32"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => {
              const isCheckedIn = checkedInIds.has(m.id);
              const entry = registry.entries.find((e) => e.memberId === m.id);

              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.apartment
                      ? `${m.apartment.building.name}, lgh ${m.apartment.number}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.apartment?.share
                      ? `${(m.apartment.share * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {isCheckedIn ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" />
                        Incheckad
                        {entry?.checkedInAt && (
                          <span className="text-green-500 ml-1">
                            {format(new Date(entry.checkedInAt), "HH:mm")}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        Ej incheckad
                      </span>
                    )}
                  </td>
                  {canEdit && !registry.locked && (
                    <td className="px-4 py-3">
                      {!isCheckedIn && (
                        <button
                          onClick={() =>
                            checkIn.mutate({
                              voterRegistryId: registry.id,
                              memberId: m.id,
                              votingShares: m.apartment?.share ?? undefined,
                            })
                          }
                          disabled={checkIn.isPending}
                          className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Checka in
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
