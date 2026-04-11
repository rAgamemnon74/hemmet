"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  CalendarDays, AlertTriangle, CheckSquare, FileText, Receipt,
  ArrowRightLeft, Lightbulb, Wrench, UserPlus, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const priorityColors: Record<string, string> = {
  URGENT: "text-red-600",
  HIGH: "text-amber-600",
  MEDIUM: "text-blue-600",
  LOW: "text-gray-500",
};

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-amber-100 text-amber-700",
  NORMAL: "bg-blue-100 text-blue-700",
  LOW: "bg-gray-100 text-gray-500",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const isBoard = userRoles.some((r) => r.startsWith("BOARD_") || r === "ADMIN");
  const isChairperson = hasPermission(userRoles, "transfer:review");
  const isTreasurer = hasPermission(userRoles, "transfer:manage_financial");
  const isPropertyMgr = hasPermission(userRoles, "report:manage");

  const boardQuery = trpc.dashboard.boardOverview.useQuery(undefined, { enabled: isBoard });
  const chairQuery = trpc.dashboard.chairpersonOverview.useQuery(undefined, { enabled: isChairperson });
  const treasurerQuery = trpc.dashboard.treasurerOverview.useQuery(undefined, { enabled: isTreasurer });
  const propertyQuery = trpc.dashboard.propertyOverview.useQuery(undefined, { enabled: isPropertyMgr });

  const board = boardQuery.data;
  const chair = chairQuery.data;
  const treasurer = treasurerQuery.data;
  const property = propertyQuery.data;
  const loading = boardQuery.isLoading;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Välkommen, {session?.user?.name?.split(" ")[0]}
      </h1>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* Board overview: next meeting + since last */}
      {board && (
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          {/* Next meeting */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" /> Nästa möte
            </h2>
            {board.nextMeeting ? (
              <Link href={`/styrelse/moten/${board.nextMeeting.id}`} className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                <p className="text-lg font-bold text-gray-900">{board.nextMeeting.title}</p>
                <p className="text-sm text-gray-500">{format(new Date(board.nextMeeting.scheduledAt), "EEEE d MMMM 'kl.' HH:mm", { locale: sv })}</p>
                <p className="text-xs text-gray-400 mt-1">{board.nextMeeting._count.agendaItems} dagordningspunkter</p>
              </Link>
            ) : (
              <p className="text-sm text-gray-400">Inget möte planerat.</p>
            )}
          </div>

          {/* Since last meeting */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Sedan förra mötet
            </h2>
            {board.lastMeeting ? (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  Sedan {format(new Date(board.lastMeeting.sinceDate), "d MMM", { locale: sv })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {board.sinceLast.newTasks > 0 && <SinceItem icon={CheckSquare} label="Nya uppgifter" count={board.sinceLast.newTasks} />}
                  {board.sinceLast.newMotions > 0 && <SinceItem icon={FileText} label="Motioner" count={board.sinceLast.newMotions} />}
                  {board.sinceLast.newSuggestions > 0 && <SinceItem icon={Lightbulb} label="Förslag" count={board.sinceLast.newSuggestions} />}
                  {board.sinceLast.newDamageReports > 0 && <SinceItem icon={Wrench} label="Felanmälningar" count={board.sinceLast.newDamageReports} />}
                  {board.sinceLast.newExpenses > 0 && <SinceItem icon={Receipt} label="Utlägg" count={board.sinceLast.newExpenses} />}
                  {board.sinceLast.newTransfers > 0 && <SinceItem icon={ArrowRightLeft} label="Överlåtelser" count={board.sinceLast.newTransfers} />}
                  {board.sinceLast.pendingProtocols > 0 && (
                    <div className="col-span-2 rounded bg-amber-50 border border-amber-200 p-2 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs text-amber-700">{board.sinceLast.pendingProtocols} protokoll väntar på slutbehandling</span>
                    </div>
                  )}
                  {Object.values(board.sinceLast).every((v) => v === 0) && (
                    <p className="col-span-2 text-xs text-gray-400">Lugnt — inget nytt.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Inget tidigare möte.</p>
            )}
          </div>
        </div>
      )}

      {/* Role-specific cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {chair && (
          <>
            <CountCard icon={UserPlus} label="Ansökningar" count={chair.pendingApplications} href="/medlem/ansokningar" color="blue" />
            <CountCard icon={Receipt} label="Utlägg att godkänna" count={chair.pendingExpenses} href="/styrelse/utlagg" color="amber" />
            <CountCard icon={ArrowRightLeft} label="Överlåtelser" count={chair.pendingTransfers} href="/styrelse/overlatelser" color="purple"
              alert={chair.overdueTransfers > 0 ? `${chair.overdueTransfers} försenade` : undefined} />
            <CountCard icon={FileText} label="Motioner att svara" count={chair.pendingMotions} href="/medlem/motioner" color="indigo" />
          </>
        )}
        {treasurer && !chair && (
          <>
            <CountCard icon={Receipt} label="Utlägg att godkänna" count={treasurer.pendingExpenses} href="/styrelse/utlagg" color="amber" />
            <CountCard icon={ArrowRightLeft} label="Obetalda överlåtelseavgifter" count={treasurer.pendingTransferFees} href="/styrelse/overlatelser" color="purple" />
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">Utbetalat denna månad</p>
              <p className="text-xl font-bold text-gray-900">{treasurer.thisMonthPaid.toLocaleString("sv-SE")} kr</p>
              <p className="text-xs text-gray-400">Förra månaden: {treasurer.lastMonthPaid.toLocaleString("sv-SE")} kr</p>
            </div>
          </>
        )}
        {property && (
          <>
            <CountCard icon={Wrench} label="Öppna felanmälningar" count={property.openReports} href="/boende/skadeanmalan" color="red"
              alert={property.criticalReports > 0 ? `${property.criticalReports} kritiska` : undefined} />
          </>
        )}
      </div>

      {/* My tasks */}
      {board && board.myTasks.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-green-500" /> Mina uppgifter
          </h2>
          <div className="space-y-2">
            {board.myTasks.map((t) => (
              <Link key={t.id} href={`/styrelse/arenden/${t.id}`}
                className="flex items-center justify-between rounded p-2 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold", priorityColors[t.priority])}>{t.priority === "URGENT" ? "!" : t.priority === "HIGH" ? "↑" : "·"}</span>
                  <span className="text-sm text-gray-900">{t.title}</span>
                </div>
                {t.dueDate && (
                  <span className="text-xs text-gray-400">{format(new Date(t.dueDate), "d MMM", { locale: sv })}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Property manager: recent reports */}
      {property && property.recentReports.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-500" /> Felanmälningar att hantera
          </h2>
          <div className="space-y-2">
            {property.recentReports.map((r) => (
              <Link key={r.id} href={`/boende/skadeanmalan/${r.id}`}
                className="flex items-center justify-between rounded p-2 hover:bg-gray-50">
                <div>
                  <span className="text-sm text-gray-900">{r.title}</span>
                  <span className="ml-2 text-xs text-gray-400">{r.location}</span>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", severityColors[r.severity])}>
                  {r.severity}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Non-board member: simple welcome */}
      {!isBoard && !loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/min-sida" className="rounded-lg border border-gray-200 bg-white p-6 hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900">Min sida</h2>
            <p className="text-sm text-gray-500 mt-1">Se din profil, lägenhet och ärenden.</p>
          </Link>
          <Link href="/boende/skadeanmalan/ny" className="rounded-lg border border-gray-200 bg-white p-6 hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900">Felanmälan</h2>
            <p className="text-sm text-gray-500 mt-1">Rapportera skador eller fel i fastigheten.</p>
          </Link>
        </div>
      )}
    </div>
  );
}

function SinceItem({ icon: Icon, label, count }: { icon: typeof FileText; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
      <span className="text-xs text-gray-600">{count} {label.toLowerCase()}</span>
    </div>
  );
}

function CountCard({ icon: Icon, label, count, href, color, alert }: {
  icon: typeof FileText; label: string; count: number; href: string;
  color: "blue" | "amber" | "red" | "green" | "purple" | "indigo";
  alert?: string;
}) {
  const bg = { blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", red: "bg-red-50 text-red-600", green: "bg-green-50 text-green-600", purple: "bg-purple-50 text-purple-600", indigo: "bg-indigo-50 text-indigo-600" };
  return (
    <Link href={href} className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-lg p-2", bg[color])}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
      </div>
      {alert && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3" /> {alert}
        </div>
      )}
    </Link>
  );
}
