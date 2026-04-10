"use client";

import { useState, useEffect } from "react";
import { Save, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function StadgeregelTab() {
  const rulesQuery = trpc.brfRules.get.useQuery();
  const update = trpc.brfRules.update.useMutation({
    onSuccess: () => rulesQuery.refetch(),
  });

  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (rulesQuery.data) {
      const { id, createdAt, updatedAt, ...rest } = rulesQuery.data;
      setForm(rest);
    }
  }, [rulesQuery.data]);

  if (rulesQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;

  function handleSave() {
    update.mutate(form as Parameters<typeof update.mutate>[0]);
  }

  function setField(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Dessa inställningar baseras på föreningens stadgar. Ändra bara om stadgarna har uppdaterats.
        </p>
      </div>

      {/* Organisation */}
      <Section title="Organisationsanslutning">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Anslutning</label>
            <select value={form.affiliation as string ?? "NONE"} onChange={(e) => setField("affiliation", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="NONE">Fristående förening</option>
              <option value="HSB">HSB</option>
              <option value="RIKSBYGGEN">Riksbyggen</option>
              <option value="SBC">SBC</option>
              <option value="OTHER">Annan</option>
            </select>
          </div>
          <NumberField label="Reserverade styrelseposter" value={form.reservedBoardSeats as number} onChange={(v) => setField("reservedBoardSeats", v)} />
          <NumberField label="Reserverade suppleantposter" value={form.reservedBoardSubstitutes as number} onChange={(v) => setField("reservedBoardSubstitutes", v)} />
          <NumberField label="Reserverade revisorsposter" value={form.reservedAuditorSeats as number} onChange={(v) => setField("reservedAuditorSeats", v)} />
          <CheckboxField label="Kräver organisationens godkännande vid stadgeändring" checked={form.requireOrgApprovalForStatuteChange as boolean} onChange={(v) => setField("requireOrgApprovalForStatuteChange", v)} />
        </div>
      </Section>

      {/* Styrelse */}
      <Section title="Styrelsesammansättning">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Min antal ledamöter" value={form.minBoardMembers as number} onChange={(v) => setField("minBoardMembers", v)} />
          <NumberField label="Max antal ledamöter" value={form.maxBoardMembers as number} onChange={(v) => setField("maxBoardMembers", v)} />
          <NumberField label="Max antal suppleanter" value={form.maxBoardSubstitutes as number} onChange={(v) => setField("maxBoardSubstitutes", v)} />
          <NumberField label="Tillåtna externa ledamöter" value={form.allowExternalBoardMembers as number} onChange={(v) => setField("allowExternalBoardMembers", v)} />
        </div>
      </Section>

      {/* Kallelse */}
      <Section title="Stämma — Kallelse">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Kallelse senast (veckor före)" value={form.noticePeriodMinWeeks as number} onChange={(v) => setField("noticePeriodMinWeeks", v)} />
          <NumberField label="Kallelse tidigast (veckor före)" value={form.noticePeriodMaxWeeks as number} onChange={(v) => setField("noticePeriodMaxWeeks", v)} />
          <CheckboxField label="Digital kallelse tillåten" checked={form.noticeMethodDigital as boolean} onChange={(v) => setField("noticeMethodDigital", v)} />
          <CheckboxField label="Digital stämma tillåten" checked={form.allowDigitalMeeting as boolean} onChange={(v) => setField("allowDigitalMeeting", v)} />
        </div>
      </Section>

      {/* Ombud */}
      <Section title="Stämma — Ombud">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Max fullmakter per ombud (0=obegränsat)" value={form.maxProxiesPerPerson as number} onChange={(v) => setField("maxProxiesPerPerson", v)} />
          <NumberField label="Fullmaktens giltighetstid (månader)" value={form.proxyMaxValidityMonths as number} onChange={(v) => setField("proxyMaxValidityMonths", v)} />
          <CheckboxField label="Kretsbegränsning (bara närstående)" checked={form.proxyCircleRestriction as boolean} onChange={(v) => setField("proxyCircleRestriction", v)} />
        </div>
      </Section>

      {/* Röstning */}
      <Section title="Stämma — Röstning">
        <div className="grid grid-cols-2 gap-4">
          <CheckboxField label="Blankröst exkluderas vid majoritetsberäkning" checked={form.blankVoteExcluded as boolean} onChange={(v) => setField("blankVoteExcluded", v)} />
          <CheckboxField label="Sluten omröstning på begäran vid personval" checked={form.secretBallotOnDemand as boolean} onChange={(v) => setField("secretBallotOnDemand", v)} />
          <CheckboxField label="Ordförandens röst avgör vid lika (beslut)" checked={form.tieBreakerChairperson as boolean} onChange={(v) => setField("tieBreakerChairperson", v)} />
          <CheckboxField label="Lottning vid lika röstetal (val)" checked={form.tieBreakerLotteryForElection as boolean} onChange={(v) => setField("tieBreakerLotteryForElection", v)} />
          <NumberField label="Antal justerare" value={form.adjustersCount as number} onChange={(v) => setField("adjustersCount", v)} />
          <CheckboxField label="Separata rösträknare (HSB-modell)" checked={form.separateVoteCounters as boolean} onChange={(v) => setField("separateVoteCounters", v)} />
        </div>
      </Section>

      {/* Motioner */}
      <Section title="Motioner">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Deadline månad" value={form.motionDeadlineMonth as number} onChange={(v) => setField("motionDeadlineMonth", v)} />
          <NumberField label="Deadline dag (0=sista dagen)" value={form.motionDeadlineDay as number} onChange={(v) => setField("motionDeadlineDay", v)} />
        </div>
      </Section>

      {/* Avgifter */}
      <Section title="Avgifter (% av prisbasbelopp)">
        <div className="grid grid-cols-2 gap-4">
          <DecimalField label="Överlåtelseavgift max %" value={form.transferFeeMaxPercent as number} onChange={(v) => setField("transferFeeMaxPercent", v)} />
          <DecimalField label="Pantsättningsavgift max %" value={form.pledgeFeeMaxPercent as number} onChange={(v) => setField("pledgeFeeMaxPercent", v)} />
          <DecimalField label="Andrahandsavgift max %" value={form.subletFeeMaxPercent as number} onChange={(v) => setField("subletFeeMaxPercent", v)} />
          <CheckboxField label="Överlåtelseavgift betalas av säljaren" checked={form.transferFeePaidBySeller as boolean} onChange={(v) => setField("transferFeePaidBySeller", v)} />
        </div>
      </Section>

      {/* Revisorer */}
      <Section title="Revisorer">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Min antal" value={form.minAuditors as number} onChange={(v) => setField("minAuditors", v)} />
          <NumberField label="Max antal" value={form.maxAuditors as number} onChange={(v) => setField("maxAuditors", v)} />
          <NumberField label="Max suppleanter" value={form.maxAuditorSubstitutes as number} onChange={(v) => setField("maxAuditorSubstitutes", v)} />
          <CheckboxField label="Krav på auktoriserad revisor" checked={form.requireAuthorizedAuditor as boolean} onChange={(v) => setField("requireAuthorizedAuditor", v)} />
        </div>
      </Section>

      {/* Underhåll */}
      <Section title="Underhåll">
        <div className="grid grid-cols-2 gap-4">
          <CheckboxField label="Underhållsplan obligatorisk" checked={form.maintenancePlanRequired as boolean} onChange={(v) => setField("maintenancePlanRequired", v)} />
          <NumberField label="Underhållsplan antal år" value={form.maintenancePlanYears as number} onChange={(v) => setField("maintenancePlanYears", v)} />
          <DecimalField label="Fondavsättning % av taxeringsvärde (tom=enligt plan)" value={form.maintenanceFundPercent as number | null} onChange={(v) => setField("maintenanceFundPercent", v)} />
          <NumberField label="Protokoll tillgängligt inom (veckor)" value={form.protocolDeadlineWeeks as number} onChange={(v) => setField("protocolDeadlineWeeks", v)} />
        </div>
      </Section>

      {/* Ägarskap */}
      <Section title="Ägarskap">
        <div className="grid grid-cols-2 gap-4">
          <DecimalField label="Max ägarandel (%)" value={form.maxOwnershipPercent as number} onChange={(v) => setField("maxOwnershipPercent", v)} />
          <CheckboxField label="Andrahandsuthyrning kräver styrelsens godkännande" checked={form.subletRequiresApproval as boolean} onChange={(v) => setField("subletRequiresApproval", v)} />
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={update.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          <Save className="h-4 w-4" />
          {update.isPending ? "Sparar..." : "Spara stadgeregler"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input type="number" value={value ?? ""} onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}

function DecimalField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input type="number" step="0.1" value={value ?? ""} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 py-2">
      <input type="checkbox" checked={checked ?? false} onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      {label}
    </label>
  );
}
