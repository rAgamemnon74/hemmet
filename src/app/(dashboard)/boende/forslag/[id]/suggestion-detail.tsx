"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc"
import { AttachmentSection } from "@/components/attachments";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, ReportStatus } from "@prisma/client";

type SuggestionData = {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  response: string | null;
  createdAt: Date;
  author: { id: string; firstName: string; lastName: string; email: string };
};

const statusLabels: Record<ReportStatus, string> = {
  SUBMITTED: "Inskickat",
  ACKNOWLEDGED: "Mottaget",
  IN_PROGRESS: "Utreds",
  RESOLVED: "Genomfört",
  CLOSED: "Avslutat",
};

const statusColors: Record<ReportStatus, string> = {
  SUBMITTED: "bg-amber-100 text-amber-700",
  ACKNOWLEDGED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

export function SuggestionDetail({ suggestion }: { suggestion: SuggestionData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canRespond = hasPermission(userRoles, "suggestion:respond");

  const [responseText, setResponseText] = useState(suggestion.response ?? "");
  const [newStatus, setNewStatus] = useState<ReportStatus>(suggestion.status);

  const respond = trpc.suggestion.respond.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/boende/forslag" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till förslag
        </Link>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">{suggestion.title}</h1>
            <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusColors[suggestion.status])}>
              {statusLabels[suggestion.status]}
            </span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{suggestion.description}</p>
          <div className="mt-4 text-xs text-gray-500">
            {suggestion.author.firstName} {suggestion.author.lastName} — {format(new Date(suggestion.createdAt), "d MMMM yyyy", { locale: sv })}
          </div>
        </div>

        {suggestion.response && (
          <div className="rounded-lg border border-green-200 bg-green-50/30 p-6">
            <h2 className="text-sm font-semibold text-green-900 mb-2">Styrelsens svar</h2>
            <p className="text-sm text-green-800 whitespace-pre-wrap">{suggestion.response}</p>
          </div>
        )}

        {canRespond && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Svara på förslaget</h3>
            <textarea
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Styrelsens svar..."
            />
            <div className="flex items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Object.entries(statusLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() =>
                  respond.mutate({
                    id: suggestion.id,
                    response: responseText,
                    status: newStatus,
                  })
                }
                disabled={!responseText.trim() || respond.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {respond.isPending ? "Sparar..." : "Spara svar"}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AttachmentSection entityType="Suggestion" entityId={suggestion.id} canEdit={false} />
        </div>
      </div>
    </div>
  );
}
