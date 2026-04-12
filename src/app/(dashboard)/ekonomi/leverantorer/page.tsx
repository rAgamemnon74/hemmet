"use client";

import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Users, Shield, AlertTriangle, Plus, ChevronDown, ChevronRight,
  Phone, Mail, Globe, MapPin, Star, CheckCircle, CreditCard,
  Loader2, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const categoryLabels: Record<string, string> = {
  PLUMBER: "VVS", ELECTRICIAN: "El", LOCKSMITH: "Lås", PAINTER: "Målare",
  CLEANING: "Städ", ELEVATOR: "Hiss", GARDENING: "Trädgård", SNOW: "Snöröjning",
  SECURITY: "Larm/bevakning", HVAC: "Ventilation", ROOFING: "Tak",
  INSURANCE: "Försäkring", ACCOUNTING: "Ekonomi/Revision", TELECOM: "Bredband/Tele",
  CONSULTING: "Konsult", OTHER: "Övrigt",
};

const categoryColors: Record<string, string> = {
  PLUMBER: "bg-blue-100 text-blue-700", ELECTRICIAN: "bg-amber-100 text-amber-700",
  LOCKSMITH: "bg-gray-100 text-gray-700", PAINTER: "bg-orange-100 text-orange-700",
  CLEANING: "bg-green-100 text-green-700", ELEVATOR: "bg-purple-100 text-purple-700",
  GARDENING: "bg-emerald-100 text-emerald-700", SNOW: "bg-cyan-100 text-cyan-700",
  SECURITY: "bg-red-100 text-red-700", HVAC: "bg-teal-100 text-teal-700",
  ROOFING: "bg-stone-100 text-stone-700", INSURANCE: "bg-indigo-100 text-indigo-700",
  ACCOUNTING: "bg-violet-100 text-violet-700", TELECOM: "bg-sky-100 text-sky-700",
  CONSULTING: "bg-fuchsia-100 text-fuchsia-700", OTHER: "bg-gray-100 text-gray-600",
};

const CATEGORIES = Object.keys(categoryLabels);
const now = new Date();

export default function ContractorsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "PLUMBER", orgNumber: "", contactPerson: "",
    phone: "", email: "", fTax: false, bankgiro: "", notes: "",
  });

  const contractorsQuery = trpc.contractor.list.useQuery();
  const createMutation = trpc.contractor.create.useMutation({
    onSuccess: () => { setShowForm(false); setForm({ name: "", category: "PLUMBER", orgNumber: "", contactPerson: "", phone: "", email: "", fTax: false, bankgiro: "", notes: "" }); contractorsQuery.refetch(); },
  });

  if (contractorsQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const contractors = contractorsQuery.data ?? [];
  const filtered = categoryFilter ? contractors.filter((c) => c.category === categoryFilter) : contractors;
  const categories = [...new Set(contractors.map((c) => c.category))];

  const warnings = contractors.filter((c) => c.active && (
    !c.fTax ||
    !c.insuranceCoverage ||
    (c.insuranceExpiry && new Date(c.insuranceExpiry) < now) ||
    (!c.pubAgreement && ["CLEANING", "ACCOUNTING", "SECURITY", "ELEVATOR", "TELECOM"].includes(c.category))
  ));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> Leverantörer
          </h1>
          <p className="mt-1 text-sm text-gray-500">{contractors.length} aktiva leverantörer</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Ny leverantör
          </button>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> {warnings.length} leverantörer kräver uppmärksamhet
          </p>
          <div className="mt-1.5 space-y-0.5">
            {warnings.map((c) => (
              <p key={c.id} className="text-xs text-amber-700">
                {c.name}:
                {!c.fTax && " F-skatt saknas"}
                {!c.insuranceCoverage && " Försäkring saknas"}
                {c.insuranceExpiry && new Date(c.insuranceExpiry) < now && " Försäkring utgången"}
                {!c.pubAgreement && ["CLEANING", "ACCOUNTING", "SECURITY", "ELEVATOR", "TELECOM"].includes(c.category) && " PUB-avtal saknas"}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Ny leverantör</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Namn *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Kategori *</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{categoryLabels[cat]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Org.nr</label>
              <input type="text" value={form.orgNumber} onChange={(e) => setForm((f) => ({ ...f, orgNumber: e.target.value }))}
                placeholder="556XXX-XXXX" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Kontaktperson</label>
              <input type="text" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Telefon</label>
              <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">E-post</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Bankgiro</label>
              <input type="text" value={form.bankgiro} onChange={(e) => setForm((f) => ({ ...f, bankgiro: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.fTax} onChange={(e) => setForm((f) => ({ ...f, fTax: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600" /> F-skattsedel
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Notering</label>
            <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Intern notering" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate({
              name: form.name, category: form.category,
              orgNumber: form.orgNumber || undefined, contactPerson: form.contactPerson || undefined,
              phone: form.phone || undefined, email: form.email || undefined,
              bankgiro: form.bankgiro || undefined, fTax: form.fTax, notes: form.notes || undefined,
            })} disabled={createMutation.isPending || !form.name}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Spara
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
          </div>
          {createMutation.error && <p className="text-sm text-red-600">{createMutation.error.message}</p>}
        </div>
      )}

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setCategoryFilter(null)}
          className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !categoryFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
          Alla ({contractors.length})
        </button>
        {categories.map((cat) => {
          const count = contractors.filter((c) => c.category === cat).length;
          return (
            <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
                categoryFilter === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {categoryLabels[cat] ?? cat} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga leverantörer</h3>
          <p className="mt-1 text-sm text-gray-500">Lägg till den första leverantören.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const hasWarning = !c.fTax || !c.insuranceCoverage || (c.insuranceExpiry && new Date(c.insuranceExpiry) < now);
            const expanded = expandedId === c.id;
            return (
              <div key={c.id} className={cn("rounded-lg border bg-white overflow-hidden", hasWarning ? "border-amber-200" : "border-gray-200")}>
                <button onClick={() => setExpandedId(expanded ? null : c.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {expanded ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[c.category] ?? categoryColors.OTHER)}>
                            {categoryLabels[c.category] ?? c.category}
                          </span>
                          {c.pubAgreement && (
                            <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-xs text-green-600 flex items-center gap-0.5">
                              <Shield className="h-3 w-3" /> PUB
                            </span>
                          )}
                          {c.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-500">
                              <Star className="h-3 w-3 fill-amber-400" /> {c.rating}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                          {c.contactPerson && <span>{c.contactPerson}</span>}
                          {c.orgNumber && <span className="text-gray-400">{c.orgNumber}</span>}
                          {c._count.contracts > 0 && <span>{c._count.contracts} avtal</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!c.fTax && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" /> F-skatt
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Kontakt</h4>
                        {c.phone && <p className="flex items-center gap-1.5 text-gray-700"><Phone className="h-3 w-3 text-gray-400" /> {c.phone}</p>}
                        {c.email && <p className="flex items-center gap-1.5 text-gray-700"><Mail className="h-3 w-3 text-gray-400" /> {c.email}</p>}
                        {c.website && <p className="flex items-center gap-1.5 text-blue-600"><Globe className="h-3 w-3" /> {c.website}</p>}
                        {c.city && <p className="flex items-center gap-1.5 text-gray-500"><MapPin className="h-3 w-3 text-gray-400" /> {c.streetAddress ? `${c.streetAddress}, ` : ""}{c.city}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase">Juridik & betalning</h4>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          {c.fTax ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-red-500" />}
                          <span>F-skatt{c.fTax ? "" : " saknas"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          {c.insuranceCoverage ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                          <span>Försäkring{c.insuranceCoverage
                            ? c.insuranceExpiry ? ` (t.o.m. ${format(new Date(c.insuranceExpiry), "yyyy-MM-dd")})` : ""
                            : " saknas"}</span>
                        </div>
                        {c.bankgiro && <p className="flex items-center gap-1.5 text-gray-700"><CreditCard className="h-3 w-3 text-gray-400" /> Bankgiro: {c.bankgiro}</p>}
                        {c.swish && <p className="flex items-center gap-1.5 text-gray-700"><CreditCard className="h-3 w-3 text-gray-400" /> Swish: {c.swish}</p>}
                      </div>
                    </div>

                    {c.contacts.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Kontaktpersoner</h4>
                        <div className="space-y-1">
                          {c.contacts.map((contact) => (
                            <div key={contact.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
                              <div>
                                <span className="font-medium text-gray-900">{contact.name}</span>
                                {contact.role && <span className="ml-2 text-xs text-gray-400">{contact.role}</span>}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                {contact.phone && <span>{contact.phone}</span>}
                                {contact.email && <span>{contact.email}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {c.notes && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Noteringar</h4>
                        <p className="text-sm text-gray-600 italic">{c.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
