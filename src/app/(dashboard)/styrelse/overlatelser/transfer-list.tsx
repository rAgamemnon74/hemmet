"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowRightLeft, Plus, AlertTriangle, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  INITIATED: "Nytt ärende",
  MEMBERSHIP_REVIEW: "Medlemsprövning",
  APPROVED: "Godkänt",
  REJECTED: "Avslagit",
  APPEALED: "Överklagat",
  FINANCIAL_SETTLEMENT: "Ekonomisk reglering",
  COMPLETED: "Slutfört",
  CANCELLED: "Avbrutet",
};

const statusColors: Record<string, string> = {
  INITIATED: "bg-gray-100 text-gray-700",
  MEMBERSHIP_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  APPEALED: "bg-amber-100 text-amber-700",
  FINANCIAL_SETTLEMENT: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-gray-100 text-gray-400",
};

const typeLabels: Record<string, string> = {
  SALE: "Försäljning",
  PRIVATE_SALE: "Privataffär",
  INHERITANCE: "Arv",
  DIVORCE_SETTLEMENT: "Bodelning",
  GIFT: "Gåva",
  FORCED_SALE: "Exekutiv försäljning",
  SHARE_CHANGE: "Andelsändring",
};

type Transfer = {
  id: string;
  type: string;
  status: string;
  accessDate: Date | null;
  transferPrice: number | null;
  createdAt: Date;
  apartment: { number: string; building: { name: string } };
  seller: { id: string; firstName: string; lastName: string } | null;
  buyerApplication: { id: string; firstName: string | null; lastName: string | null; organizationName: string | null; applicantType: string } | null;
};

const ACTIVE_STATUSES = ["INITIATED", "MEMBERSHIP_REVIEW", "APPROVED", "FINANCIAL_SETTLEMENT", "APPEALED"];

export function TransferList({ initialData, overdueCount }: { initialData: Transfer[]; overdueCount: number }) {
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  const filtered = filter === "all"
    ? initialData
    : filter === "active"
      ? initialData.filter((t) => ACTIVE_STATUSES.includes(t.status))
      : initialData.filter((t) => ["COMPLETED", "CANCELLED", "REJECTED"].includes(t.status));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            Överlåtelser
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {initialData.filter((t) => ACTIVE_STATUSES.includes(t.status)).length} pågående ärenden
          </p>
        </div>
        <Link href="/styrelse/overlatelser/nytt"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Nytt ärende
        </Link>
      </div>

      {overdueCount > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            {overdueCount} ärende{overdueCount > 1 ? "n" : ""} har passerat tidsfristen för styrelsebeslut.
          </p>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {(["active", "completed", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}>
            {f === "active" ? "Pågående" : f === "completed" ? "Avslutade" : "Alla"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Home className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga överlåtelser</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "active" ? "Inga pågående ärenden." : "Inga ärenden att visa."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const buyerName = t.buyerApplication
              ? t.buyerApplication.applicantType === "ORGANIZATION"
                ? t.buyerApplication.organizationName
                : `${t.buyerApplication.firstName ?? ""} ${t.buyerApplication.lastName ?? ""}`.trim()
              : "Ej kopplad";

            return (
              <Link key={t.id} href={`/styrelse/overlatelser/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.apartment.building.name}, lgh {t.apartment.number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {typeLabels[t.type] ?? t.type}
                      {t.seller && ` — ${t.seller.firstName} ${t.seller.lastName}`}
                      {" → "}
                      {buyerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  {t.accessDate && (
                    <div className="text-xs text-gray-400">
                      Tillträde {format(new Date(t.accessDate), "d MMM yyyy", { locale: sv })}
                    </div>
                  )}
                  {t.transferPrice && (
                    <div className="text-xs text-gray-400">
                      {t.transferPrice.toLocaleString("sv-SE")} kr
                    </div>
                  )}
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[t.status])}>
                    {statusLabels[t.status]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
