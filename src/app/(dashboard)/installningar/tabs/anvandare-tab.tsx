"use client";

import { useState } from "react";
import { Users, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "BOARD_CHAIRPERSON", label: "Ordförande" },
  { value: "BOARD_SECRETARY", label: "Sekreterare" },
  { value: "BOARD_TREASURER", label: "Kassör" },
  { value: "BOARD_PROPERTY_MGR", label: "Förvaltningsansvarig" },
  { value: "BOARD_ENVIRONMENT", label: "Miljöansvarig" },
  { value: "BOARD_EVENTS", label: "Festansvarig" },
  { value: "BOARD_MEMBER", label: "Ledamot" },
  { value: "BOARD_SUBSTITUTE", label: "Suppleant" },
  { value: "AUDITOR", label: "Revisor" },
  { value: "MEMBER", label: "Medlem" },
  { value: "RESIDENT", label: "Boende" },
];

export function AnvandareTab() {
  const membersQuery = trpc.member.list.useQuery();
  const addRole = trpc.member.addRole.useMutation({ onSuccess: () => membersQuery.refetch() });
  const removeRole = trpc.member.removeRole.useMutation({ onSuccess: () => membersQuery.refetch() });

  const [addingRoleFor, setAddingRoleFor] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("MEMBER");

  if (membersQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;
  const members = membersQuery.data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Användare ({members.length})
      </h2>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">E-post</th>
              <th className="px-4 py-3">Roller</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => {
              const userRoles = m.roles.map((r) => r.role);
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {m.firstName} {m.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {userRoles.map((role) => {
                        const label = ALL_ROLES.find((r) => r.value === role)?.label ?? role;
                        return (
                          <span key={role} className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {label}
                            <button onClick={() => removeRole.mutate({ userId: m.id, role })}
                              className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5" title="Ta bort roll">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {addingRoleFor === m.id ? (
                      <div className="flex items-center gap-1">
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as Role)}
                          className="rounded border border-gray-300 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {ALL_ROLES.filter((r) => !userRoles.includes(r.value)).map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <button onClick={() => { addRole.mutate({ userId: m.id, role: selectedRole }); setAddingRoleFor(null); }}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">OK</button>
                        <button onClick={() => setAddingRoleFor(null)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">X</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingRoleFor(m.id); setSelectedRole(ALL_ROLES.find((r) => !userRoles.includes(r.value))?.value ?? "MEMBER"); }}
                        className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Lägg till roll">
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
