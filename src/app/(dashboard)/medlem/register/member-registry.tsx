"use client";

import { useState } from "react";
import { Building2, Search, Download, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  apartment: {
    number: string;
    floor: number | null;
    area: number | null;
    share: number | null;
    monthlyFee: number | null;
    building: { name: string };
  } | null;
  roles: Array<{ role: string }>;
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  BOARD_CHAIRPERSON: "Ordförande",
  BOARD_SECRETARY: "Sekreterare",
  BOARD_TREASURER: "Kassör",
  BOARD_PROPERTY_MGR: "Förvaltningsansvarig",
  BOARD_ENVIRONMENT: "Miljöansvarig",
  BOARD_EVENTS: "Festansvarig",
  BOARD_MEMBER: "Ledamot",
  BOARD_SUBSTITUTE: "Suppleant",
  AUDITOR: "Revisor",
  MEMBER: "Medlem",
  RESIDENT: "Boende",
};

const boardRoles = [
  "ADMIN", "BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER",
  "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS",
  "BOARD_MEMBER", "BOARD_SUBSTITUTE", "AUDITOR",
];

export function MemberRegistry({ initialData }: { initialData: Member[] }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? initialData.filter((m) => {
        const s = search.toLowerCase();
        return (
          m.firstName.toLowerCase().includes(s) ||
          m.lastName.toLowerCase().includes(s) ||
          m.email.toLowerCase().includes(s) ||
          m.apartment?.number.includes(s) ||
          false
        );
      })
    : initialData;

  function exportCsv() {
    const header = "Förnamn,Efternamn,E-post,Telefon,Lägenhet,Byggnad,Roller";
    const rows = initialData.map((m) =>
      [
        m.firstName,
        m.lastName,
        m.email,
        m.phone ?? "",
        m.apartment?.number ?? "",
        m.apartment?.building.name ?? "",
        m.roles.map((r) => roleLabels[r.role] ?? r.role).join("; "),
      ]
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medlemsregister.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medlemsregister</h1>
          <p className="mt-1 text-sm text-gray-500">
            {initialData.length} registrerade
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Exportera CSV
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök namn, e-post eller lägenhetsnr..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {search ? "Inga träffar" : "Inga medlemmar"}
          </h3>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Namn</th>
                <th className="px-4 py-3">Kontakt</th>
                <th className="px-4 py-3">Lägenhet</th>
                <th className="px-4 py-3">Roller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => {
                const specialRoles = m.roles
                  .filter((r) => boardRoles.includes(r.role))
                  .map((r) => roleLabels[r.role] ?? r.role);

                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {m.firstName} {m.lastName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {m.email}
                        </span>
                        {m.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {m.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.apartment ? (
                        <span>
                          {m.apartment.building.name}, lgh {m.apartment.number}
                          {m.apartment.floor !== null && `, vån ${m.apartment.floor}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {specialRoles.map((role) => (
                          <span
                            key={role}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              "bg-blue-100 text-blue-700"
                            )}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
