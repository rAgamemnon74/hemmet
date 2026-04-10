"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { getTemplate } from "@/lib/agenda-templates";

const typeLabels = {
  BOARD: "Styrelsemöte",
  ANNUAL: "Årsmöte",
  EXTRAORDINARY: "Extra stämma",
};

export default function NewMeetingPage() {
  const router = useRouter();
  const createMeeting = trpc.meeting.create.useMutation({
    onSuccess: (meeting) => {
      router.push(`/styrelse/moten/${meeting.id}`);
    },
  });

  const [form, setForm] = useState({
    title: "",
    type: "BOARD" as "BOARD" | "ANNUAL" | "EXTRAORDINARY",
    scheduledAt: "",
    location: "",
    description: "",
    useTemplate: true,
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMeeting.mutate({
      title: form.title,
      type: form.type,
      scheduledAt: new Date(form.scheduledAt),
      location: form.location || undefined,
      description: form.description || undefined,
      useTemplate: form.useTemplate,
    });
  }

  const template = getTemplate(form.type);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/styrelse/moten"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till möten
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Nytt möte</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        {createMeeting.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {createMeeting.error.message}
          </div>
        )}

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
            Titel *
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="t.ex. Styrelsemöte mars 2026"
          />
        </div>

        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">
            Typ *
          </label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="BOARD">Styrelsemöte</option>
            <option value="ANNUAL">Årsmöte</option>
            <option value="EXTRAORDINARY">Extra stämma</option>
          </select>
        </div>

        <div>
          <label htmlFor="scheduledAt" className="mb-1 block text-sm font-medium text-gray-700">
            Datum och tid *
          </label>
          <input
            id="scheduledAt"
            type="datetime-local"
            required
            value={form.scheduledAt}
            onChange={(e) => updateField("scheduledAt", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
            Plats
          </label>
          <input
            id="location"
            type="text"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="t.ex. Föreningslokalen"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Beskrivning
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Template toggle */}
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.useTemplate}
              onChange={(e) => setForm((f) => ({ ...f, useTemplate: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <ListChecks className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Använd standardmall för {typeLabels[form.type].toLowerCase()}
            </span>
          </label>

          {form.useTemplate && template.length > 0 && (
            <div className="mt-3 ml-6 space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                {template.length} dagordningspunkter skapas automatiskt:
              </p>
              {template.map((item, i) => (
                <div key={i} className="flex items-baseline gap-2 text-xs text-gray-600">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <span>{item.title}</span>
                  {item.duration && (
                    <span className="text-gray-400">({item.duration} min)</span>
                  )}
                </div>
              ))}
              <p className="mt-2 text-xs text-gray-400 italic">
                Du kan redigera, lägga till och ta bort punkter efter att mötet skapats.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/styrelse/moten"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={createMeeting.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {createMeeting.isPending ? "Skapar..." : "Skapa möte"}
          </button>
        </div>
      </form>
    </div>
  );
}
