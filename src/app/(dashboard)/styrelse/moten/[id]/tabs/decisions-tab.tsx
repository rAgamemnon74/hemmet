"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Decision = {
  id: string;
  reference: string;
  title: string;
  decisionText: string;
  decidedAt: Date;
};

type AgendaItem = {
  id: string;
  sortOrder: number;
  title: string;
};

export function DecisionsTab({
  meetingId,
  decisions,
  agendaItems,
  canEdit,
}: {
  meetingId: string;
  decisions: Decision[];
  agendaItems: AgendaItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    decisionText: "",
    agendaItemId: "",
  });

  const createDecision = trpc.decision.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setForm({ title: "", description: "", decisionText: "", agendaItemId: "" });
      router.refresh();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createDecision.mutate({
      meetingId,
      title: form.title,
      description: form.description,
      decisionText: form.decisionText,
      agendaItemId: form.agendaItemId || undefined,
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {decisions.length} beslut
        </div>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nytt beslut
          </button>
        )}
      </div>

      {decisions.length === 0 && !showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Inga beslut fattade ännu.</p>
        </div>
      )}

      <div className="space-y-3">
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-600">
                    {decision.reference}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {decision.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                  {decision.decisionText}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {format(new Date(decision.decidedAt), "d MMM yyyy", { locale: sv })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4"
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kopplad dagordningspunkt
              </label>
              <select
                value={form.agendaItemId}
                onChange={(e) => setForm((f) => ({ ...f, agendaItemId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Ingen koppling</option>
                {agendaItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    §{item.sortOrder} {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Titel *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="t.ex. Godkännande av budget 2026"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bakgrund/Beskrivning *
              </label>
              <textarea
                rows={2}
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Förklaring av ärendet"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Beslutstext *
              </label>
              <textarea
                rows={3}
                required
                value={form.decisionText}
                onChange={(e) => setForm((f) => ({ ...f, decisionText: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Styrelsen beslutar att..."
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={createDecision.isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createDecision.isPending ? "Sparar..." : "Spara beslut"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
