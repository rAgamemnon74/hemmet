"use client";

import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Users, UserCog, FileText, CheckCircle, Vote, Clock,
  Gavel, ClipboardList, UserCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const methodLabels: Record<string, string> = {
  ACCLAMATION: "Acklamation",
  COUNTED: "Votering (räknade röster)",
  ROLL_CALL: "Votering (namnupprop)",
};

const meetingTypeLabels: Record<string, string> = {
  BOARD: "Styrelsemöte",
  ANNUAL: "Ordinarie föreningsstämma",
  EXTRAORDINARY: "Extra föreningsstämma",
};

function fmt(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "d MMMM yyyy 'kl.' HH:mm", { locale: sv });
}

function fmtTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "HH:mm", { locale: sv });
}

type Attendance = {
  id: string;
  status: string;
  proxyFor: string | null;
  arrivedAt: Date | null;
  user: { id: string; firstName: string; lastName: string; email: string };
};

type AgendaItemLog = {
  id: string;
  sortOrder: number;
  title: string;
  description: string | null;
  specialType: string | null;
  decisions: DecisionData[];
  votes: Array<{ id: string; choice: string; user: { id: string; firstName: string; lastName: string } }>;
};

type MotionLog = {
  id: string;
  title: string;
  proposal: string;
  status: string;
  boardResponse: string | null;
  boardRecommendation: string | null;
  resolution: string | null;
  author: { firstName: string; lastName: string };
  voteProposals: Array<{ id: string; label: string; description: string; adopted: boolean; votesFor: number | null; votesAgainst: number | null; votesAbstained: number | null }>;
};

type ProxyLog = {
  id: string;
  memberId: string;
  proxyType: string;
  externalName: string | null;
  memberName: string;
  proxyMemberName: string | null;
};

type VoterRegistryLog = {
  id: string;
  entries: Array<{
    memberId: string;
    checkedIn: boolean;
    checkedInAt: Date | null;
    memberName: string;
  }>;
} | null;

type MeetingLog = {
  id: string;
  type: string;
  title: string;
  status: string;
  scheduledAt: Date;
  location: string | null;
  description: string | null;
  attendances: Attendance[];
  agendaItems: AgendaItemLog[];
  decisions: DecisionData[];
  motions: MotionLog[];
  proxies: ProxyLog[];
  voterRegistry: VoterRegistryLog;
};

export function MeetingLogTab({ meetingId }: { meetingId: string }) {
  const logQuery = trpc.meeting.getLog.useQuery({ id: meetingId });

  if (logQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (logQuery.error || !logQuery.data) {
    return <p className="text-sm text-red-600">Kunde inte ladda mötesloggen.</p>;
  }

  const { meeting, chairpersonName, secretaryName, adjusterNames, proxiesWithNames, voterRegistryWithNames } = logQuery.data;
  const m = meeting as unknown as MeetingLog;
  const proxies = proxiesWithNames as unknown as ProxyLog[];
  const voterRegistry = voterRegistryWithNames as unknown as VoterRegistryLog;
  const isBoard = m.type === "BOARD";
  const present = m.attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY");
  const absent = m.attendances.filter((a) => a.status === "ABSENT");

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <Section icon={Gavel} title="Mötesuppgifter">
        <Row label="Typ" value={meetingTypeLabels[m.type] ?? m.type} />
        <Row label="Titel" value={m.title} />
        <Row label="Datum" value={fmt(m.scheduledAt)} />
        {m.location && <Row label="Plats" value={m.location} />}
        {m.description && <Row label="Beskrivning" value={m.description} />}
      </Section>

      {/* Roles */}
      <Section icon={UserCog} title="Mötesroller">
        <Row label="Mötesordförande" value={chairpersonName ?? "Ej vald"} />
        <Row label="Mötessekreterare" value={secretaryName ?? "Ej vald"} />
        <Row
          label={isBoard ? "Justerare" : "Justerare tillika rösträknare"}
          value={adjusterNames.length > 0 ? adjusterNames.join(", ") : "Ej valda"}
        />
      </Section>

      {/* Attendance */}
      <Section icon={Users} title={isBoard ? "Närvaro — Styrelsemedlemmar" : "Närvaro"}>
        <div className="space-y-1">
          {present.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-gray-700">{a.user.firstName} {a.user.lastName}</span>
                {a.status === "PROXY" && a.proxyFor && (
                  <span className="text-xs text-blue-600">(ombud)</span>
                )}
              </div>
              {a.arrivedAt && (
                <span className="text-xs text-gray-400">ankom {fmtTime(a.arrivedAt)}</span>
              )}
            </div>
          ))}
          {absent.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-gray-400">{a.user.firstName} {a.user.lastName}</span>
              <span className="text-xs text-gray-400">— frånvarande</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {present.length} närvarande, {absent.length} frånvarande av {m.attendances.length} totalt
        </p>
      </Section>

      {/* Voter registry (annual meetings) */}
      {!isBoard && voterRegistry && (
        <Section icon={ClipboardList} title="Röstlängd">
          {voterRegistry.entries.map((e) => (
            <div key={e.memberId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", e.checkedIn ? "bg-green-500" : "bg-gray-300")} />
                <span className={e.checkedIn ? "text-gray-700" : "text-gray-400"}>
                  {e.memberName}
                </span>
              </div>
              {e.checkedIn && e.checkedInAt && (
                <span className="text-xs text-gray-400">incheckad {fmtTime(e.checkedInAt)}</span>
              )}
            </div>
          ))}
          <p className="mt-2 text-xs text-gray-400">
            {voterRegistry.entries.filter((e) => e.checkedIn).length} av {voterRegistry.entries.length} incheckade
          </p>
        </Section>
      )}

      {/* Proxies (annual meetings) */}
      {!isBoard && proxies.length > 0 && (
        <Section icon={UserCheck} title="Ombud">
          {proxies.map((p) => (
            <div key={p.id} className="text-sm text-gray-700">
              <span className="font-medium">{p.memberName}</span>
              {" representeras av "}
              <span className="font-medium">
                {p.proxyMemberName ?? p.externalName ?? "extern"}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* Agenda with decisions */}
      <Section icon={FileText} title="Dagordning och beslut">
        <div className="space-y-4">
          {m.agendaItems.map((item, i) => (
            <div key={item.id} className="border-l-2 border-gray-200 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-gray-400">§{i + 1}</span>
                <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
              </div>
              {item.description && (
                <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
              )}

              {/* Decisions under this agenda item */}
              {item.decisions.length > 0 && (
                <div className="mt-2 space-y-2">
                  {item.decisions.map((d) => (
                    <DecisionBlock key={d.id} decision={d} />
                  ))}
                </div>
              )}

              {/* Item-level votes (show of hands etc.) */}
              {item.votes.length > 0 && (
                <div className="mt-2 rounded bg-gray-50 p-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Röstning</p>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-700">Ja: {item.votes.filter((v) => v.choice === "YES").length}</span>
                    <span className="text-red-600">Nej: {item.votes.filter((v) => v.choice === "NO").length}</span>
                    <span className="text-gray-500">Avstår: {item.votes.filter((v) => v.choice === "ABSTAIN").length}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Motions (annual meetings) */}
      {m.motions.length > 0 && (
        <Section icon={Vote} title="Motioner">
          {m.motions.map((mo) => (
            <div key={mo.id} className="border-l-2 border-purple-200 pl-4 space-y-1">
              <h4 className="text-sm font-semibold text-gray-900">{mo.title}</h4>
              <p className="text-xs text-gray-600">{mo.proposal}</p>
              <p className="text-xs text-gray-400">Av {mo.author.firstName} {mo.author.lastName}</p>
              {mo.boardResponse && (
                <div className="rounded bg-purple-50 p-2">
                  <p className="text-xs font-medium text-purple-700">Styrelsens yttrande</p>
                  <p className="text-xs text-purple-600">{mo.boardResponse}</p>
                </div>
              )}
              {mo.resolution && (
                <div className="rounded bg-green-50 p-2">
                  <p className="text-xs font-medium text-green-700">Stämmans beslut</p>
                  <p className="text-xs text-green-600">{mo.resolution}</p>
                </div>
              )}
              {mo.voteProposals.length > 0 && (
                <div className="space-y-1">
                  {mo.voteProposals.map((vp) => (
                    <div key={vp.id} className={cn("rounded p-2 text-xs", vp.adopted ? "bg-green-50 border border-green-200" : "bg-gray-50")}>
                      <span className="font-medium">{vp.label}:</span> {vp.description}
                      {vp.votesFor !== null && (
                        <span className="ml-2 text-gray-500">(Ja: {vp.votesFor}, Nej: {vp.votesAgainst ?? 0}, Avstår: {vp.votesAbstained ?? 0})</span>
                      )}
                      {vp.adopted && <span className="ml-1 font-bold text-green-700">ANTAGET</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* All decisions summary */}
      <Section icon={CheckCircle} title="Beslutslista">
        {m.decisions.length === 0 ? (
          <p className="text-sm text-gray-400">Inga beslut fattades.</p>
        ) : (
          <div className="space-y-3">
            {m.decisions.map((d) => (
              <DecisionBlock key={d.id} decision={d} showAgendaRef />
            ))}
          </div>
        )}
      </Section>

      <p className="text-xs text-gray-300 text-center pt-4 border-t border-gray-100">
        Möteslogg genererad {fmt(new Date())} — underlag för protokoll
      </p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof FileText; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase mb-3">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}

type DecisionData = {
  id: string;
  reference: string;
  title: string;
  decisionText: string;
  decidedAt: Date;
  method: string;
  votesFor: number | null;
  votesAgainst: number | null;
  votesAbstained: number | null;
  voteRequestedBy: string | null;
  voteRequestedReason: string | null;
  voteRecords: Array<{ id: string; voterId: string; voterName: string; choice: string; castAt: Date | null }>;
  agendaItem?: { sortOrder: number; title: string } | null;
};

function DecisionBlock({ decision: d, showAgendaRef }: { decision: DecisionData; showAgendaRef?: boolean }) {
  return (
    <div className="rounded border border-green-200 bg-green-50/50 p-3">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
        <span className="text-xs font-mono font-bold text-green-700">{d.reference}</span>
        <span className="text-xs text-gray-400">{methodLabels[d.method] ?? d.method}</span>
        {showAgendaRef && d.agendaItem && (
          <span className="text-xs text-gray-400">— §{d.agendaItem.sortOrder} {d.agendaItem.title}</span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-900">{d.title}</p>
      <p className="text-sm text-gray-700 mt-0.5">{d.decisionText}</p>

      {d.method !== "ACCLAMATION" && d.votesFor !== null && (
        <div className="mt-2 flex gap-4 text-xs">
          <span className="text-green-700">Ja: {d.votesFor}</span>
          <span className="text-red-600">Nej: {d.votesAgainst ?? 0}</span>
          <span className="text-gray-500">Avstår: {d.votesAbstained ?? 0}</span>
        </div>
      )}

      {d.voteRequestedBy && (
        <p className="mt-1 text-xs text-gray-400">
          Votering begärd av {d.voteRequestedBy}
          {d.voteRequestedReason && `: ${d.voteRequestedReason}`}
        </p>
      )}

      {d.voteRecords.length > 0 && (
        <div className="mt-2 border-t border-green-200 pt-2">
          <p className="text-xs font-medium text-gray-500 mb-1">Individuella röster</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {d.voteRecords.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{v.voterName}</span>
                <span className={cn(
                  "font-medium",
                  v.choice === "YES" ? "text-green-700" : v.choice === "NO" ? "text-red-600" : "text-gray-400"
                )}>
                  {v.choice === "YES" ? "Ja" : v.choice === "NO" ? "Nej" : "Avstår"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-1 text-xs text-gray-400">
        <Clock className="inline h-3 w-3 mr-0.5" />
        {fmt(d.decidedAt)}
      </div>
    </div>
  );
}
