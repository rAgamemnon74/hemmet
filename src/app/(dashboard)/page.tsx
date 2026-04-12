"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  CalendarDays, AlertTriangle, CheckSquare, FileText, Receipt,
  ArrowRightLeft, Wrench, UserPlus, Loader2, ChevronDown,
  PenLine, Key, Hammer, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const statusIcon: Record<string, string> = {
  DONE: "●", ACTIVE: "◉", UPCOMING: "○", WARNING: "◉", OVERDUE: "●",
};
const statusColor: Record<string, string> = {
  DONE: "text-green-500", ACTIVE: "text-blue-500", UPCOMING: "text-gray-300",
  WARNING: "text-amber-500", OVERDUE: "text-red-500",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const isBoard = userRoles.some((r) => r.startsWith("BOARD_") || r === "ADMIN");
  const isChairperson = hasPermission(userRoles, "transfer:review");
  const isTreasurer = hasPermission(userRoles, "transfer:manage_financial");
  const isPropertyMgr = hasPermission(userRoles, "report:manage");

  const [expanded, setExpanded] = useState(false);

  const timelineQuery = trpc.dashboard.annualTimeline.useQuery();
  const chairQuery = trpc.dashboard.chairpersonOverview.useQuery(undefined, { enabled: isChairperson });
  const treasurerQuery = trpc.dashboard.treasurerOverview.useQuery(undefined, { enabled: isTreasurer });
  const propertyQuery = trpc.dashboard.propertyOverview.useQuery(undefined, { enabled: isPropertyMgr });

  const timeline = timelineQuery.data;
  const chair = chairQuery.data;
  const treasurer = treasurerQuery.data;
  const property = propertyQuery.data;

  if (timelineQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const personal = timeline?.personal;
  const hasPersonalItems = personal && (
    personal.damageReports.length > 0 || personal.sublets.length > 0 ||
    personal.renovations.length > 0 || personal.protocolsToSign.length > 0 ||
    personal.tasks.length > 0 || personal.annualReportToSign
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Välkommen, {session?.user?.name?.split(" ")[0]}
      </h1>

      {/* ═══ MITT JUST NU ═══ */}
      {hasPersonalItems && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-5">
          <h2 className="text-xs font-semibold text-blue-700 uppercase mb-3">Mitt just nu</h2>
          <div className="space-y-2">
            {personal.protocolsToSign.map((p) => (
              <PersonalItem key={p.id} icon={PenLine} color="text-green-600"
                label={`Protokoll att signera: ${p.meeting.title}`}
                href={`/styrelse/moten/${p.meetingId}?tab=protocol`} />
            ))}
            {personal.annualReportToSign && (
              <PersonalItem icon={FileText} color="text-green-600"
                label="Årsberättelse att signera"
                href={`/styrelse/arsberattelse/${personal.annualReportToSign.id}`} />
            )}
            {personal.tasks.map((t) => (
              <PersonalItem key={t.id} icon={CheckSquare}
                color={t.priority === "URGENT" ? "text-red-600" : t.priority === "HIGH" ? "text-amber-600" : "text-blue-600"}
                label={t.title}
                detail={t.dueDate ? format(new Date(t.dueDate), "d MMM", { locale: sv }) : undefined}
                href={`/styrelse/arenden/${t.id}`} />
            ))}
            {personal.damageReports.map((r) => (
              <PersonalItem key={r.id} icon={Wrench} color="text-amber-600"
                label={`Felanmälan: ${r.title}`}
                detail={r.status === "IN_PROGRESS" ? "Åtgärdas" : "Inskickad"}
                href={`/boende/skadeanmalan/${r.id}`} />
            ))}
            {personal.sublets.map((s) => (
              <PersonalItem key={s.id} icon={Key} color="text-purple-600"
                label={`Andrahand: ${s.tenantName}`}
                detail={s.status} href="/boende/andrahand" />
            ))}
            {personal.renovations.map((r) => (
              <PersonalItem key={r.id} icon={Hammer} color="text-indigo-600"
                label={`Renovering: ${r.type}`}
                detail={r.status} href="/boende/renovering" />
            ))}
          </div>
        </div>
      )}

      {/* ═══ ÅRSHJULET ═══ */}
      {timeline && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-4">Årshjulet</h2>

          {/* Föregående verksamhetsår (avslutande) */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-400 mb-2">
              Verksamhetsår {timeline.previousFiscalYear} <span className="text-gray-300">— avslutas</span>
            </h3>
            <div className="space-y-1.5">
              {(expanded ? timeline.previousYearProcesses : timeline.previousYearProcesses.filter((p) => p.status !== "DONE").slice(0, 3)).map((p) => (
                <ProcessRow key={p.key} process={p} />
              ))}
              {!expanded && timeline.previousYearProcesses.filter((p) => p.status === "DONE").length > 0 && (
                <p className="text-xs text-gray-300 pl-6">
                  {timeline.previousYearProcesses.filter((p) => p.status === "DONE").length} avslutade steg
                </p>
              )}
            </div>
          </div>

          {/* Innevarande verksamhetsår */}
          <div className="mb-3">
            <h3 className="text-xs font-medium text-gray-400 mb-2">
              Verksamhetsår {timeline.currentFiscalYear} <span className="text-gray-300">— pågående</span>
            </h3>
            <div className="space-y-1.5">
              {timeline.currentYear.nextBoardMeeting && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-500">◉</span>
                  <Link href={`/styrelse/moten/${timeline.currentYear.nextBoardMeeting.id}`} className="text-gray-700 hover:text-blue-600">
                    {timeline.currentYear.nextBoardMeeting.title}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {format(new Date(timeline.currentYear.nextBoardMeeting.scheduledAt), "d MMM", { locale: sv })}
                  </span>
                </div>
              )}
              {timeline.currentYear.openDamageReports > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-amber-500">◉</span>
                  <Link href="/boende/skadeanmalan" className="text-gray-700 hover:text-blue-600">
                    {timeline.currentYear.openDamageReports} öppna felanmälningar
                  </Link>
                </div>
              )}
              {timeline.currentYear.openTasks > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-500">◉</span>
                  <Link href="/styrelse/arenden" className="text-gray-700 hover:text-blue-600">
                    {timeline.currentYear.openTasks} öppna uppgifter
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Expandera */}
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            {expanded ? "Komprimera" : "Visa hela tidslinjen"}
          </button>
        </div>
      )}

      {/* ═══ ROLLSPECIFIKT ═══ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chair && (
          <>
            <CountCard icon={UserPlus} label="Ansökningar" count={chair.pendingApplications} href="/medlem/ansokningar" color="blue" />
            <CountCard icon={Receipt} label="Utlägg att godkänna" count={chair.pendingExpenses} href="/styrelse/utlagg" color="amber" />
            <CountCard icon={ArrowRightLeft} label="Överlåtelser" count={chair.pendingTransfers} href="/styrelse/overlatelser" color="purple"
              alert={chair.overdueTransfers > 0 ? `${chair.overdueTransfers} försenade` : undefined} />
          </>
        )}
        {treasurer && !chair && (
          <>
            <CountCard icon={Receipt} label="Utlägg att godkänna" count={treasurer.pendingExpenses} href="/styrelse/utlagg" color="amber" />
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">Utbetalat denna månad</p>
              <p className="text-xl font-bold text-gray-900">{treasurer.thisMonthPaid.toLocaleString("sv-SE")} kr</p>
              <p className="text-xs text-gray-400">Förra månaden: {treasurer.lastMonthPaid.toLocaleString("sv-SE")} kr</p>
            </div>
          </>
        )}
        {property && (
          <CountCard icon={Wrench} label="Felanmälningar" count={property.openReports} href="/boende/skadeanmalan" color="red"
            alert={property.criticalReports > 0 ? `${property.criticalReports} kritiska` : undefined} />
        )}
      </div>

      {/* Non-board: enkla ingångar */}
      {!isBoard && !timelineQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/min-sida" className="rounded-lg border border-gray-200 bg-white p-6 hover:bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Min sida</h2>
            <p className="text-sm text-gray-500 mt-1">Profil, lägenhet och ärenden.</p>
          </Link>
          <Link href="/boende/skadeanmalan/ny" className="rounded-lg border border-gray-200 bg-white p-6 hover:bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Felanmälan</h2>
            <p className="text-sm text-gray-500 mt-1">Rapportera skador eller fel.</p>
          </Link>
        </div>
      )}
    </div>
  );
}

function PersonalItem({ icon: Icon, color, label, detail, href }: {
  icon: typeof FileText; color: string; label: string; detail?: string; href: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-blue-100/50 -mx-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", color)} />
        <span className="text-sm text-gray-800">{label}</span>
      </div>
      {detail && <span className="text-xs text-gray-400">{detail}</span>}
    </Link>
  );
}

function ProcessRow({ process }: { process: { key: string; label: string; status: string; detail: string; link?: string; date?: Date | null } }) {
  const content = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn("text-sm", statusColor[process.status])}>{statusIcon[process.status]}</span>
        <span className={cn("text-sm", process.status === "DONE" ? "text-gray-400" : "text-gray-700")}>{process.label}</span>
      </div>
      <div className="flex items-center gap-2">
        {process.date && <span className="text-xs text-gray-400">{format(new Date(process.date), "d MMM", { locale: sv })}</span>}
        <span className={cn("text-xs", process.status === "OVERDUE" ? "text-red-600 font-medium" : "text-gray-400")}>{process.detail}</span>
      </div>
    </div>
  );

  return process.link ? (
    <Link href={process.link} className="block rounded px-2 py-1 hover:bg-gray-50 -mx-2">{content}</Link>
  ) : (
    <div className="px-2 py-1 -mx-2">{content}</div>
  );
}

function CountCard({ icon: Icon, label, count, href, color, alert }: {
  icon: typeof FileText; label: string; count: number; href: string;
  color: "blue" | "amber" | "red" | "green" | "purple";
  alert?: string;
}) {
  const bg: Record<string, string> = { blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", red: "bg-red-50 text-red-600", green: "bg-green-50 text-green-600", purple: "bg-purple-50 text-purple-600" };
  return (
    <Link href={href} className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-lg p-2", bg[color])}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
      </div>
      {alert && <div className="mt-2 flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" /> {alert}</div>}
    </Link>
  );
}
