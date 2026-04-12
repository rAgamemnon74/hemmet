"use client";

import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Key, Plus, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { AttachmentInput, type PendingAttachment } from "@/components/attachment-input";
import { useAttachmentSubmitter } from "@/lib/use-create-with-attachments";

const statusLabels: Record<string, string> = {
  SUBMITTED: "Inskickad", UNDER_REVIEW: "Granskas", APPROVED: "Godkänd",
  REJECTED: "Avslagen", ACTIVE: "Pågående", EXPIRED: "Utgången", TERMINATED: "Avslutad",
};
const statusColors: Record<string, string> = {
  SUBMITTED: "bg-amber-100 text-amber-700", UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
  ACTIVE: "bg-green-100 text-green-700", EXPIRED: "bg-gray-100 text-gray-500", TERMINATED: "bg-gray-100 text-gray-500",
};

export default function SubletPage() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reason: "", startDate: "", endDate: "", tenantName: "", tenantEmail: "", tenantPhone: "" });
  const { submitAttachments } = useAttachmentSubmitter();
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

  const rulesQuery = trpc.brfRules.get.useQuery();
  const profileQuery = trpc.profile.get.useQuery();
  const listQuery = trpc.sublet.list.useQuery(undefined, { enabled: false });
  const submit = trpc.sublet.submit.useMutation({ onSuccess: async (result) => {
    if (attachments.length > 0) {
      await submitAttachments("SubletApplication", result.id, attachments);
    }
    setShowForm(false); setForm({ reason: "", startDate: "", endDate: "", tenantName: "", tenantEmail: "", tenantPhone: "" }); setAttachments([]);
  } });

  const rules = rulesQuery.data;
  const profile = profileQuery.data;
  const myIssues = trpc.profile.getMyIssues.useQuery();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Key className="h-6 w-6 text-blue-600" /> Andrahandsuthyrning
      </h1>

      {/* Rules */}
      {rules && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Föreningens regler</h2>
          <div className="space-y-1 text-sm text-gray-700">
            <p>{rules.subletRequiresApproval ? "Andrahandsuthyrning kräver styrelsens godkännande." : "Andrahandsuthyrning kräver ingen särskild ansökan."}</p>
            {rules.subletFeeMaxPercent > 0 && (
              <p>Avgift: max {rules.subletFeeMaxPercent}% av prisbasbeloppet ({Math.round(rules.prisbasbelopp * rules.subletFeeMaxPercent / 100).toLocaleString("sv-SE")} kr).</p>
            )}
          </div>
        </div>
      )}

      {/* My applications */}
      {myIssues.data && (
        <div className="mb-6">
          {/* Sublet apps don't come from getMyIssues — we'd need a dedicated query. Show link instead */}
        </div>
      )}

      {/* New application */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="mb-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Ny ansökan
        </button>
      ) : (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Ansökan om andrahandsuthyrning</h2>

          <div>
            <label className="text-xs font-medium text-gray-500">Skäl till uthyrning</label>
            <textarea rows={3} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="T.ex. arbete på annan ort, studier, utlandsvistelse..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Från datum</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Till datum</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Hyresgästens namn</label>
            <input type="text" value={form.tenantName} onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Hyresgästens e-post</label>
              <input type="email" value={form.tenantEmail} onChange={(e) => setForm((f) => ({ ...f, tenantEmail: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Hyresgästens telefon</label>
              <input type="tel" value={form.tenantPhone} onChange={(e) => setForm((f) => ({ ...f, tenantPhone: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          </div>

          <AttachmentInput attachments={attachments} onChange={setAttachments} />

          <div className="flex gap-2">
            <button onClick={() => {
              if (!profile?.apartment) return;
              submit.mutate({
                apartmentId: profile.apartment.id,
                reason: form.reason,
                startDate: new Date(form.startDate),
                endDate: new Date(form.endDate),
                tenantName: form.tenantName,
                tenantEmail: form.tenantEmail || undefined,
                tenantPhone: form.tenantPhone || undefined,
              });
            }} disabled={submit.isPending || !form.reason || !form.startDate || !form.endDate || !form.tenantName}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skicka ansökan"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Avbryt
            </button>
          </div>
          {submit.error && <p className="text-sm text-red-600">{submit.error.message}</p>}
          {submit.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Ansökan skickad!</p>}
        </div>
      )}
    </div>
  );
}
