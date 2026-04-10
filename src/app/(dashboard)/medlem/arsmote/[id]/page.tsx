"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft, CalendarDays, MapPin, FileText, Vote, ClipboardList,
  UserCheck, CheckCircle, BookOpen, ScrollText, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import type { MeetingStatus, MeetingType, MotionStatus, DecisionMethod } from "@prisma/client";

const statusLabels: Record<MeetingStatus, string> = {
  DRAFT: "Utkast", SCHEDULED: "Kallad", IN_PROGRESS: "Pågår",
  FINALIZING: "Efterbehandling", COMPLETED: "Avslutad", CANCELLED: "Inställd",
};

const motionStatusLabels: Record<MotionStatus, string> = {
  DRAFT: "Utkast", SUBMITTED: "Inskickad", RECEIVED: "Mottagen",
  BOARD_RESPONSE: "Yttrande", DECIDED: "Beslutad", WITHDRAWN: "Återtagen",
  STRUCK: "Struken", NOT_TREATED: "Ej behandlad",
};

const decisionMethodLabels: Record<DecisionMethod, string> = {
  ACCLAMATION: "Acklamation", ROLL_CALL: "Votering", COUNTED: "Votering",
};

export default function AnnualMeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();

  const detailQuery = trpc.annualMeeting.getById.useQuery({ id });
  const myProxyQuery = trpc.annualMeeting.getMyProxy.useQuery({ meetingId: id });
  const rulesQuery = trpc.brfRules.get.useQuery();

  const selfCheckIn = trpc.voterRegistry.selfCheckIn.useMutation({
    onSuccess: () => detailQuery.refetch(),
  });

  if (detailQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  if (!detailQuery.data) return <p className="text-sm text-gray-500">Stämman hittades inte.</p>;

  const { meeting: m, annualReport } = detailQuery.data;
  const rules = rulesQuery.data;
  const myProxy = myProxyQuery.data;

  const isActive = m.status === "IN_PROGRESS";
  const isScheduled = m.status === "SCHEDULED";
  const isCompleted = m.status === "COMPLETED";
  const isAnnual = m.type === "ANNUAL";

  const checkedIn = m.voterRegistry?.entries.filter((e) => e.checkedIn).length ?? 0;
  const isSelfCheckedIn = m.voterRegistry?.entries.some(
    (e) => e.memberId === session?.user?.id && e.checkedIn
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/medlem/arsmote" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till stämmor
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{m.title}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {format(new Date(m.scheduledAt), "EEEE d MMMM yyyy 'kl.' HH:mm", { locale: sv })}
              </span>
              {m.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {m.location}
                </span>
              )}
            </div>
          </div>
          <span className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            isScheduled ? "bg-blue-100 text-blue-700"
              : isActive ? "bg-green-100 text-green-700"
              : isCompleted ? "bg-gray-100 text-gray-600"
              : "bg-gray-100 text-gray-700"
          )}>
            {statusLabels[m.status]}
          </span>
        </div>

        {/* Self check-in for active meetings */}
        {isActive && m.voterRegistry && !isSelfCheckedIn && (
          <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Stämman pågår — checka in dig</p>
              <p className="text-xs text-green-600">Registrera din närvaro i röstlängden</p>
            </div>
            <button
              onClick={() => selfCheckIn.mutate({ voterRegistryId: m.voterRegistry!.id })}
              disabled={selfCheckIn.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {selfCheckIn.isPending ? "Checkar in..." : "Checka in mig"}
            </button>
          </div>
        )}
        {isActive && isSelfCheckedIn && (
          <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-700">Du är incheckad i röstlängden.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">

          {/* Kallelse / Dagordning */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dagordning ({m.agendaItems.length} punkter)
            </h2>
            <div className="space-y-1">
              {m.agendaItems.map((item, i) => (
                <div key={item.id} className="flex items-baseline gap-3 rounded-md px-3 py-1.5 hover:bg-gray-50">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm text-gray-900">{item.title}</span>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                  </div>
                  {item.duration && <span className="text-xs text-gray-400">{item.duration} min</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Motioner */}
          {m.motions.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Vote className="h-4 w-4" />
                Motioner ({m.motions.length})
              </h2>
              <div className="space-y-3">
                {m.motions.map((motion) => (
                  <Link
                    key={motion.id}
                    href={`/medlem/motioner/${motion.id}`}
                    className="block rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{motion.title}</h3>
                        <p className="text-xs text-gray-500">
                          {motion.author.firstName} {motion.author.lastName}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{motionStatusLabels[motion.status]}</span>
                    </div>
                    {motion.boardResponse && (
                      <p className="mt-2 text-xs text-purple-700 bg-purple-50 rounded px-2 py-1">
                        Styrelsens yttrande finns
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Beslut (after meeting) */}
          {isCompleted && m.decisions.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Beslut ({m.decisions.length})
              </h2>
              <div className="space-y-3">
                {m.decisions.map((d) => (
                  <Link
                    key={d.id}
                    href={`/styrelse/beslut/${d.id}`}
                    className="block rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-600">
                        {d.reference}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{d.title}</span>
                      <span className="text-xs text-gray-500">{decisionMethodLabels[d.method]}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-1">{d.decisionText}</p>
                    {d.method === "COUNTED" && d.votesFor !== null && (
                      <p className="mt-1 text-xs text-gray-500">
                        Ja: {d.votesFor} — Nej: {d.votesAgainst ?? 0} — Avstår: {d.votesAbstained ?? 0}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Protokoll (after meeting) */}
          {isCompleted && m.protocol && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Protokoll
                {m.protocol.signedAt && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Justerat</span>
                )}
              </h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {m.protocol.content}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Proxy registration (before meeting) */}
          {(isScheduled || isActive) && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-3 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                Ditt ombud
              </h3>
              {myProxy ? (
                <div className="text-sm">
                  <p className="text-gray-900 font-medium">
                    {myProxy.proxyType === "MEMBER" ? "Annat medlemsombud" : "Externt ombud"}
                  </p>
                  {myProxy.externalName && <p className="text-gray-600">{myProxy.externalName}</p>}
                  <p className={cn("mt-1 text-xs", myProxy.approved ? "text-green-600" : "text-amber-600")}>
                    {myProxy.approved ? "Godkänt" : "Väntar på godkännande"}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Kan du inte närvara? Registrera ett ombud som röstar åt dig.
                  </p>
                  <Link
                    href={`/styrelse/moten/${m.id}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Registrera ombud
                  </Link>
                </div>
              )}
              {rules && (
                <p className="mt-2 text-xs text-gray-400">
                  Ombud får företräda max {rules.maxProxiesPerPerson === 0 ? "obegränsat antal" : rules.maxProxiesPerPerson} medlem(mar).
                  Fullmakt giltig max {rules.proxyMaxValidityMonths} mån.
                </p>
              )}
            </div>
          )}

          {/* Röstlängd summary */}
          {m.voterRegistry && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5" />
                Röstlängd
              </h3>
              <p className="text-lg font-bold text-gray-900">{checkedIn} incheckade</p>
              <p className="text-xs text-gray-500">
                av {m.voterRegistry.entries.length} registrerade
              </p>
              {m.voterRegistry.locked && (
                <p className="mt-1 text-xs text-amber-600 font-medium">Röstlängden är låst</p>
              )}
            </div>
          )}

          {/* Ombud summary */}
          {m.proxies.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                Ombud
              </h3>
              <p className="text-sm text-gray-900">
                {m.proxies.filter((p) => p.approved).length} godkända
                {m.proxies.filter((p) => !p.approved).length > 0 && (
                  <span className="text-amber-600 ml-1">
                    ({m.proxies.filter((p) => !p.approved).length} väntar)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Annual report link */}
          {isAnnual && annualReport && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
                <ScrollText className="h-3.5 w-3.5" />
                Årsredovisning
              </h3>
              <Link
                href={`/styrelse/arsberattelse/${annualReport.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {annualReport.title}
              </Link>
              {annualReport.audit?.recommendation && (
                <p className={cn(
                  "mt-1 text-xs font-medium",
                  annualReport.audit.recommendation === "APPROVE" ? "text-green-600" : "text-amber-600"
                )}>
                  Revisor: {annualReport.audit.recommendation === "APPROVE"
                    ? "Tillstyrker ansvarsfrihet"
                    : annualReport.audit.recommendation === "APPROVE_WITH_REMARKS"
                    ? "Tillstyrker med anmärkningar"
                    : "Avstyrker"}
                </p>
              )}
            </div>
          )}

          {/* Documents */}
          {m.documents.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Handlingar ({m.documents.length})
              </h3>
              <div className="space-y-1">
                {m.documents.map((doc) => (
                  <div key={doc.id} className="text-sm text-gray-700">
                    {doc.fileName}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key dates */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Datum</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Stämma</span>
                <span className="text-gray-900 font-medium">
                  {format(new Date(m.scheduledAt), "d MMM yyyy", { locale: sv })}
                </span>
              </div>
              {rules && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Motionsfrist</span>
                    <span className="text-gray-700">
                      {rules.motionDeadlineDay === 0 ? "Sista" : rules.motionDeadlineDay}{" "}
                      {["", "jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][rules.motionDeadlineMonth]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kallelse senast</span>
                    <span className="text-gray-700">{rules.noticePeriodMinWeeks} veckor före</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
