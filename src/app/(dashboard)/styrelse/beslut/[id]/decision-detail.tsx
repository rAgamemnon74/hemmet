"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, Vote, Check, X, Minus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, DecisionMethod } from "@prisma/client";

type DecisionData = {
  id: string;
  reference: string;
  title: string;
  description: string;
  decisionText: string;
  decidedAt: Date;
  method: DecisionMethod;
  voteRequestedBy: string | null;
  voteRequestedReason: string | null;
  votesFor: number | null;
  votesAgainst: number | null;
  votesAbstained: number | null;
  meeting: { id: string; title: string; scheduledAt: Date; type: string };
  agendaItem: { id: string; sortOrder: number; title: string } | null;
  voteRecords: Array<{
    id: string;
    voterId: string;
    voterName: string;
    choice: string;
    castAt: Date;
  }>;
  _count: { tasks: number };
};

type BoardMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Array<{ role: string }>;
};

const methodLabels: Record<DecisionMethod, string> = {
  ACCLAMATION: "Acklamation (enkel majoritet)",
  ROLL_CALL: "Votering med namnupprop",
  COUNTED: "Votering med räknade röster",
};

const choiceLabels: Record<string, string> = {
  YES: "Ja",
  NO: "Nej",
  ABSTAIN: "Avstår",
};

const choiceIcons: Record<string, typeof Check> = {
  YES: Check,
  NO: X,
  ABSTAIN: Minus,
};

const choiceColors: Record<string, string> = {
  YES: "text-green-700 bg-green-50",
  NO: "text-red-700 bg-red-50",
  ABSTAIN: "text-gray-500 bg-gray-50",
};

export function DecisionDetail({
  decision,
  boardMembers,
}: {
  decision: DecisionData;
  boardMembers: BoardMember[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canEdit = hasPermission(userRoles, "meeting:edit");

  const addVote = trpc.decision.addVoteRecord.useMutation({
    onSuccess: () => router.refresh(),
  });
  const removeVote = trpc.decision.removeVoteRecord.useMutation({
    onSuccess: () => router.refresh(),
  });

  const votedIds = new Set(decision.voteRecords.map((v) => v.voterId));
  const unvotedMembers = boardMembers.filter((m) => !votedIds.has(m.id));

  const yesCount = decision.voteRecords.filter((v) => v.choice === "YES").length;
  const noCount = decision.voteRecords.filter((v) => v.choice === "NO").length;
  const abstainCount = decision.voteRecords.filter((v) => v.choice === "ABSTAIN").length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/styrelse/beslut"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till beslutslogg
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-600">
              {decision.reference}
            </span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {methodLabels[decision.method]}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{decision.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{decision.description}</p>
          <div className="mt-4 rounded-md bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">Beslut:</p>
            <p className="mt-1 text-sm text-blue-800 whitespace-pre-wrap">
              {decision.decisionText}
            </p>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {decision.meeting.title} — {format(new Date(decision.decidedAt), "d MMMM yyyy", { locale: sv })}
            {decision.agendaItem && ` — §${decision.agendaItem.sortOrder} ${decision.agendaItem.title}`}
          </div>
        </div>

        {/* Votering request */}
        {decision.voteRequestedBy && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Votering begärd</p>
            <p className="mt-1 text-sm text-amber-800">
              <span className="font-medium">Av:</span> {decision.voteRequestedBy}
            </p>
            {decision.voteRequestedReason && (
              <p className="mt-1 text-sm text-amber-700">
                <span className="font-medium">Anledning:</span> {decision.voteRequestedReason}
              </p>
            )}
          </div>
        )}

        {/* Counted votes */}
        {decision.method === "COUNTED" && decision.votesFor !== null && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Röstresultat
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-3xl font-bold text-green-700">{decision.votesFor}</p>
                <p className="mt-1 text-sm text-green-600">Ja</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-3xl font-bold text-red-700">{decision.votesAgainst ?? 0}</p>
                <p className="mt-1 text-sm text-red-600">Nej</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-3xl font-bold text-gray-600">{decision.votesAbstained ?? 0}</p>
                <p className="mt-1 text-sm text-gray-500">Avstår</p>
              </div>
            </div>
          </div>
        )}

        {/* Roll call votes */}
        {decision.method === "ROLL_CALL" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Individuella röster
            </h2>

            {decision.voteRecords.length > 0 && (
              <div className="mb-4 flex gap-4 text-sm">
                <span className="text-green-700">Ja: {yesCount}</span>
                <span className="text-red-700">Nej: {noCount}</span>
                <span className="text-gray-500">Avstår: {abstainCount}</span>
              </div>
            )}

            {decision.voteRecords.length > 0 ? (
              <div className="rounded-md border border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="px-3 py-2">Namn</th>
                      <th className="px-3 py-2">Röst</th>
                      {canEdit && <th className="px-3 py-2 w-16"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {decision.voteRecords.map((v) => {
                      const Icon = choiceIcons[v.choice];
                      return (
                        <tr key={v.id}>
                          <td className="px-3 py-2 text-sm text-gray-900">{v.voterName}</td>
                          <td className="px-3 py-2">
                            <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium", choiceColors[v.choice])}>
                              <Icon className="h-3 w-3" />
                              {choiceLabels[v.choice]}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="px-3 py-2">
                              <button
                                onClick={() => removeVote.mutate({ id: v.id })}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Ta bort
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Inga individuella röster dokumenterade.</p>
            )}

            {/* Add vote */}
            {canEdit && unvotedMembers.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                  <UserPlus className="h-3.5 w-3.5" />
                  Lägg till röst
                </p>
                <div className="space-y-1">
                  {unvotedMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-1.5">
                      <span className="text-sm text-gray-700">
                        {m.firstName} {m.lastName}
                      </span>
                      <div className="flex gap-1">
                        {(["YES", "NO", "ABSTAIN"] as const).map((choice) => {
                          const Icon = choiceIcons[choice];
                          return (
                            <button
                              key={choice}
                              onClick={() =>
                                addVote.mutate({
                                  decisionId: decision.id,
                                  voterId: m.id,
                                  voterName: `${m.firstName} ${m.lastName}`,
                                  choice,
                                })
                              }
                              disabled={addVote.isPending}
                              className={cn(
                                "rounded px-2 py-1 text-xs font-medium transition-colors",
                                choiceColors[choice],
                                "hover:opacity-80"
                              )}
                            >
                              <Icon className="h-3 w-3 inline mr-0.5" />
                              {choiceLabels[choice]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
