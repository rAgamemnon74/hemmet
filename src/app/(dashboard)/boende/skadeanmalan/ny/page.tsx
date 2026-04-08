"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DAMAGE_LOCATIONS } from "@/lib/validators/damage-report";
import type { Severity } from "@prisma/client";

export default function NewDamageReportPage() {
  const router = useRouter();
  const createReport = trpc.damageReport.create.useMutation({
    onSuccess: (report) => router.push(`/boende/skadeanmalan/${report.id}`),
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: DAMAGE_LOCATIONS[0] as string,
    severity: "NORMAL" as Severity,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createReport.mutate({
      title: form.title,
      description: form.description,
      location: form.location,
      severity: form.severity,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/boende/skadeanmalan"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till felanmälningar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Ny felanmälan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        {createReport.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {createReport.error.message}
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
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="t.ex. Trasig lampa i trapphus B"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Beskrivning *
          </label>
          <textarea
            id="description"
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Beskriv felet i detalj..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
              Plats *
            </label>
            <select
              id="location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DAMAGE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="severity" className="mb-1 block text-sm font-medium text-gray-700">
              Allvarlighetsgrad
            </label>
            <select
              id="severity"
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Severity }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="LOW">Låg — kosmetiskt</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Hög — påverkar funktion</option>
              <option value="CRITICAL">Kritisk — akut åtgärd</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/boende/skadeanmalan"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={createReport.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {createReport.isPending ? "Skickar..." : "Skicka felanmälan"}
          </button>
        </div>
      </form>
    </div>
  );
}
