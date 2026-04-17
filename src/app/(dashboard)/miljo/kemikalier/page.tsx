"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { Loader2, FlaskConical, Plus, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChemicalItem {
  id: string;
  productName: string;
  manufacturer: string | null;
  hazardClasses: string[];
  usageArea: string | null;
  storageLocation: string | null;
  safetyDataSheetUrl: string | null;
  active: boolean;
  lastVerifiedAt: Date | string | null;
  annualQuantity: string | null;
}

const HAZARD_CLASSES = [
  "FLAMMABLE", "TOXIC", "CORROSIVE", "OXIDIZING",
  "ENVIRONMENTAL", "HEALTH_HAZARD", "OTHER",
] as const;

type HazardClass = (typeof HAZARD_CLASSES)[number];

const hazardBadgeColor: Record<HazardClass, string> = {
  FLAMMABLE: "bg-red-100 text-red-700",
  TOXIC: "bg-purple-100 text-purple-700",
  CORROSIVE: "bg-orange-100 text-orange-700",
  OXIDIZING: "bg-yellow-100 text-yellow-700",
  ENVIRONMENTAL: "bg-green-100 text-green-700",
  HEALTH_HAZARD: "bg-red-100 text-red-700",
  OTHER: "bg-gray-100 text-gray-700",
};

const hazardLabel: Record<HazardClass, string> = {
  FLAMMABLE: "Brandfarlig",
  TOXIC: "Giftig",
  CORROSIVE: "Frätande",
  OXIDIZING: "Oxiderande",
  ENVIRONMENTAL: "Miljöfarlig",
  HEALTH_HAZARD: "Hälsofarlig",
  OTHER: "Övrig",
};

export default function KemikalierPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canManage = hasPermission(userRoles, "environment:manage");

  const [showActive, setShowActive] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const utils = trpc.useUtils();
  const chemicalsQuery = trpc.environment.listChemicals.useQuery({ active: showActive });
  const createMutation = trpc.environment.createChemical.useMutation({
    onSuccess: () => {
      utils.environment.listChemicals.invalidate();
      setShowForm(false);
      resetForm();
    },
  });

  const [form, setForm] = useState({
    productName: "",
    manufacturer: "",
    hazardClasses: [] as HazardClass[],
    usageArea: "",
    storageLocation: "",
    annualQuantity: "",
    safetyDataSheetUrl: "",
  });

  function resetForm() {
    setForm({
      productName: "", manufacturer: "", hazardClasses: [],
      usageArea: "", storageLocation: "", annualQuantity: "", safetyDataSheetUrl: "",
    });
  }

  function toggleHazardClass(hc: HazardClass) {
    setForm((prev) => ({
      ...prev,
      hazardClasses: prev.hazardClasses.includes(hc)
        ? prev.hazardClasses.filter((c) => c !== hc)
        : [...prev.hazardClasses, hc],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      productName: form.productName,
      manufacturer: form.manufacturer || undefined,
      hazardClasses: form.hazardClasses,
      usageArea: form.usageArea || undefined,
      storageLocation: form.storageLocation || undefined,
      annualQuantity: form.annualQuantity || undefined,
      safetyDataSheetUrl: form.safetyDataSheetUrl || undefined,
    });
  }

  if (chemicalsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  const chemicals = (chemicalsQuery.data ?? []) as ChemicalItem[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Kemikalieforteckning</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Active/inactive toggle */}
          <div className="flex rounded-md border border-gray-200 text-sm">
            <button
              onClick={() => setShowActive(true)}
              className={cn(
                "px-3 py-1.5 rounded-l-md",
                showActive ? "bg-green-50 text-green-700 font-medium" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              Aktiva
            </button>
            <button
              onClick={() => setShowActive(false)}
              className={cn(
                "px-3 py-1.5 rounded-r-md border-l border-gray-200",
                !showActive ? "bg-gray-100 text-gray-700 font-medium" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              Inaktiva
            </button>
          </div>
          {canManage && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              {showForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              Lagg till kemikalie
            </button>
          )}
        </div>
      </div>

      {/* Inline add form */}
      {showForm && canManage && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-green-200 bg-green-50/30 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Ny kemikalie</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Produktnamn *</label>
              <input
                type="text"
                required
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tillverkare</label>
              <input
                type="text"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Anvandningsomrade</label>
              <input
                type="text"
                value={form.usageArea}
                onChange={(e) => setForm({ ...form, usageArea: e.target.value })}
                placeholder="T.ex. Tvattstuga, Tradgard, VVS"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Forvaringsplats</label>
              <input
                type="text"
                value={form.storageLocation}
                onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Arlig mangd</label>
              <input
                type="text"
                value={form.annualQuantity}
                onChange={(e) => setForm({ ...form, annualQuantity: e.target.value })}
                placeholder="T.ex. 5 liter"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sakerhetsblad (URL)</label>
              <input
                type="url"
                value={form.safetyDataSheetUrl}
                onChange={(e) => setForm({ ...form, safetyDataSheetUrl: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Faroklasser</label>
            <div className="flex flex-wrap gap-2">
              {HAZARD_CLASSES.map((hc) => (
                <label key={hc} className="inline-flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.hazardClasses.includes(hc)}
                    onChange={() => toggleHazardClass(hc)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", hazardBadgeColor[hc])}>
                    {hazardLabel[hc]}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Spara
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-600">{createMutation.error.message}</p>
          )}
        </form>
      )}

      {/* Table */}
      {chemicals.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <FlaskConical className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            {showActive ? "Inga aktiva kemikalier registrerade" : "Inga inaktiva kemikalier"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tillverkare</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faroklasser</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anvandning</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forvaring</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verifierad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chemicals.map((chem) => (
                  <tr key={chem.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-1.5">
                        {chem.productName}
                        {chem.safetyDataSheetUrl && (
                          <a href={chem.safetyDataSheetUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{chem.manufacturer ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(chem.hazardClasses as HazardClass[]).map((hc) => (
                          <span key={hc} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", hazardBadgeColor[hc])}>
                            {hazardLabel[hc]}
                          </span>
                        ))}
                        {(chem.hazardClasses as HazardClass[]).length === 0 && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{chem.usageArea ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{chem.storageLocation ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        chem.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {chem.active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {chem.lastVerifiedAt
                        ? format(new Date(chem.lastVerifiedAt), "d MMM yyyy", { locale: sv })
                        : <span className="text-amber-500">Ej verifierad</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
