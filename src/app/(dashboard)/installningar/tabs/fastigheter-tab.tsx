"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function FastigheterTab() {
  const router = useRouter();
  const buildingsQuery = trpc.settings.listBuildings.useQuery();
  const createBuilding = trpc.settings.createBuilding.useMutation({ onSuccess: () => buildingsQuery.refetch() });
  const deleteBuilding = trpc.settings.deleteBuilding.useMutation({ onSuccess: () => buildingsQuery.refetch() });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", city: "", postalCode: "",
    propertyDesignation: "", constructionYear: "", totalArea: "", heatingType: "", energyRating: "",
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createBuilding.mutate({
      name: form.name, address: form.address,
      city: form.city || undefined, postalCode: form.postalCode || undefined,
      propertyDesignation: form.propertyDesignation || undefined,
      constructionYear: form.constructionYear ? parseInt(form.constructionYear) : undefined,
      totalArea: form.totalArea ? parseFloat(form.totalArea) : undefined,
      heatingType: form.heatingType || undefined, energyRating: form.energyRating || undefined,
    });
    setShowForm(false);
    setForm({ name: "", address: "", city: "", postalCode: "", propertyDesignation: "", constructionYear: "", totalArea: "", heatingType: "", energyRating: "" });
  }

  if (buildingsQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;
  const buildings = buildingsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Fastigheter ({buildings.length})</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Lägg till fastighet
          </button>
        )}
      </div>

      {buildings.map((b) => (
        <div key={b.id} className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">{b.name}</h3>
              </div>
              <p className="mt-1 text-sm text-gray-600">{b.address}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                {b.propertyDesignation && <span>Fastighet: {b.propertyDesignation}</span>}
                {b.constructionYear && <span>Byggt: {b.constructionYear}</span>}
                {b.totalArea && <span>{b.totalArea} kvm</span>}
                {b.heatingType && <span>{b.heatingType}</span>}
                {b.energyRating && <span>Energi: {b.energyRating}</span>}
                <span>{b._count.apartments} lägenheter</span>
              </div>
            </div>
            <button onClick={() => deleteBuilding.mutate({ id: b.id })}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Ta bort">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-blue-200 bg-blue-50/50 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Ny fastighet</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Namn *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="t.ex. Hus A" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Adress *</label>
              <input required value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Fastighetsbeteckning</label>
              <input value={form.propertyDesignation} onChange={(e) => setForm((f) => ({ ...f, propertyDesignation: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Stockholm Solbacken 1:5" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Byggnadsår</label>
              <input type="number" value={form.constructionYear} onChange={(e) => setForm((f) => ({ ...f, constructionYear: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Total yta (kvm)</label>
              <input type="number" value={form.totalArea} onChange={(e) => setForm((f) => ({ ...f, totalArea: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-xs font-medium text-gray-600">Uppvärmning</label>
              <input value={form.heatingType} onChange={(e) => setForm((f) => ({ ...f, heatingType: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Fjärrvärme" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
            <button type="submit" disabled={createBuilding.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {createBuilding.isPending ? "Skapar..." : "Skapa"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
