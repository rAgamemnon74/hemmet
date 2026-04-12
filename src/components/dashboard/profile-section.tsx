"use client";

import { useState } from "react";
import { User, Home, Shield, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin", BOARD_CHAIRPERSON: "Ordförande", BOARD_SECRETARY: "Sekreterare",
  BOARD_TREASURER: "Kassör", BOARD_PROPERTY_MGR: "Förvaltningsansvarig",
  BOARD_ENVIRONMENT: "Miljöansvarig", BOARD_EVENTS: "Festansvarig",
  BOARD_MEMBER: "Ledamot", BOARD_SUBSTITUTE: "Suppleant", AUDITOR: "Revisor",
  AUDITOR_SUBSTITUTE: "Revisorssuppleant", NOMINATING_COMMITTEE: "Valberedare",
  NOMINATING_COMMITTEE_CHAIR: "Valberedningens sammankallande",
  MEMBER: "Medlem", RESIDENT: "Boende",
};

const consentLabels: Record<string, { title: string; description: string }> = {
  CONTACT_SHARING: {
    title: "Kontaktdelning",
    description: "Tillåt andra boende att se din e-post och telefon i registret.",
  },
  DIGITAL_COMMUNICATION: {
    title: "Digital kommunikation",
    description: "Godkänn att föreningen skickar meddelanden via e-post.",
  },
  PHOTO_PUBLICATION: {
    title: "Fotopublicering",
    description: "Tillåt att föreningen publicerar foton där du syns.",
  },
};

export function ProfileSection() {
  const profileQuery = trpc.profile.get.useQuery();
  const updateProfile = trpc.profile.update.useMutation({ onSuccess: () => { setEditing(false); profileQuery.refetch(); } });
  const setConsent = trpc.profile.setConsent.useMutation({ onSuccess: () => profileQuery.refetch() });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });

  const profile = profileQuery.data;
  if (!profile) return null;

  const consentMap = new Map(profile.consents.map((c) => [c.type, c]));

  function startEditing() {
    setForm({ firstName: profile!.firstName, lastName: profile!.lastName, phone: profile!.phone ?? "" });
    setEditing(true);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Profil */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-3">
          <User className="h-4 w-4 text-gray-400" /> Min profil
        </h2>
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Förnamn</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Efternamn</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Telefon</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" placeholder="070-123 45 67" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateProfile.mutate({ firstName: form.firstName, lastName: form.lastName, phone: form.phone || null })}
                disabled={updateProfile.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                <Save className="h-3.5 w-3.5" /> {updateProfile.isPending ? "Sparar..." : "Spara"}
              </button>
              <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Avbryt</button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Row label="Namn" value={`${profile.firstName} ${profile.lastName}`} />
            <Row label="E-post" value={profile.email} />
            <Row label="Telefon" value={profile.phone ?? "Ej angiven"} />
            <Row label="Roller" value={profile.roles.map((r) => roleLabels[r.role] ?? r.role).join(", ")} />
            <button onClick={startEditing} className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800">Redigera</button>
          </div>
        )}
      </div>

      {/* Lägenhet + Samtycke */}
      <div className="space-y-4">
        {profile.apartment && (
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-3">
              <Home className="h-4 w-4 text-gray-400" /> Min lägenhet
            </h2>
            <div className="space-y-1.5">
              <Row label="Byggnad" value={`${profile.apartment.building.name}, ${profile.apartment.building.address}`} />
              <Row label="Lägenhet" value={`Nr ${profile.apartment.number}${profile.apartment.floor !== null ? `, vån ${profile.apartment.floor}` : ""}`} />
              {profile.apartment.area && <Row label="Yta" value={`${profile.apartment.area} kvm`} />}
              {profile.apartment.monthlyFee && <Row label="Avgift" value={`${profile.apartment.monthlyFee.toLocaleString("sv-SE")} kr/mån`} />}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-3">
            <Shield className="h-4 w-4 text-gray-400" /> Integritet
          </h2>
          <div className="space-y-2">
            {(["CONTACT_SHARING", "DIGITAL_COMMUNICATION", "PHOTO_PUBLICATION"] as const).map((type) => {
              const consent = consentMap.get(type);
              const granted = consent?.granted ?? false;
              const label = consentLabels[type];
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="pr-3">
                    <p className="text-xs font-medium text-gray-700">{label.title}</p>
                    <p className="text-xs text-gray-400">{label.description}</p>
                  </div>
                  <button onClick={() => setConsent.mutate({ type, granted: !granted })} disabled={setConsent.isPending}
                    className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
                      granted ? "bg-blue-600" : "bg-gray-200")}>
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                      granted ? "translate-x-4 mt-0.5 ml-0.5" : "translate-x-0.5 mt-0.5")} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
