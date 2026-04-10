"use client";

import { useState } from "react";
import Link from "next/link";
import { DoorOpen, Search, Download, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApartmentType } from "@prisma/client";

type Apartment = {
  id: string;
  number: string;
  floor: number | null;
  area: number | null;
  rooms: number | null;
  share: number | null;
  monthlyFee: number | null;
  objectNumber: string | null;
  type: ApartmentType;
  balcony: boolean;
  patio: boolean;
  storage: string | null;
  parking: string | null;
  building: { id: string; name: string };
  residents: Array<{ id: string; firstName: string; lastName: string; email: string }>;
};

type Summary = {
  totalShare: number;
  totalFee: number;
  totalArea: number;
  count: number;
  total: number;
};

const typeLabels: Record<ApartmentType, string> = {
  APARTMENT: "Lägenhet",
  COMMERCIAL: "Lokal",
  GARAGE: "Garage",
  STORAGE: "Förråd",
  OTHER: "Övrigt",
};

export function ApartmentRegistry({
  initialData,
  summary,
}: {
  initialData: Apartment[];
  summary: Summary;
}) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? initialData.filter((a) => {
        const s = search.toLowerCase();
        return (
          a.number.toLowerCase().includes(s) ||
          a.building.name.toLowerCase().includes(s) ||
          a.objectNumber?.toLowerCase().includes(s) ||
          a.residents.some(
            (r) =>
              r.firstName.toLowerCase().includes(s) ||
              r.lastName.toLowerCase().includes(s)
          )
        );
      })
    : initialData;

  function exportCsv() {
    const header = "Byggnad,Lgh nr,Objekt nr,Typ,Vån,Yta (kvm),Rum,Andelstal,Avgift (kr),Balkong,Uteplats,Förråd,Parkering,Boende";
    const rows = initialData.map((a) =>
      [
        a.building.name,
        a.number,
        a.objectNumber ?? "",
        typeLabels[a.type],
        a.floor?.toString() ?? "",
        a.area?.toString() ?? "",
        a.rooms?.toString() ?? "",
        a.share ? (a.share * 100).toFixed(2) + "%" : "",
        a.monthlyFee?.toString() ?? "",
        a.balcony ? "Ja" : "Nej",
        a.patio ? "Ja" : "Nej",
        a.storage ?? "",
        a.parking ?? "",
        a.residents.map((r) => `${r.firstName} ${r.lastName}`).join("; "),
      ]
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lagenhetsregister.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lägenhetsregister</h1>
          <p className="mt-1 text-sm text-gray-500">
            {summary.count} lägenheter, {summary.total} objekt totalt
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

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total yta</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {summary.totalArea.toLocaleString("sv-SE")} kvm
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Andelstal</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {(summary.totalShare * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Totala avgifter</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {summary.totalFee.toLocaleString("sv-SE")} kr/mån
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Snitt kr/kvm</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {summary.totalArea > 0
              ? Math.round(summary.totalFee / summary.totalArea).toLocaleString("sv-SE")
              : "—"}{" "}
            kr
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök på nummer, byggnad, objekt eller boende..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <DoorOpen className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {search ? "Inga träffar" : "Inga lägenheter"}
          </h3>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Byggnad</th>
                <th className="px-4 py-3">Nr</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Vån</th>
                <th className="px-4 py-3 text-right">Yta</th>
                <th className="px-4 py-3">Rum</th>
                <th className="px-4 py-3 text-right">Andel</th>
                <th className="px-4 py-3 text-right">Avgift</th>
                <th className="px-4 py-3">Boende</th>
                <th className="px-4 py-3">Extra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {apt.building.name}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/medlem/lagenheter/${apt.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {apt.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {apt.type !== "APARTMENT" && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5">
                        {typeLabels[apt.type]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {apt.floor ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {apt.area ? `${apt.area} kvm` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {apt.rooms ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                    {apt.share ? `${(apt.share * 100).toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {apt.monthlyFee
                      ? `${apt.monthlyFee.toLocaleString("sv-SE")} kr`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {apt.residents.length > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Users className="h-3 w-3" />
                        {apt.residents.map((r) => `${r.firstName} ${r.lastName}`).join(", ")}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Vakant</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {apt.balcony && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">
                          Balkong
                        </span>
                      )}
                      {apt.patio && (
                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-600">
                          Uteplats
                        </span>
                      )}
                      {apt.storage && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                          F:{apt.storage}
                        </span>
                      )}
                      {apt.parking && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">
                          P:{apt.parking}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
