"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function NewAnnualReportPage() {
  const router = useRouter();
  const create = trpc.annualReport.create.useMutation({
    onSuccess: (report) => router.push(`/styrelse/arsberattelse/${report.id}`),
  });

  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    fiscalYear: `${currentYear - 1}`,
    title: `Årsberättelse ${currentYear - 1}`,
    boardMembers: "",
    activities: "",
    maintenance: "",
    economy: "",
    futureOutlook: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      fiscalYear: form.fiscalYear,
      title: form.title,
      boardMembers: form.boardMembers,
      activities: form.activities,
      maintenance: form.maintenance || undefined,
      economy: form.economy || undefined,
      futureOutlook: form.futureOutlook || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/styrelse/arsberattelse"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Ny årsberättelse</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        {create.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {create.error.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Räkenskapsår *</label>
            <input
              type="text"
              required
              value={form.fiscalYear}
              onChange={(e) => setForm((f) => ({ ...f, fiscalYear: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="2025"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Titel *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Styrelsens sammansättning *</label>
          <textarea
            rows={4}
            required
            value={form.boardMembers}
            onChange={(e) => setForm((f) => ({ ...f, boardMembers: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ordförande: Anna Andersson&#10;Sekreterare: Diana Davidsson&#10;Kassör: Bengt Bengtsson&#10;..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Verksamhetsberättelse *</label>
          <textarea
            rows={8}
            required
            value={form.activities}
            onChange={(e) => setForm((f) => ({ ...f, activities: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Under året har styrelsen haft X protokollförda sammanträden..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Underhåll och förvaltning</label>
          <textarea
            rows={4}
            value={form.maintenance}
            onChange={(e) => setForm((f) => ({ ...f, maintenance: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Ekonomisk översikt</label>
          <textarea
            rows={4}
            value={form.economy}
            onChange={(e) => setForm((f) => ({ ...f, economy: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Framtida planer</label>
          <textarea
            rows={4}
            value={form.futureOutlook}
            onChange={(e) => setForm((f) => ({ ...f, futureOutlook: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/styrelse/arsberattelse"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? "Skapar..." : "Skapa årsberättelse"}
          </button>
        </div>
      </form>
    </div>
  );
}
