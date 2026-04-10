"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Check, X, UserCheck } from "lucide-react";

type Attendance = {
  id: string;
  status: string;
  proxyFor: string | null;
  user: { id: string; firstName: string; lastName: string; email: string };
};

type BoardMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Array<{ role: string }>;
};

const roleLabels: Record<string, string> = {
  BOARD_CHAIRPERSON: "Ordförande",
  BOARD_SECRETARY: "Sekreterare",
  BOARD_TREASURER: "Kassör",
  BOARD_PROPERTY_MGR: "Förvaltningsansvarig",
  BOARD_ENVIRONMENT: "Miljöansvarig",
  BOARD_EVENTS: "Festansvarig",
  BOARD_MEMBER: "Ledamot",
  BOARD_SUBSTITUTE: "Suppleant",
  AUDITOR: "Revisor",
};

export function AttendanceTab({
  meetingId,
  attendances,
  boardMembers,
  canEdit,
}: {
  meetingId: string;
  attendances: Attendance[];
  boardMembers: BoardMember[];
  canEdit: boolean;
}) {
  const router = useRouter();

  const updateAttendance = trpc.attendance.update.useMutation({
    onSuccess: () => router.refresh(),
  });

  const attendanceMap = new Map(
    attendances.map((a) => [a.user.id, a])
  );

  const presentCount = attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY").length;

  function handleToggle(userId: string, newStatus: "PRESENT" | "ABSENT") {
    updateAttendance.mutate({ meetingId, userId, status: newStatus });
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-500">
        {presentCount} av {boardMembers.length} närvarande
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">Roll</th>
              <th className="px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3 w-32">Åtgärd</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {boardMembers.map((member) => {
              const attendance = attendanceMap.get(member.id);
              const status = attendance?.status ?? "ABSENT";
              const boardRole = member.roles
                .map((r) => roleLabels[r.role])
                .filter(Boolean)
                .join(", ");

              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{member.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {boardRole}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        {
                          "bg-green-100 text-green-700": status === "PRESENT",
                          "bg-gray-100 text-gray-600": status === "ABSENT",
                          "bg-blue-100 text-blue-700": status === "PROXY",
                        }
                      )}
                    >
                      {status === "PRESENT" && <Check className="h-3 w-3" />}
                      {status === "ABSENT" && <X className="h-3 w-3" />}
                      {status === "PROXY" && <UserCheck className="h-3 w-3" />}
                      {status === "PRESENT"
                        ? "Närvarande"
                        : status === "PROXY"
                        ? "Fullmakt"
                        : "Frånvarande"}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          handleToggle(
                            member.id,
                            status === "PRESENT" ? "ABSENT" : "PRESENT"
                          )
                        }
                        disabled={updateAttendance.isPending}
                        className={cn(
                          "rounded-md px-3 py-1 text-xs font-medium",
                          status === "PRESENT"
                            ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
                            : "bg-green-600 text-white hover:bg-green-700"
                        )}
                      >
                        {status === "PRESENT" ? "Markera frånvarande" : "Markera närvarande"}
                      </button>
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
