"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { maskPersonalId } from "@/lib/gdpr";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, Check, X, AlertTriangle, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { calculateTransferFee, getPriceBaseAmount } from "@/lib/fees";
import type { ApplicationStatus } from "@prisma/client";

type ApplicationData = {
  id: string;
  status: ApplicationStatus;
  firstName: string | null;
  lastName: string | null;
  personalId: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  applicantType: string;
  organizationId: string | null;
  organizationName: string | null;
  organizationOrgNr: string | null;
  ownershipShare: number;
  transferFrom: string | null;
  transferPrice: number | null;
  transferDate: Date | null;
  rejectionReason: string | null;
  boardNotes: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  apartment: {
    id: string;
    number: string;
    area: number | null;
    monthlyFee: number | null;
    building: { name: string; address: string };
    ownerships: Array<{
      ownershipShare: number;
      active: boolean;
      user: { id: string; firstName: string; lastName: string; email: string } | null;
    }>;
  };
};

const statusLabels: Record<ApplicationStatus, string> = {
  SUBMITTED: "Inskickad",
  UNDER_REVIEW: "Under granskning",
  APPROVED: "Godkänd",
  REJECTED: "Avslagen",
  WITHDRAWN: "Återtagen",
};

const statusColors: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

export function ApplicationDetail({ application: app }: { application: ApplicationData }) {
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState("");
  const [boardNotes, setBoardNotes] = useState(app.boardNotes ?? "");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const review = trpc.membership.review.useMutation({
    onSuccess: () => router.refresh(),
  });

  const currentOwnership = app.apartment.ownerships.reduce(
    (s, o) => s + o.ownershipShare, 0
  );
  const rulesQuery = trpc.brfRules.get.useQuery();
  const rules = rulesQuery.data;

  const projectedTotal = currentOwnership + app.ownershipShare;
  const maxOwnership = (rules?.maxOwnershipPercent ?? 100) / 100;
  const wouldExceed = projectedTotal > maxOwnership + 0.001;
  const canReview = ["SUBMITTED", "UNDER_REVIEW"].includes(app.status);

  const transferFee = rules ? calculateTransferFee(rules.transferFeeMaxPercent) : null;
  const pbb = getPriceBaseAmount();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/medlem/ansokningar" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till ansökningar
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                Medlemsansökan — {app.firstName ?? app.organizationName ?? ""} {app.lastName ?? ""}
              </h1>
              <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusColors[app.status])}>
                {statusLabels[app.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Namn</p>
                <p className="text-sm font-medium text-gray-900">{app.firstName} {app.lastName}</p>
              </div>
              {app.personalId && (
                <div>
                  <p className="text-xs text-gray-500">Personnummer</p>
                  <p className="text-sm text-gray-900">{maskPersonalId(app.personalId)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">E-post</p>
                <p className="text-sm text-gray-900">{app.email}</p>
              </div>
              {app.phone && (
                <div>
                  <p className="text-xs text-gray-500">Telefon</p>
                  <p className="text-sm text-gray-900">{app.phone}</p>
                </div>
              )}
              {app.address && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Nuvarande adress</p>
                  <p className="text-sm text-gray-900">{app.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transfer details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Överlåtelseuppgifter</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Lägenhet</p>
                <p className="text-sm font-medium text-gray-900">
                  {app.apartment.building.name}, lgh {app.apartment.number}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Begärd ägarandel</p>
                <p className="text-sm font-bold text-gray-900">
                  {(app.ownershipShare * 100).toFixed(0)}%
                </p>
              </div>
              {app.transferFrom && (
                <div>
                  <p className="text-xs text-gray-500">Överlåtare</p>
                  <p className="text-sm text-gray-900">{app.transferFrom}</p>
                </div>
              )}
              {app.transferPrice !== null && (
                <div>
                  <p className="text-xs text-gray-500">Köpeskilling</p>
                  <p className="text-sm text-gray-900">
                    {app.transferPrice.toLocaleString("sv-SE")} kr
                  </p>
                </div>
              )}
              {app.transferDate && (
                <div>
                  <p className="text-xs text-gray-500">Planerat tillträde</p>
                  <p className="text-sm text-gray-900">
                    {format(new Date(app.transferDate), "d MMMM yyyy", { locale: sv })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Ansökan inskickad</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(app.submittedAt), "d MMMM yyyy", { locale: sv })}
                </p>
              </div>
            </div>
          </div>

          {/* Transfer fee */}
          {rules && transferFee !== null && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Avgifter vid överlåtelse</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Överlåtelseavgift (max {rules.transferFeeMaxPercent}% av PBB)</p>
                  <p className="font-medium text-gray-900">{transferFee.toLocaleString("sv-SE")} kr</p>
                  <p className="text-xs text-gray-400">
                    Betalas av {rules.transferFeePaidBySeller ? "säljaren" : "förvärvaren"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prisbasbelopp {new Date().getFullYear()}</p>
                  <p className="font-medium text-gray-900">{pbb.toLocaleString("sv-SE")} kr</p>
                </div>
              </div>
            </div>
          )}

          {/* Ownership validation */}
          <div className={cn(
            "rounded-lg border p-6",
            wouldExceed ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50"
          )}>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Ägarskapsvalidering
            </h2>

            {/* Current owners */}
            {app.apartment.ownerships.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-1">Nuvarande ägare:</p>
                {app.apartment.ownerships.map((o, i) => (
                  <div key={o.user?.id ?? i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{o.user ? `${o.user.firstName} ${o.user.lastName}` : "Juridisk person"}</span>
                    <span className="font-medium">{(o.ownershipShare * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Nuvarande totalt</span>
                <span className="font-medium">{(currentOwnership * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Denna ansökan</span>
                <span className="font-medium">+{(app.ownershipShare * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Totalt efter godkännande</span>
                <span className={wouldExceed ? "text-red-700" : "text-green-700"}>
                  {(projectedTotal * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {wouldExceed && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Ägarandelen överstiger 100% — ansökan kan inte godkännas i nuvarande form.
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {app.rejectionReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">Anledning till avslag:</p>
              <p className="mt-1 text-sm text-red-700">{app.rejectionReason}</p>
            </div>
          )}

          {/* Review actions */}
          {canReview && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Styrelsens anteckningar
                </label>
                <textarea
                  rows={3}
                  value={boardNotes}
                  onChange={(e) => setBoardNotes(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Interna anteckningar (syns bara för styrelsen)..."
                />
              </div>

              {showRejectForm ? (
                <div className="space-y-3">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Anledning till avslag *"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={() =>
                        review.mutate({
                          id: app.id,
                          status: "REJECTED",
                          rejectionReason,
                          boardNotes: boardNotes || undefined,
                        })
                      }
                      disabled={!rejectionReason.trim() || review.isPending}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Bekräfta avslag
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      review.mutate({
                        id: app.id,
                        status: "APPROVED",
                        boardNotes: boardNotes || undefined,
                      })
                    }
                    disabled={wouldExceed || review.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {review.isPending ? "Godkänner..." : "Godkänn ansökan"}
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Lägenhet</h3>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {app.apartment.building.name}
              </p>
              <p className="text-sm text-gray-600">Lgh {app.apartment.number}</p>
              <p className="text-xs text-gray-500">{app.apartment.building.address}</p>
            </div>
            {app.apartment.area && (
              <div>
                <p className="text-xs text-gray-500">Yta</p>
                <p className="text-sm text-gray-900">{app.apartment.area} kvm</p>
              </div>
            )}
            {app.apartment.monthlyFee && (
              <div>
                <p className="text-xs text-gray-500">Månadsavgift</p>
                <p className="text-sm text-gray-900">
                  {app.apartment.monthlyFee.toLocaleString("sv-SE")} kr
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Nuvarande ägare
            </h3>
            {app.apartment.ownerships.length > 0 ? (
              app.apartment.ownerships.map((o, i) => (
                <div key={o.user?.id ?? i} className="text-sm">
                  <p className="font-medium text-gray-900">
                    {o.user ? `${o.user.firstName} ${o.user.lastName}` : "Juridisk person"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(o.ownershipShare * 100).toFixed(0)}%{o.user?.email ? ` — ${o.user.email}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Inga registrerade ägare</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
