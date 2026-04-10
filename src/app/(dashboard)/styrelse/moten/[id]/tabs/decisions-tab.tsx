"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, BookOpen, Vote, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { DecisionMethod } from "@prisma/client";

type Decision = {
  id: string;
  reference: string;
  title: string;
  decisionText: string;
  decidedAt: Date;
  method: DecisionMethod;
  voteRequestedBy: string | null;
  voteRequestedReason: string | null;
  votesFor: number | null;
  votesAgainst: number | null;
  votesAbstained: number | null;
};

type AgendaItem = {
  id: string;
  sortOrder: number;
  title: string;
};

const methodLabels: Record<DecisionMethod, string> = {
  ACCLAMATION: "Acklamation",
  ROLL_CALL: "Votering (namnupprop)",
  COUNTED: "Votering (räknade röster)",
};

const methodColors: Record<DecisionMethod, string> = {
  ACCLAMATION: "bg-green-100 text-green-700",
  ROLL_CALL: "bg-blue-100 text-blue-700",
  COUNTED: "bg-purple-100 text-purple-700",
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
    method: "ACCLAMATION" as DecisionMethod,
    voteRequestedBy: "",
    voteRequestedReason: "",
    votesFor: "",
    votesAgainst: "",
    votesAbstained: "",
  });

  const createDecision = trpc.decision.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setForm({
        title: "", description: "", decisionText: "", agendaItemId: "",
        method: "ACCLAMATION", voteRequestedBy: "", voteRequestedReason: "",
        votesFor: "", votesAgainst: "", votesAbstained: "",
      });
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
      method: form.method,
      voteRequestedBy: form.voteRequestedBy || undefined,
      voteRequestedReason: form.voteRequestedReason || undefined,
      votesFor: form.votesFor ? parseInt(form.votesFor) : undefined,
      votesAgainst: form.votesAgainst ? parseInt(form.votesAgainst) : undefined,
      votesAbstained: form.votesAbstained ? parseInt(form.votesAbstained) : undefined,
    });
  }

  const isVotering = form.method !== "ACCLAMATION";
  const isCounted = form.method === "COUNTED";

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
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-600">
                    {decision.reference}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {decision.title}
                  </h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", methodColors[decision.method])}>
                    {methodLabels[decision.method]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                  {decision.decisionText}
                </p>

                {/* Votering details */}
                {decision.method !== "ACCLAMATION" && (
                  <div className="mt-3 space-y-2">
                    {decision.voteRequestedBy && (
                      <div className="rounded-md bg-amber-50 p-2 text-xs text-amber-700">
                        <span className="font-medium">Votering begärd av:</span> {decision.voteRequestedBy}
                        {decision.voteRequestedReason && (
                          <span> — {decision.voteRequestedReason}</span>
                        )}
                      </div>
                    )}
                    {decision.method === "COUNTED" &&
                      decision.votesFor !== null && (
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1 text-green-700">
                            <Vote className="h-3.5 w-3.5" />
                            Ja: {decision.votesFor}
                          </span>
                          <span className="text-red-700">
                            Nej: {decision.votesAgainst ?? 0}
                          </span>
                          <span className="text-gray-500">
                            Avstår: {decision.votesAbstained ?? 0}
                          </span>
                        </div>
                      )}
                  </div>
                )}
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
                Bakgrund *
              </label>
              <textarea
                rows={2}
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

            {/* Beslutsmetod */}
            <div className="rounded-md border border-gray-200 bg-white p-3 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Beslutsmetod *
                </label>
                <select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as DecisionMethod }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ACCLAMATION">Acklamation (enkel majoritet)</option>
                  <option value="ROLL_CALL">Votering med namnupprop (individuella röster)</option>
                  <option value="COUNTED">Votering med räknade röster</option>
                </select>
              </div>

              {isVotering && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Votering begärd av
                      </label>
                      <input
                        type="text"
                        value={form.voteRequestedBy}
                        onChange={(e) => setForm((f) => ({ ...f, voteRequestedBy: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Namn"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Anledning
                      </label>
                      <input
                        type="text"
                        value={form.voteRequestedReason}
                        onChange={(e) => setForm((f) => ({ ...f, voteRequestedReason: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Varför votering begärdes"
                      />
                    </div>
                  </div>

                  {isCounted && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-green-700">
                          Röster för
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.votesFor}
                          onChange={(e) => setForm((f) => ({ ...f, votesFor: e.target.value }))}
                          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-red-700">
                          Röster emot
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.votesAgainst}
                          onChange={(e) => setForm((f) => ({ ...f, votesAgainst: e.target.value }))}
                          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Avstår
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.votesAbstained}
                          onChange={(e) => setForm((f) => ({ ...f, votesAbstained: e.target.value }))}
                          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {form.method === "ROLL_CALL" && (
                    <p className="text-xs text-gray-500 italic">
                      Individuella röster kan dokumenteras efter att beslutet skapats.
                    </p>
                  )}
                </>
              )}
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
