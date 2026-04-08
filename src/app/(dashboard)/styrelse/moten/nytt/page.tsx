"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

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
    });
  }

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
