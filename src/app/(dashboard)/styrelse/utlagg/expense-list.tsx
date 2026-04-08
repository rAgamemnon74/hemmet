"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, Receipt, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, ExpenseStatus } from "@prisma/client";

type Expense = {
  id: string;
  amount: unknown;
  currency: string;
  description: string;
  category: string;
  status: ExpenseStatus;
  submittedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  submitter: { id: string; firstName: string; lastName: string };
  approver: { id: string; firstName: string; lastName: string } | null;
};

const statusLabels: Record<ExpenseStatus, string> = {
  DRAFT: "Utkast",
  SUBMITTED: "Inskickat",
  APPROVED: "Godkänt",
  REJECTED: "Avslaget",
  PAID: "Betalt",
};

const statusColors: Record<ExpenseStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  PAID: "bg-blue-100 text-blue-700",
};

export function ExpenseList({ initialData }: { initialData: Expense[] }) {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canApprove = hasPermission(userRoles, "expense:approve");
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "ALL">("ALL");

  const filtered =
    statusFilter === "ALL"
      ? initialData
      : initialData.filter((e) => e.status === statusFilter);

  const pendingCount = initialData.filter((e) => e.status === "SUBMITTED").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utlägg</h1>
          <p className="mt-1 text-sm text-gray-500">
            Hantera utlägg och ersättningar
            {canApprove && pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {pendingCount} väntar på godkännande
              </span>
            )}
          </p>
        </div>
        <Link
          href="/styrelse/utlagg/nytt"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nytt utlägg
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        {(["ALL", "SUBMITTED", "APPROVED", "REJECTED", "PAID"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s === "ALL" ? "Alla" : statusLabels[s]}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Receipt className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga utlägg</h3>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Beskrivning</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Belopp</th>
                <th className="px-4 py-3">Inlämnad av</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/styrelse/utlagg/${expense.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {expense.description}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {expense.category}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {Number(expense.amount).toLocaleString("sv-SE")} {expense.currency}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {expense.submitter.firstName} {expense.submitter.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColors[expense.status]
                      )}
                    >
                      {statusLabels[expense.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(expense.createdAt), "d MMM yyyy", {
                      locale: sv,
                    })}
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
