"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, Vote, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { AttachmentInput, type PendingAttachment } from "@/components/attachment-input";
import { useAttachmentSubmitter } from "@/lib/use-create-with-attachments";
import type { MotionStatus } from "@prisma/client";

type Motion = {
  id: string;
  title: string;
  status: MotionStatus;
  createdAt: Date;
  submittedAt: Date | null;
  author: { id: string; firstName: string; lastName: string };
  meeting: { id: string; title: string; scheduledAt: Date } | null;
};

const statusLabels: Record<MotionStatus, string> = {
  DRAFT: "Utkast",
  SUBMITTED: "Inskickad",
  RECEIVED: "Mottagen",
  BOARD_RESPONSE: "Styrelsens yttrande",
  DECIDED: "Beslutad",
  WITHDRAWN: "Återtagen",
  STRUCK: "Struken",
  NOT_TREATED: "Ej behandlad",
};

const statusColors: Record<MotionStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-blue-100 text-blue-700",
  BOARD_RESPONSE: "bg-purple-100 text-purple-700",
  DECIDED: "bg-green-100 text-green-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
  STRUCK: "bg-red-100 text-red-700",
  NOT_TREATED: "bg-orange-100 text-orange-700",
};

export function MotionList({ initialData }: { initialData: Motion[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", proposal: "" });
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const { submitAttachments } = useAttachmentSubmitter();

  const create = trpc.motion.create.useMutation({
    onSuccess: async (motion) => {
      if (attachments.length > 0) {
        await submitAttachments("Motion", motion.id, attachments);
      }
      setAttachments([]);
      router.push(`/medlem/motioner/${motion.id}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motioner</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lämna förslag till beslut inför årsmötet
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Ny motion
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-5 space-y-4">
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Rubrik *"
            autoFocus
          />
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Bakgrund och motivering *"
          />
          <textarea
            rows={3}
            required
            value={form.proposal}
            onChange={(e) => setForm((f) => ({ ...f, proposal: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Motionären yrkar att... *"
          />
          <AttachmentInput attachments={attachments} onChange={setAttachments} label="Bilagor (underlag, ritningar etc.)" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Avbryt
            </button>
            <button type="submit" disabled={create.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {create.isPending ? "Skickar..." : "Skicka in motion"}
            </button>
          </div>
        </form>
      )}

      {initialData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Vote className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga motioner</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {initialData.map((m) => (
            <Link
              key={m.id}
              href={`/medlem/motioner/${m.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900">{m.title}</h3>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[m.status])}>
                      {statusLabels[m.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>{m.author.firstName} {m.author.lastName}</span>
                    {m.meeting && <span>Kopplad till: {m.meeting.title}</span>}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {format(new Date(m.createdAt), "d MMM yyyy", { locale: sv })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
