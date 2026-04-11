"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRightLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = {
  SALE: "Försäljning (via mäklare)",
  PRIVATE_SALE: "Privataffär",
  INHERITANCE: "Arv",
  DIVORCE_SETTLEMENT: "Bodelning",
  GIFT: "Gåva",
  FORCED_SALE: "Exekutiv försäljning (Kronofogden)",
  SHARE_CHANGE: "Andelsändring",
};

export default function NewTransferPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    apartmentId: "", type: "SALE" as string, accessDate: "",
    contractDate: "", transferPrice: "",
    externalContactName: "", externalContactEmail: "", externalContactPhone: "",
  });

  const apartmentsQuery = trpc.member.getApartments.useQuery();
  const create = trpc.transfer.create.useMutation({
    onSuccess: (data) => router.push(`/styrelse/overlatelser/${data.id}`),
  });

  const apartments = apartmentsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/styrelse/overlatelser" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Tillbaka
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ArrowRightLeft className="h-6 w-6 text-blue-600" /> Nytt överlåtelseärende
      </h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Lägenhet</label>
          <select value={form.apartmentId} onChange={(e) => setForm((f) => ({ ...f, apartmentId: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">Välj lägenhet...</option>
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>{a.building?.name}, lgh {a.number}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">Typ av överlåtelse</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Kontraktsdatum</label>
            <input type="date" value={form.contractDate} onChange={(e) => setForm((f) => ({ ...f, contractDate: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Tillträdesdag</label>
            <input type="date" value={form.accessDate} onChange={(e) => setForm((f) => ({ ...f, accessDate: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
        </div>

        {["SALE", "PRIVATE_SALE", "FORCED_SALE"].includes(form.type) && (
          <div>
            <label className="text-xs font-medium text-gray-500">Köpesumma (kr)</label>
            <input type="number" value={form.transferPrice} onChange={(e) => setForm((f) => ({ ...f, transferPrice: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Extern kontakt (mäklare, jurist, etc.)</h3>
          <div className="space-y-3">
            <input type="text" value={form.externalContactName} onChange={(e) => setForm((f) => ({ ...f, externalContactName: e.target.value }))}
              placeholder="Namn" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input type="email" value={form.externalContactEmail} onChange={(e) => setForm((f) => ({ ...f, externalContactEmail: e.target.value }))}
                placeholder="E-post" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              <input type="tel" value={form.externalContactPhone} onChange={(e) => setForm((f) => ({ ...f, externalContactPhone: e.target.value }))}
                placeholder="Telefon" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => create.mutate({
            apartmentId: form.apartmentId,
            type: form.type as never,
            accessDate: form.accessDate ? new Date(form.accessDate) : undefined,
            contractDate: form.contractDate ? new Date(form.contractDate) : undefined,
            transferPrice: form.transferPrice ? parseFloat(form.transferPrice) : undefined,
            externalContactName: form.externalContactName || undefined,
            externalContactEmail: form.externalContactEmail || undefined,
            externalContactPhone: form.externalContactPhone || undefined,
          })} disabled={create.isPending || !form.apartmentId}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skapa ärende"}
          </button>
          <Link href="/styrelse/overlatelser"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Avbryt
          </Link>
        </div>
        {create.error && <p className="text-sm text-red-600">{create.error.message}</p>}
      </div>
    </div>
  );
}
