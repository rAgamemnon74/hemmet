"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function GrunddataTab() {
  const settingsQuery = trpc.settings.get.useQuery();
  const update = trpc.settings.update.useMutation({
    onSuccess: () => settingsQuery.refetch(),
  });

  const [form, setForm] = useState({
    name: "", orgNumber: "", seat: "", signatoryRule: "", signatories: "",
    address: "", city: "", postalCode: "",
    phone: "", email: "", website: "",
  });

  useEffect(() => {
    if (settingsQuery.data) {
      const s = settingsQuery.data;
      setForm({
        name: s.name, orgNumber: s.orgNumber, seat: s.seat ?? "",
        signatoryRule: s.signatoryRule ?? "", signatories: s.signatories ?? "",
        address: s.address, city: s.city, postalCode: s.postalCode,
        phone: s.phone ?? "", email: s.email ?? "", website: s.website ?? "",
      });
    }
  }, [settingsQuery.data]);

  if (settingsQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;

  function handleSave() {
    update.mutate({
      name: form.name, orgNumber: form.orgNumber,
      seat: form.seat || null, signatoryRule: form.signatoryRule || null,
      signatories: form.signatories || null,
      address: form.address, city: form.city, postalCode: form.postalCode,
      phone: form.phone || null, email: form.email || null, website: form.website || null,
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Föreningsuppgifter</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Föreningens namn *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field label="Organisationsnummer" value={form.orgNumber} onChange={(v) => setForm((f) => ({ ...f, orgNumber: v }))} />
          <Field label="Säte (kommun)" value={form.seat} onChange={(v) => setForm((f) => ({ ...f, seat: v }))} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Adress</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Adress" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
          </div>
          <Field label="Stad" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
          <Field label="Postnummer" value={form.postalCode} onChange={(v) => setForm((f) => ({ ...f, postalCode: v }))} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontakt</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefon" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <Field label="E-post" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" />
          <Field label="Webbplats" value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Firmateckning</h2>
        <div className="space-y-4">
          <Field label="Firmateckningsregel" value={form.signatoryRule} onChange={(v) => setForm((f) => ({ ...f, signatoryRule: v }))} placeholder='t.ex. "Ordförande och kassör i förening"' />
          <Field label="Nuvarande firmatecknare" value={form.signatories} onChange={(v) => setForm((f) => ({ ...f, signatories: v }))} />
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

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}
