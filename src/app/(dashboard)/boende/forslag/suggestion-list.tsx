"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { ReportStatus } from "@prisma/client";

type Suggestion = {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  response: string | null;
  createdAt: Date;
  author: { id: string; firstName: string; lastName: string };
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

export function SuggestionList({ initialData }: { initialData: Suggestion[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const create = trpc.suggestion.create.useMutation({
    onSuccess: (s) => router.push(`/boende/forslag/${s.id}`),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Förslag</h1>
          <p className="mt-1 text-sm text-gray-500">Lämna förbättringsförslag till styrelsen</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nytt förslag
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
            placeholder="Beskriv ditt förslag *"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Avbryt
            </button>
            <button type="submit" disabled={create.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {create.isPending ? "Skickar..." : "Skicka förslag"}
            </button>
          </div>
        </form>
      )}

      {initialData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga förslag</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {initialData.map((s) => (
            <Link
              key={s.id}
              href={`/boende/forslag/${s.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[s.status])}>
                      {statusLabels[s.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{s.description}</p>
                  <span className="mt-2 inline-block text-xs text-gray-400">
                    {s.author.firstName} {s.author.lastName}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {format(new Date(s.createdAt), "d MMM yyyy", { locale: sv })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
