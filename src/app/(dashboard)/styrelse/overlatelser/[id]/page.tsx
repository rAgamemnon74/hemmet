"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft, ArrowRightLeft, CheckCircle, XCircle, Clock,
  CreditCard, Building2, User, FileText, Loader2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc"
import { AttachmentSection } from "@/components/attachments";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

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

function fmt(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "d MMMM yyyy", { locale: sv });
}

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canReview = hasPermission(userRoles, "transfer:review");
  const canManageFinancial = hasPermission(userRoles, "transfer:manage_financial");

  const query = trpc.transfer.getById.useQuery({ id });
  const updateStatus = trpc.transfer.updateStatus.useMutation({ onSuccess: () => query.refetch() });
  const updateChecks = trpc.transfer.updateChecks.useMutation({ onSuccess: () => query.refetch() });
  const updateFinancials = trpc.transfer.updateFinancials.useMutation({ onSuccess: () => query.refetch() });
  const completeTransfer = trpc.transfer.complete.useMutation({ onSuccess: () => query.refetch() });

  if (query.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (!query.data) return <p className="text-red-600">Ärendet hittades inte.</p>;

  const t = query.data;
  const buyerName = t.buyerApplication
    ? t.buyerApplication.applicantType === "ORGANIZATION"
      ? t.buyerApplication.organizationName
      : `${t.buyerApplication.firstName ?? ""} ${t.buyerApplication.lastName ?? ""}`.trim()
    : null;
  const isActive = !["COMPLETED", "CANCELLED", "REJECTED"].includes(t.status);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/styrelse/overlatelser" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Tillbaka
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            {t.apartment.building.name}, lgh {t.apartment.number}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {typeLabels[t.type]} — skapad {fmt(t.createdAt)} av {t.createdBy.firstName} {t.createdBy.lastName}
          </p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-sm font-medium", statusColors[t.status])}>
          {statusLabels[t.status]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Parties */}
        <Section icon={User} title="Parter">
          <Row label="Säljare" value={t.seller ? `${t.seller.firstName} ${t.seller.lastName}` : "Ej angiven"} />
          <Row label="Köpare" value={buyerName ?? "Ej kopplad"} />
          {t.externalContactName && <Row label="Extern kontakt" value={`${t.externalContactName}${t.externalContactEmail ? ` (${t.externalContactEmail})` : ""}`} />}
          <Row label="Tillträdesdag" value={fmt(t.accessDate)} />
          {t.transferPrice && <Row label="Köpesumma" value={`${t.transferPrice.toLocaleString("sv-SE")} kr`} />}
        </Section>

        {/* Membership review */}
        <Section icon={FileText} title="Medlemsprövning">
          {canReview && isActive ? (
            <div className="space-y-2">
              <CheckItem label="Kreditupplysning utförd" checked={t.creditCheckDone}
                onToggle={() => updateChecks.mutate({ id, creditCheckDone: !t.creditCheckDone, creditCheckDate: !t.creditCheckDone ? new Date() : undefined })} />
              <CheckItem label="Finansiering verifierad" checked={t.financingVerified}
                onToggle={() => updateChecks.mutate({ id, financingVerified: !t.financingVerified, financingVerifiedDate: !t.financingVerified ? new Date() : undefined })} />
              <CheckItem label="Stadgevillkor kontrollerade" checked={t.statuteCheckDone}
                onToggle={() => updateChecks.mutate({ id, statuteCheckDone: !t.statuteCheckDone })} />
            </div>
          ) : (
            <div className="space-y-1">
              <Row label="Kreditupplysning" value={t.creditCheckDone ? `Ja (${fmt(t.creditCheckDate)})` : "Nej"} />
              <Row label="Finansiering" value={t.financingVerified ? `Ja (${fmt(t.financingVerifiedDate)})` : "Nej"} />
              <Row label="Stadgevillkor" value={t.statuteCheckDone ? "Kontrollerade" : "Ej kontrollerade"} />
            </div>
          )}
          {t.rejectionReason && (
            <div className="mt-3 rounded bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-700">Avslagsmotivering</p>
              <p className="text-sm text-red-600 mt-1">{t.rejectionReason}</p>
            </div>
          )}
          {t.decision && (
            <div className="mt-3 rounded bg-green-50 border border-green-200 p-3">
              <p className="text-xs font-medium text-green-700">Styrelsebeslut</p>
              <p className="text-sm text-green-600">{t.decision.reference} — {fmt(t.decision.decidedAt)}</p>
            </div>
          )}
        </Section>

        {/* Financials */}
        <Section icon={CreditCard} title="Ekonomi">
          <Row label="Överlåtelseavgift" value={t.transferFeeAmount ? `${Math.round(t.transferFeeAmount).toLocaleString("sv-SE")} kr` : "—"} />
          <Row label="Betalas av" value={t.transferFeePaidBy === "SELLER" ? "Säljare" : "Köpare"} />
          <Row label="Betald" value={t.transferFeePaidAt ? fmt(t.transferFeePaidAt) : "Ej betald"} />
          {canManageFinancial && isActive && !t.transferFeePaidAt && (
            <button onClick={() => updateFinancials.mutate({ id, transferFeePaidAt: new Date() })}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">
              Markera som betald
            </button>
          )}
          <div className="border-t border-gray-100 mt-3 pt-3">
            <Row label="Pantsättningsavgift" value={t.pledgeFeeAmount ? `${Math.round(t.pledgeFeeAmount).toLocaleString("sv-SE")} kr` : "—"} />
          </div>
          {t.outstandingDebt && t.outstandingDebt > 0 && (
            <div className="mt-3 rounded bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">Säljaren har utestående skuld: {t.outstandingDebt.toLocaleString("sv-SE")} kr</p>
            </div>
          )}
        </Section>

        {/* Mortgage notations */}
        <Section icon={Building2} title="Pantnoteringar">
          {t.mortgageNotations.length === 0 ? (
            <p className="text-sm text-gray-400">Inga pantnoteringar.</p>
          ) : (
            <div className="space-y-2">
              {t.mortgageNotations.map((m) => (
                <div key={m.id} className={cn("rounded border p-2 text-sm", m.denotationDate ? "border-gray-200 bg-gray-50" : "border-blue-200 bg-blue-50")}>
                  <div className="flex justify-between">
                    <span className="font-medium">{m.bankName}</span>
                    <span className={m.denotationDate ? "text-gray-400 text-xs" : "text-blue-600 text-xs"}>
                      {m.denotationDate ? "Avnoterad" : "Aktiv"}
                    </span>
                  </div>
                  {m.amount && <p className="text-xs text-gray-500">{m.amount.toLocaleString("sv-SE")} kr</p>}
                  <p className="text-xs text-gray-400">Noterad {fmt(m.notationDate)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Attachments */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 mt-6">
        <AttachmentSection entityType="TransferCase" entityId={id} canEdit={canReview} />
      </div>

      {/* Actions */}
      {canReview && isActive && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Åtgärder</h3>
          <div className="flex flex-wrap gap-2">
            {t.status === "INITIATED" && (
              <button onClick={() => updateStatus.mutate({ id, status: "MEMBERSHIP_REVIEW" })}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                <Clock className="h-3.5 w-3.5" /> Starta medlemsprövning
              </button>
            )}
            {["INITIATED", "MEMBERSHIP_REVIEW"].includes(t.status) && (
              <>
                <button onClick={() => updateStatus.mutate({ id, status: "APPROVED" })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                  <CheckCircle className="h-3.5 w-3.5" /> Godkänn
                </button>
                <button onClick={() => {
                  const reason = prompt("Ange motivering för avslaget (obligatoriskt):");
                  if (reason) updateStatus.mutate({ id, status: "REJECTED", rejectionReason: reason });
                }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
                  <XCircle className="h-3.5 w-3.5" /> Avslå
                </button>
              </>
            )}
            {t.status === "APPROVED" && (
              <button onClick={() => updateStatus.mutate({ id, status: "FINANCIAL_SETTLEMENT" })}
                className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700">
                <CreditCard className="h-3.5 w-3.5" /> Ekonomisk reglering
              </button>
            )}
            {["APPROVED", "FINANCIAL_SETTLEMENT"].includes(t.status) && (
              <button onClick={() => completeTransfer.mutate({ id })}
                className="inline-flex items-center gap-1.5 rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900">
                <CheckCircle className="h-3.5 w-3.5" /> Slutför ägarskifte
              </button>
            )}
            {!["COMPLETED", "CANCELLED"].includes(t.status) && (
              <button onClick={() => updateStatus.mutate({ id, status: "CANCELLED" })}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50">
                Avbryt ärende
              </button>
            )}
          </div>
          {updateStatus.error && <p className="mt-2 text-sm text-red-600">{updateStatus.error.message}</p>}
          {completeTransfer.error && <p className="mt-2 text-sm text-red-600">{completeTransfer.error.message}</p>}
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase mb-3">
        <Icon className="h-4 w-4 text-gray-400" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-gray-50">
      <input type="checkbox" checked={checked} onChange={onToggle}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span className={cn("text-sm", checked ? "text-gray-900" : "text-gray-500")}>{label}</span>
    </label>
  );
}
