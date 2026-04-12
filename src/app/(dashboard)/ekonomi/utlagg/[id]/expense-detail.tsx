"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, Check, X, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc"
import { AttachmentSection } from "@/components/attachments";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, ExpenseStatus } from "@prisma/client";

type ExpenseData = {
  id: string;
  amount: unknown;
  currency: string;
  description: string;
  category: string;
  status: ExpenseStatus;
  receiptUrl: string | null;
  rejectionNote: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  submitter: { id: string; firstName: string; lastName: string; email: string };
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

export function ExpenseDetail({ expense }: { expense: ExpenseData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canApprove = hasPermission(userRoles, "expense:approve");

  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const approve = trpc.expense.approve.useMutation({
    onSuccess: () => router.refresh(),
  });
  const reject = trpc.expense.reject.useMutation({
    onSuccess: () => router.refresh(),
  });
  const markPaid = trpc.expense.markPaid.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/ekonomi/utlagg"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till utlägg
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {expense.description}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{expense.category}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              statusColors[expense.status]
            )}
          >
            {statusLabels[expense.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Belopp</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {Number(expense.amount).toLocaleString("sv-SE")} {expense.currency}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Inlämnad av</p>
            <p className="mt-1 text-sm text-gray-900">
              {expense.submitter.firstName} {expense.submitter.lastName}
            </p>
            <p className="text-xs text-gray-500">{expense.submitter.email}</p>
          </div>
          {expense.submittedAt && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Inskickat</p>
              <p className="mt-1 text-sm text-gray-700">
                {format(new Date(expense.submittedAt), "d MMMM yyyy", { locale: sv })}
              </p>
            </div>
          )}
          {expense.approver && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                {expense.status === "REJECTED" ? "Avslagen av" : "Godkänd av"}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {expense.approver.firstName} {expense.approver.lastName}
              </p>
            </div>
          )}
          {expense.paidAt && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Utbetald</p>
              <p className="mt-1 text-sm text-gray-700">
                {format(new Date(expense.paidAt), "d MMMM yyyy", { locale: sv })}
              </p>
            </div>
          )}
        </div>

        {expense.rejectionNote && (
          <div className="mt-4 rounded-md bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">Anledning till avslag:</p>
            <p className="mt-1 text-sm text-red-700">{expense.rejectionNote}</p>
          </div>
        )}

        {/* Actions */}
        {canApprove && expense.status === "SUBMITTED" && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            {showRejectForm ? (
              <div className="space-y-3">
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Ange anledning till avslag..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectNote("");
                    }}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={() =>
                      reject.mutate({ id: expense.id, rejectionNote: rejectNote })
                    }
                    disabled={!rejectNote.trim() || reject.isPending}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Bekräfta avslag
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => approve.mutate({ id: expense.id })}
                  disabled={approve.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {approve.isPending ? "Godkänner..." : "Godkänn"}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  Avslå
                </button>
              </div>
            )}
          </div>
        )}

        {canApprove && expense.status === "APPROVED" && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <button
              onClick={() => markPaid.mutate({ id: expense.id })}
              disabled={markPaid.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {markPaid.isPending ? "Markerar..." : "Markera som betald"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <AttachmentSection entityType="Expense" entityId={expense.id} canEdit={canApprove} />
      </div>
    </div>
  );
}
