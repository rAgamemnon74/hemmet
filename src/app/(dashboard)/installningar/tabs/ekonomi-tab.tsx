"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function EkonomiTab() {
  const settingsQuery = trpc.settings.get.useQuery();
  const update = trpc.settings.update.useMutation({
    onSuccess: () => settingsQuery.refetch(),
  });

  const [form, setForm] = useState({
    fiscalYearStart: 1, fiscalYearEnd: 12,
    bankgiro: "", plusgiro: "", bankAccount: "", swish: "",
    vatRegistered: false, fTax: false,
    propertyManager: "", insuranceCompany: "", insurancePolicy: "",
  });

  useEffect(() => {
    if (settingsQuery.data) {
      const s = settingsQuery.data;
      setForm({
        fiscalYearStart: s.fiscalYearStart, fiscalYearEnd: s.fiscalYearEnd,
        bankgiro: s.bankgiro ?? "", plusgiro: s.plusgiro ?? "",
        bankAccount: s.bankAccount ?? "", swish: s.swish ?? "",
        vatRegistered: s.vatRegistered, fTax: s.fTax,
        propertyManager: s.propertyManager ?? "",
        insuranceCompany: s.insuranceCompany ?? "", insurancePolicy: s.insurancePolicy ?? "",
      });
    }
  }, [settingsQuery.data]);

  if (settingsQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;

  function handleSave() {
    update.mutate({
      fiscalYearStart: form.fiscalYearStart, fiscalYearEnd: form.fiscalYearEnd,
      bankgiro: form.bankgiro || null, plusgiro: form.plusgiro || null,
      bankAccount: form.bankAccount || null, swish: form.swish || null,
      vatRegistered: form.vatRegistered, fTax: form.fTax,
      propertyManager: form.propertyManager || null,
      insuranceCompany: form.insuranceCompany || null, insurancePolicy: form.insurancePolicy || null,
    });
  }

  const months = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Räkenskapsår</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Startmånad</label>
            <select value={form.fiscalYearStart} onChange={(e) => setForm((f) => ({ ...f, fiscalYearStart: parseInt(e.target.value) }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slutmånad</label>
            <select value={form.fiscalYearEnd} onChange={(e) => setForm((f) => ({ ...f, fiscalYearEnd: parseInt(e.target.value) }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Betalning</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Bankgiro</label>
            <input value={form.bankgiro} onChange={(e) => setForm((f) => ({ ...f, bankgiro: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Plusgiro</label>
            <input value={form.plusgiro} onChange={(e) => setForm((f) => ({ ...f, plusgiro: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Bankkonto / IBAN</label>
            <input value={form.bankAccount} onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Swish</label>
            <input value={form.swish} onChange={(e) => setForm((f) => ({ ...f, swish: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
        </div>
        <div className="mt-4 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.vatRegistered} onChange={(e) => setForm((f) => ({ ...f, vatRegistered: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            Momsregistrerad
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.fTax} onChange={(e) => setForm((f) => ({ ...f, fTax: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            F-skattsedel
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Förvaltning & försäkring</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Fastighetsförvaltare</label>
            <input value={form.propertyManager} onChange={(e) => setForm((f) => ({ ...f, propertyManager: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Försäkringsbolag</label>
            <input value={form.insuranceCompany} onChange={(e) => setForm((f) => ({ ...f, insuranceCompany: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Policynummer</label>
            <input value={form.insurancePolicy} onChange={(e) => setForm((f) => ({ ...f, insurancePolicy: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={update.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          <Save className="h-4 w-4" />
          {update.isPending ? "Sparar..." : "Spara"}
        </button>
      </div>
    </div>
  );
}
