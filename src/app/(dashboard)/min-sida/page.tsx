"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  User, Home, Shield, FileText, Wrench, Lightbulb,
  Save, Loader2, CheckCircle, Clock, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  BOARD_CHAIRPERSON: "Ordförande",
  BOARD_SECRETARY: "Sekreterare",
  BOARD_TREASURER: "Kassör",
  BOARD_PROPERTY_MGR: "Förvaltningsansvarig",
  BOARD_ENVIRONMENT: "Miljöansvarig",
  BOARD_EVENTS: "Festansvarig",
  BOARD_MEMBER: "Ledamot",
  BOARD_SUBSTITUTE: "Suppleant",
  AUDITOR: "Revisor",
  MEMBER: "Medlem",
  RESIDENT: "Boende",
};

const statusLabels: Record<string, string> = {
  SUBMITTED: "Inskickad",
  ACKNOWLEDGED: "Mottagen",
  IN_PROGRESS: "Pågår",
  RESOLVED: "Åtgärdad",
  CLOSED: "Stängd",
  DRAFT: "Utkast",
  RECEIVED: "Mottagen",
  BOARD_RESPONSE: "Styrelsens svar",
  DECIDED: "Beslutad",
  WITHDRAWN: "Återkallad",
  STRUCK: "Struken",
  NOT_TREATED: "Ej behandlad",
};

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-amber-100 text-amber-700",
  ACKNOWLEDGED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
  DRAFT: "bg-gray-100 text-gray-500",
  RECEIVED: "bg-blue-100 text-blue-700",
  BOARD_RESPONSE: "bg-purple-100 text-purple-700",
  DECIDED: "bg-green-100 text-green-700",
  WITHDRAWN: "bg-gray-100 text-gray-400",
  STRUCK: "bg-red-100 text-red-700",
  NOT_TREATED: "bg-amber-100 text-amber-700",
};

const consentLabels: Record<string, { title: string; description: string }> = {
  CONTACT_SHARING: {
    title: "Kontaktdelning",
    description: "Tillåt andra medlemmar att se din e-post och telefonnummer i medlemsregistret.",
  },
  DIGITAL_COMMUNICATION: {
    title: "Digital kommunikation",
    description: "Godkänn att föreningen skickar kallelser och meddelanden via e-post istället för brev.",
  },
  PHOTO_PUBLICATION: {
    title: "Fotopublicering",
    description: "Tillåt att föreningen publicerar foton där du syns, t.ex. i nyhetsbrev eller på hemsidan.",
  },
};

export default function MinSidaPage() {
  const router = useRouter();
  const profileQuery = trpc.profile.get.useQuery();
  const issuesQuery = trpc.profile.getMyIssues.useQuery();
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      profileQuery.refetch();
    },
  });
  const setConsent = trpc.profile.setConsent.useMutation({
    onSuccess: () => profileQuery.refetch(),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const profile = profileQuery.data;
  if (!profile) return null;

  const issues = issuesQuery.data;
  const consentMap = new Map(profile.consents.map((c) => [c.type, c]));

  function startEditing() {
    setForm({
      firstName: profile!.firstName,
      lastName: profile!.lastName,
      phone: profile!.phone ?? "",
    });
    setEditing(true);
  }

  function handleSave() {
    updateProfile.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || null,
    });
  }

  const activeIssues = [
    ...(issues?.damageReports.filter((r) => !["RESOLVED", "CLOSED"].includes(r.status)) ?? []).map((r) => ({ ...r, type: "damage" as const, href: `/boende/skadeanmalan/${r.id}` })),
    ...(issues?.suggestions.filter((s) => !["RESOLVED", "CLOSED"].includes(s.status)) ?? []).map((s) => ({ ...s, type: "suggestion" as const, href: `/boende/forslag/${s.id}` })),
    ...(issues?.motions.filter((m) => !["DECIDED", "WITHDRAWN", "STRUCK", "NOT_TREATED"].includes(m.status)) ?? []).map((m) => ({ ...m, type: "motion" as const, href: `/medlem/motioner/${m.id}` })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const resolvedIssues = [
    ...(issues?.damageReports.filter((r) => ["RESOLVED", "CLOSED"].includes(r.status)) ?? []).map((r) => ({ ...r, type: "damage" as const, href: `/boende/skadeanmalan/${r.id}` })),
    ...(issues?.suggestions.filter((s) => ["RESOLVED", "CLOSED"].includes(s.status)) ?? []).map((s) => ({ ...s, type: "suggestion" as const, href: `/boende/forslag/${s.id}` })),
    ...(issues?.motions.filter((m) => ["DECIDED", "WITHDRAWN", "STRUCK", "NOT_TREATED"].includes(m.status)) ?? []).map((m) => ({ ...m, type: "motion" as const, href: `/medlem/motioner/${m.id}` })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Min sida</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Section icon={User} title="Min profil">
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Förnamn</label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Efternamn</label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Telefon</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="070-123 45 67" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={updateProfile.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  <Save className="h-3.5 w-3.5" />
                  {updateProfile.isPending ? "Sparar..." : "Spara"}
                </button>
                <button onClick={() => setEditing(false)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Row label="Namn" value={`${profile.firstName} ${profile.lastName}`} />
              <Row label="E-post" value={profile.email} />
              <Row label="Telefon" value={profile.phone ?? "Ej angiven"} />
              <Row label="Roller" value={profile.roles.map((r) => roleLabels[r.role] ?? r.role).join(", ")} />
              <button onClick={startEditing}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                Redigera kontaktuppgifter
              </button>
            </div>
          )}
        </Section>

        {/* Apartment */}
        <Section icon={Home} title="Min lägenhet">
          {profile.apartment ? (
            <div className="space-y-2">
              <Row label="Byggnad" value={`${profile.apartment.building.name}, ${profile.apartment.building.address}`} />
              <Row label="Lägenhet" value={`Nr ${profile.apartment.number}${profile.apartment.floor !== null ? `, vån ${profile.apartment.floor}` : ""}`} />
              <Row label="Yta" value={profile.apartment.area ? `${profile.apartment.area} kvm` : "—"} />
              <Row label="Rum" value={profile.apartment.rooms ? `${profile.apartment.rooms}` : "—"} />
              <Row label="Andelstal" value={profile.apartment.share ? `${(profile.apartment.share * 100).toFixed(1)}%` : "—"} />
              <Row label="Månadsavgift" value={profile.apartment.monthlyFee ? `${profile.apartment.monthlyFee.toLocaleString("sv-SE")} kr` : "—"} />
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.apartment.balcony && <Badge>Balkong</Badge>}
                {profile.apartment.patio && <Badge>Uteplats</Badge>}
                {profile.apartment.storage && <Badge>Förråd {profile.apartment.storage}</Badge>}
                {profile.apartment.parking && <Badge>Parkering {profile.apartment.parking}</Badge>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Ingen lägenhet kopplad till ditt konto.</p>
          )}
        </Section>
      </div>

      {/* Consent */}
      <Section icon={Shield} title="Integritetsinställningar">
        <p className="text-xs text-gray-500 mb-4">
          Hantera hur dina personuppgifter delas inom föreningen. Du kan när som helst ändra dina val.
        </p>
        <div className="space-y-3">
          {(["CONTACT_SHARING", "DIGITAL_COMMUNICATION", "PHOTO_PUBLICATION"] as const).map((type) => {
            const consent = consentMap.get(type);
            const granted = consent?.granted ?? false;
            const label = consentLabels[type];
            return (
              <div key={type} className="flex items-start justify-between rounded-lg border border-gray-200 p-3">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium text-gray-900">{label.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label.description}</p>
                </div>
                <button
                  onClick={() => setConsent.mutate({ type, granted: !granted })}
                  disabled={setConsent.isPending}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                    granted ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                    granted ? "translate-x-5.5 mt-0.5 ml-0.5" : "translate-x-0.5 mt-0.5"
                  )} />
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Active issues */}
      <Section icon={Clock} title={`Pågående ärenden (${activeIssues.length})`}>
        {activeIssues.length === 0 ? (
          <p className="text-sm text-gray-400">Du har inga pågående ärenden.</p>
        ) : (
          <div className="space-y-2">
            {activeIssues.map((issue) => (
              <a key={issue.id} href={issue.href}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {issue.type === "damage" && <Wrench className="h-4 w-4 text-amber-500 shrink-0" />}
                  {issue.type === "suggestion" && <Lightbulb className="h-4 w-4 text-blue-500 shrink-0" />}
                  {issue.type === "motion" && <FileText className="h-4 w-4 text-purple-500 shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                    <p className="text-xs text-gray-400">
                      {issue.type === "damage" ? "Felanmälan" : issue.type === "suggestion" ? "Förslag" : "Motion"}
                      {" — "}
                      {format(new Date(issue.createdAt), "d MMM yyyy", { locale: sv })}
                    </p>
                  </div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[issue.status] ?? "bg-gray-100 text-gray-500")}>
                  {statusLabels[issue.status] ?? issue.status}
                </span>
              </a>
            ))}
          </div>
        )}
      </Section>

      {/* Resolved issues */}
      {resolvedIssues.length > 0 && (
        <Section icon={CheckCircle} title={`Avslutade ärenden (${resolvedIssues.length})`}>
          <div className="space-y-2">
            {resolvedIssues.map((issue) => (
              <a key={issue.id} href={issue.href}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {issue.type === "damage" && <Wrench className="h-4 w-4 text-gray-400 shrink-0" />}
                  {issue.type === "suggestion" && <Lightbulb className="h-4 w-4 text-gray-400 shrink-0" />}
                  {issue.type === "motion" && <FileText className="h-4 w-4 text-gray-400 shrink-0" />}
                  <div>
                    <p className="text-sm text-gray-600">{issue.title}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(issue.createdAt), "d MMM yyyy", { locale: sv })}
                    </p>
                  </div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[issue.status] ?? "bg-gray-100 text-gray-500")}>
                  {statusLabels[issue.status] ?? issue.status}
                </span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      {children}
    </span>
  );
}
