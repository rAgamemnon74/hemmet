"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, GripVertical, Trash2, Clock, Vote } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { MeetingStatus } from "@prisma/client";

type AgendaItem = {
  id: string;
  sortOrder: number;
  title: string;
  description: string | null;
  duration: number | null;
  presenter: string | null;
  voteType: string | null;
  votes: Array<{
    id: string;
    choice: string;
    user: { id: string; firstName: string; lastName: string };
  }>;
  decisions: Array<{ id: string; reference: string; title: string }>;
};

export function AgendaTab({
  meetingId,
  meetingStatus,
  agendaItems,
  canEdit,
}: {
  meetingId: string;
  meetingStatus: MeetingStatus;
  agendaItems: AgendaItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDuration, setNewDuration] = useState("");

  const createItem = trpc.agenda.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setNewTitle("");
      setNewDescription("");
      setNewDuration("");
      router.refresh();
    },
  });

  const deleteItem = trpc.agenda.delete.useMutation({
    onSuccess: () => router.refresh(),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    createItem.mutate({
      meetingId,
      title: newTitle,
      description: newDescription || undefined,
      duration: newDuration ? parseInt(newDuration) : undefined,
    });
  }

  const isEditable = canEdit && (meetingStatus === "DRAFT" || meetingStatus === "SCHEDULED");
  const totalDuration = agendaItems.reduce((sum, item) => sum + (item.duration ?? 0), 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {agendaItems.length} punkter
          {totalDuration > 0 && ` — ca ${totalDuration} min`}
        </div>
        {isEditable && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Lägg till punkt
          </button>
        )}
      </div>

      {agendaItems.length === 0 && !showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Ingen dagordning ännu.</p>
        </div>
      )}

      <div className="space-y-2">
        {agendaItems.map((item, index) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start gap-3">
              {isEditable && (
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-medium text-gray-900">
                    {item.title}
                  </h3>
                  {item.duration && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {item.duration} min
                    </span>
                  )}
                  {item.voteType && (
                    <span className="flex items-center gap-0.5 text-xs text-blue-500">
                      <Vote className="h-3 w-3" />
                      Omröstning
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 pl-8 text-sm text-gray-500">
                    {item.description}
                  </p>
                )}
                {item.votes.length > 0 && (
                  <div className="mt-2 pl-8 flex gap-3 text-xs">
                    <span className="text-green-600">
                      Ja: {item.votes.filter((v) => v.choice === "YES").length}
                    </span>
                    <span className="text-red-600">
                      Nej: {item.votes.filter((v) => v.choice === "NO").length}
                    </span>
                    <span className="text-gray-500">
                      Avstår: {item.votes.filter((v) => v.choice === "ABSTAIN").length}
                    </span>
                  </div>
                )}
                {item.decisions.length > 0 && (
                  <div className="mt-2 pl-8">
                    {item.decisions.map((d) => (
                      <span
                        key={d.id}
                        className="inline-flex items-center rounded bg-green-50 px-2 py-0.5 text-xs text-green-700"
                      >
                        {d.reference}: {d.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {isEditable && (
                <button
                  onClick={() => deleteItem.mutate({ id: item.id })}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Ta bort"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4"
        >
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Titel *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="t.ex. Genomgång av ekonomi"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Beskrivning
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tid (min)
              </label>
              <input
                type="number"
                min={1}
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              disabled={createItem.isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createItem.isPending ? "Lägger till..." : "Lägg till"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
