"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  CalendarDays, AlertTriangle, CheckSquare, FileText, Receipt,
  ArrowRightLeft, Wrench, UserPlus, Loader2, ChevronDown,
  PenLine, Key, Hammer, Clock, Plus, BookOpen, Sparkles,
  FileWarning, ClipboardList, ShieldCheck, Banknote, Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";
import { hasPermission, isBoardMember } from "@/lib/permissions";
import { ProfileSection } from "@/components/dashboard/profile-section";

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
  const isBoard = isBoardMember(userRoles);
  const canApproveExpenses = hasPermission(userRoles, "expense:approve");
  const canReviewApplications = hasPermission(userRoles, "application:review");
  const canReviewTransfers = hasPermission(userRoles, "transfer:review");
  const canManageFinancials = hasPermission(userRoles, "transfer:manage_financial");
  const canManageReports = hasPermission(userRoles, "report:manage");
  const canViewContracts = hasPermission(userRoles, "contract:manage");
  const canViewProcurement = hasPermission(userRoles, "procurement:manage");
  const canManageEnvironment = hasPermission(userRoles, "environment:manage");

  const [expanded, setExpanded] = useState(false);

  // Zon 1 & 2: Personal items + annual timeline (alla användare)
  const timelineQuery = trpc.dashboard.annualTimeline.useQuery();

  // Zon 3: Sedan sist (styrelsemedlemmar)
  const boardQuery = trpc.dashboard.boardOverview.useQuery(undefined, { enabled: isBoard });

  // Zon 4: Kräver uppmärksamhet (permission-gated)
  const chairQuery = trpc.dashboard.chairpersonOverview.useQuery(undefined, { enabled: canReviewApplications || canReviewTransfers });
  const treasurerQuery = trpc.dashboard.treasurerOverview.useQuery(undefined, { enabled: canManageFinancials });
  const propertyQuery = trpc.dashboard.propertyOverview.useQuery(undefined, { enabled: canManageReports });
  const expiringContractsQuery = trpc.contract.getExpiring.useQuery({ withinDays: 90 }, { enabled: canViewContracts });
  const overdueInspectionsQuery = trpc.property.getOverdueInspections.useQuery(undefined, { enabled: canManageReports });
  const procurementQuery = trpc.procurement.activeCounts.useQuery(undefined, { enabled: canViewProcurement });
  const environmentQuery = trpc.dashboard.environmentOverview.useQuery(undefined, { enabled: canManageEnvironment });

  const timeline = timelineQuery.data;
  const board = boardQuery.data;
  const chair = chairQuery.data;
  const treasurer = treasurerQuery.data;
  const property = propertyQuery.data;
  const expiringContracts = expiringContractsQuery.data;
  const overdueInspections = overdueInspectionsQuery.data;
  const procurement = procurementQuery.data;
  const environment = environmentQuery.data;

  if (timelineQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  const personal = timeline?.personal;
  const hasPersonalItems = personal && (
    personal.damageReports.length > 0 || personal.sublets.length > 0 ||
    personal.renovations.length > 0 || personal.protocolsToSign.length > 0 ||
    personal.tasks.length > 0 || personal.annualReportToSign || personal.annualReportInProgress
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Välkommen, {session?.user?.name?.split(" ")[0]}
      </h1>

      {/* ═══ ZON 1: MITT JUST NU — alltid synlig ═══ */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-blue-700 uppercase">Mitt just nu</h2>
          <div className="flex gap-2">
            {hasPermission(userRoles, "meeting:create") && (
              <Link href="/styrelse/moten/nytt" className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
                <Plus className="h-3 w-3" /> Nytt möte
              </Link>
            )}
            {hasPermission(userRoles, "report:submit") && (
              <Link href="/boende/skadeanmalan/ny" className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
                <Plus className="h-3 w-3" /> Felanmälan
              </Link>
            )}
          </div>
        </div>

        {personal && hasPersonalItems ? (
          <div className="space-y-2">
            {personal.protocolsToSign.map((p) => (
              <PersonalItem key={p.id} icon={PenLine} color="text-green-600"
                label={`Protokoll att signera: ${p.meeting.title}`}
                href={`/styrelse/moten/${p.meetingId}?tab=protocol`} />
            ))}
            {personal.annualReportToSign && (
              <PersonalItem icon={PenLine} color="text-green-600"
                label="Årsberättelse att signera"
                href={`/styrelse/arsberattelse/${personal.annualReportToSign.id}`} />
            )}
            {personal.annualReportInProgress && !personal.annualReportToSign && (
              <PersonalItem icon={BookOpen} color="text-blue-600"
                label={`Årsberättelse ${personal.annualReportInProgress.fiscalYear} — ${personal.annualReportInProgress.status === "DRAFT" ? "under arbete" : "inväntar signering"}`}
                href={`/styrelse/arsberattelse/${personal.annualReportInProgress.id}`} />
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
        ) : (
          <p className="text-sm text-blue-600/60">Inga pågående ärenden — allt lugnt!</p>
        )}
      </div>

      {/* ═══ ZON 2: ÅRSHJULET ═══ */}
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

      {/* ═══ ZON 3: SEDAN SIST — styrelsemedlemmar ═══ */}
      {board && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-4">Sedan förra mötet</h2>

          {board.nextMeeting && (
            <div className="mb-4 flex items-start gap-3 rounded-md bg-blue-50 p-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <Link href={`/styrelse/moten/${board.nextMeeting.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                  {board.nextMeeting.title}
                </Link>
                {board.nextMeeting.scheduledAt && (
                  <p className="text-xs text-gray-500">
                    {format(new Date(board.nextMeeting.scheduledAt), "EEEE d MMMM 'kl' HH:mm", { locale: sv })}
                    {" — "}{board.nextMeeting._count.agendaItems} dagordningspunkter
                  </p>
                )}
              </div>
            </div>
          )}

          {board.sinceLast && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <SinceLastBadge count={board.sinceLast.newExpenses} label="utlägg" href="/ekonomi/utlagg" />
              <SinceLastBadge count={board.sinceLast.newDamageReports} label="felanmälningar" href="/boende/skadeanmalan" />
              <SinceLastBadge count={board.sinceLast.newMotions} label="motioner" href="/medlem/motioner" />
              <SinceLastBadge count={board.sinceLast.newSuggestions} label="förslag" href="/boende/forslag" />
              <SinceLastBadge count={board.sinceLast.newTransfers} label="överlåtelser" href="/styrelse/overlatelser" />
              <SinceLastBadge count={board.sinceLast.newTasks} label="uppgifter" href="/styrelse/arenden" />
              <SinceLastBadge count={board.sinceLast.pendingProtocols} label="protokoll att slutföra" href="/styrelse/moten" />
            </div>
          )}

          {board.lastMeeting && (
            <p className="mt-3 text-xs text-gray-400">
              Sedan: {board.lastMeeting.title} ({format(new Date(board.lastMeeting.scheduledAt), "d MMM", { locale: sv })})
            </p>
          )}
        </div>
      )}

      {/* ═══ ZON 4: KRÄVER UPPMÄRKSAMHET — permission-gated ═══ */}
      <AttentionSection
        chair={chair}
        treasurer={treasurer}
        property={property}
        expiringContracts={expiringContracts}
        overdueInspections={overdueInspections}
        procurement={procurement}
        canApproveExpenses={canApproveExpenses}
        canReviewApplications={canReviewApplications}
        canReviewTransfers={canReviewTransfers}
        canManageFinancials={canManageFinancials}
        canManageReports={canManageReports}
        canViewContracts={canViewContracts}
        canViewProcurement={canViewProcurement}
        environment={environment}
        canManageEnvironment={canManageEnvironment}
      />

      {/* Profil, lägenhet, samtycke */}
      <ProfileSection />
    </div>
  );
}

// ─── Zon 4: Kräver uppmärksamhet ─────────────────────────────────

function AttentionSection({
  chair, treasurer, property, expiringContracts, overdueInspections, procurement,
  canApproveExpenses, canReviewApplications, canReviewTransfers,
  canManageFinancials, canManageReports, canViewContracts, canViewProcurement,
  environment, canManageEnvironment,
}: {
  chair: { pendingApplications: number; pendingExpenses: number; pendingTransfers: number; pendingMotions: number; overdueTransfers: number; unownedApartments: number } | null | undefined;
  treasurer: { pendingExpenses: number; approvedUnpaid: number; thisMonthPaid: number; lastMonthPaid: number; pendingTransferFees: number } | null | undefined;
  property: { openReports: number; criticalReports: number } | null | undefined;
  expiringContracts: unknown[] | null | undefined;
  overdueInspections: unknown[] | null | undefined;
  procurement: { active: number; awaitingDecision: number } | null | undefined;
  environment: { activeEgenkontroll: unknown; openIncidents: number; chemicalCount: number; overdueRiskReviews: number } | null | undefined;
  canApproveExpenses: boolean;
  canReviewApplications: boolean;
  canReviewTransfers: boolean;
  canManageFinancials: boolean;
  canManageReports: boolean;
  canViewContracts: boolean;
  canViewProcurement: boolean;
  canManageEnvironment: boolean;
}) {
  const cards: React.ReactNode[] = [];

  // Ansökningar
  if (canReviewApplications && chair && chair.pendingApplications > 0) {
    cards.push(
      <CountCard key="apps" icon={UserPlus} label="Ansökningar" count={chair.pendingApplications} href="/medlem/ansokningar" color="blue" />
    );
  }

  // Utlägg att godkänna
  const pendingExpenses = chair?.pendingExpenses ?? treasurer?.pendingExpenses ?? 0;
  if (canApproveExpenses && pendingExpenses > 0) {
    cards.push(
      <CountCard key="expenses" icon={Receipt} label="Utlägg att godkänna" count={pendingExpenses} href="/ekonomi/utlagg" color="amber" />
    );
  }

  // Överlåtelser
  if (canReviewTransfers && chair && chair.pendingTransfers > 0) {
    cards.push(
      <CountCard key="transfers" icon={ArrowRightLeft} label="Överlåtelser" count={chair.pendingTransfers} href="/styrelse/overlatelser" color="purple"
        alert={chair.overdueTransfers > 0 ? `${chair.overdueTransfers} försenade` : undefined} />
    );
  }

  // Lägenheter utan ägare
  if (canReviewApplications && chair && chair.unownedApartments > 0) {
    cards.push(
      <CountCard key="unowned" icon={AlertTriangle} label="Utan ägare" count={chair.unownedApartments} href="/medlem/lagenheter" color="red"
        alert="Lägenheter utan registrerad ägare" />
    );
  }

  // Kassör: Utbetalat denna månad
  if (canManageFinancials && treasurer) {
    cards.push(
      <Link key="paid" href="/ekonomi/utlagg" className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-green-50 text-green-600"><Banknote className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-gray-500">Utbetalat denna månad</p>
            <p className="text-xl font-bold text-gray-900">{treasurer.thisMonthPaid.toLocaleString("sv-SE")} kr</p>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-400">Förra månaden: {treasurer.lastMonthPaid.toLocaleString("sv-SE")} kr</p>
      </Link>
    );
  }

  // Godkända ej betalda
  if (canManageFinancials && treasurer && treasurer.approvedUnpaid > 0) {
    cards.push(
      <CountCard key="unpaid" icon={Receipt} label="Godkända, ej betalda" count={treasurer.approvedUnpaid} href="/ekonomi/utlagg" color="amber" />
    );
  }

  // Obetalda överlåtelseavgifter
  if (canManageFinancials && treasurer && treasurer.pendingTransferFees > 0) {
    cards.push(
      <CountCard key="transferfees" icon={ArrowRightLeft} label="Obetalda överlåtelseavgifter" count={treasurer.pendingTransferFees} href="/styrelse/overlatelser" color="purple" />
    );
  }

  // Felanmälningar
  if (canManageReports && property && property.openReports > 0) {
    cards.push(
      <CountCard key="reports" icon={Wrench} label="Felanmälningar" count={property.openReports} href="/boende/skadeanmalan" color="red"
        alert={property.criticalReports > 0 ? `${property.criticalReports} kritiska` : undefined} />
    );
  }

  // Avtal som löper ut
  const expiringCount = expiringContracts?.length ?? 0;
  if (canViewContracts && expiringCount > 0) {
    cards.push(
      <CountCard key="contracts" icon={FileWarning} label="Avtal löper ut (90 dagar)" count={expiringCount} href="/ekonomi/avtal" color="amber" />
    );
  }

  // Försenade besiktningar
  const overdueCount = overdueInspections?.length ?? 0;
  if (canManageReports && overdueCount > 0) {
    cards.push(
      <CountCard key="inspections" icon={ShieldCheck} label="Försenade besiktningar" count={overdueCount} href="/forvaltning/besiktningar" color="red" />
    );
  }

  // Upphandlingar
  if (canViewProcurement && procurement && procurement.awaitingDecision > 0) {
    cards.push(
      <CountCard key="procurement" icon={ClipboardList} label="Upphandlingar väntar beslut" count={procurement.awaitingDecision} href="/ekonomi/upphandlingar" color="blue" />
    );
  }

  // Miljö — öppna incidenter
  if (canManageEnvironment && environment && environment.openIncidents > 0) {
    cards.push(
      <CountCard key="env-incidents" icon={Leaf} label="Miljöincidenter" count={environment.openIncidents} href="/miljo/incidenter" color="red" />
    );
  }

  // Miljö — förfallna riskbedömningar
  if (canManageEnvironment && environment && environment.overdueRiskReviews > 0) {
    cards.push(
      <CountCard key="env-risks" icon={Leaf} label="Riskbedömningar att granska" count={environment.overdueRiskReviews} href="/miljo/risker" color="amber" />
    );
  }

  // Miljö — inget egenkontrollprogram
  if (canManageEnvironment && environment && !environment.activeEgenkontroll) {
    cards.push(
      <CountCard key="env-egenkontroll" icon={Leaf} label="Egenkontroll saknas" count={0} href="/miljo/egenkontroll" color="red"
        alert="Lagkrav — skapa egenkontrollprogram" />
    );
  }

  if (cards.length === 0) return null;

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Kräver uppmärksamhet</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards}
      </div>
    </div>
  );
}

// ─── Hjälpkomponenter ─────────────────────────────────────────────

function SinceLastBadge({ count, label, href }: { count: number; label: string; href: string }) {
  if (count === 0) return null;
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600">
      <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
        {count}
      </span>
      {label}
    </Link>
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
