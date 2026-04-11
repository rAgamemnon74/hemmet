"use client";

import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ShieldAlert, Plus, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = {
  NOISE: "Buller", SMOKE: "Rök/lukt", THREATS: "Hot/otrygghet",
  PROPERTY_DAMAGE: "Skadegörelse", COMMON_AREA_MISUSE: "Missbruk av gemensamma utrymmen",
  PETS: "Husdjur", WASTE: "Sophantering", OTHER: "Övrigt",
};
const statusLabels: Record<string, string> = {
  REPORTED: "Anmäld", ACKNOWLEDGED: "Noterad", FIRST_WARNING: "Tillsägelse",
  SECOND_WARNING: "Varning", BOARD_REVIEW: "Styrelsegranskning",
  RESOLVED: "Löst", ESCALATED: "Eskalerad", CLOSED: "Stängd",
};
const statusColors: Record<string, string> = {
  REPORTED: "bg-amber-100 text-amber-700", ACKNOWLEDGED: "bg-blue-100 text-blue-700",
  FIRST_WARNING: "bg-orange-100 text-orange-700", SECOND_WARNING: "bg-red-100 text-red-700",
  BOARD_REVIEW: "bg-purple-100 text-purple-700", RESOLVED: "bg-green-100 text-green-700",
  ESCALATED: "bg-red-100 text-red-700", CLOSED: "bg-gray-100 text-gray-500",
};

export default function DisturbancePage() {
  const [showInfo, setShowInfo] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState({ type: "NOISE" as string, description: "", location: "" });

  const submit = trpc.disturbance.report.useMutation({
    onSuccess: () => { setShowForm(false); setForm({ type: "NOISE", description: "", location: "" }); },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-amber-600" /> Störningsanmälan
      </h1>

      {/* Akut-banner */}
      <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-medium text-red-800">Vid akut fara — ring 112.</p>
        <p className="text-xs text-red-600 mt-0.5">Hot, våld eller pågående brott hanteras av polisen, inte av styrelsen.</p>
      </div>

      {/* Information om processen */}
      {showInfo && !showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Knacka på först</h2>
            <p className="mt-1 text-sm text-gray-600">
              Vi har alla valt att bo tillsammans. Grunden för trivseln i vår förening är goda
              grannrelationer — oavsett om vi bor dörr i dörr, på samma våningsplan eller i
              samma hus. De flesta störningar beror på missförstånd eller omedvetenhet.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Knacka på hos din granne och prata.</span> Det
              är alltid första steget. Ofta vet grannen inte om att de stör, och ett vänligt samtal
              löser problemet utan att styrelsen behöver involveras. Om din granne har delat sitt
              telefonnummer i boenderegistret kan du också ringa eller skicka ett SMS.
            </p>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <h3 className="text-xs font-semibold text-blue-800">Normalt boendeljud är inte en störning</h3>
            <p className="mt-1 text-sm text-blue-700">
              Ljud från barn som leker, steg, samtal, matlagning och normalt leverne ingår i
              flerfamiljsboende och utgör inte störning i juridisk mening. Om du upplever att
              normala ljud hörs för mycket kan det bero på byggnadens ljudisolering — kontakta
              styrelsen om en <a href="/boende/skadeanmalan/ny" className="underline font-medium">felanmälan</a> istället.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-700 uppercase">Vad händer vid en formell anmälan?</h3>
            <div className="mt-2 space-y-1.5 text-sm text-gray-600">
              <p>1. Styrelsen tar emot och utreder din anmälan.</p>
              <p>2. Lägenhetsägaren kontaktas och informeras om störningen.</p>
              <p>3. Om störningen fortsätter kan styrelsen utfärda en formell tillsägelse.</p>
              <p>4. Upprepade störningar kan leda till varning med hänvisning till bostadsrättslagen.</p>
              <p>5. I yttersta fall kan bostadsrätten förverkas.</p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              En formell anmälan är allvarlig och kan få konsekvenser för din granne. Använd den
              när dialog inte fungerat — inte som första åtgärd.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm text-gray-700">
                Jag har knackat på och pratat med min granne om detta, eller situationen
                är sådan att direkt kontakt inte är lämplig (t.ex. hot, otrygghet).
              </span>
            </label>
          </div>

          <button onClick={() => { if (confirmed) setShowForm(true); }}
            disabled={!confirmed}
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus className="h-4 w-4" /> Gå vidare till anmälan
          </button>
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Anmäl störning</h2>

          <div>
            <label className="text-xs font-medium text-gray-500">Typ av störning</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Beskrivning</label>
            <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Beskriv störningen: vad händer, när, hur ofta..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Plats</label>
            <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="T.ex. Lägenhet 2001, trapphus B, innergården..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => submit.mutate({ type: form.type as never, description: form.description, location: form.location || undefined })}
              disabled={submit.isPending || form.description.length < 10}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Skicka anmälan"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Avbryt
            </button>
          </div>
          {submit.error && <p className="text-sm text-red-600">{submit.error.message}</p>}
          {submit.isSuccess && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Anmälan skickad! Styrelsen hanterar ärendet.</p>}
        </div>
      )}
    </div>
  );
}
