"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Search, BookOpen, Vote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DecisionMethod } from "@prisma/client";

type Decision = {
  id: string;
  reference: string;
  title: string;
  description: string;
  decisionText: string;
  decidedAt: Date;
  method: DecisionMethod;
  votesFor: number | null;
  votesAgainst: number | null;
  votesAbstained: number | null;
  voteRequestedBy: string | null;
  meeting: { title: string; scheduledAt: Date; type: string };
  _count: { tasks: number; voteRecords: number };
};

const typeLabels: Record<string, string> = {
  BOARD: "Styrelsemöte",
  ANNUAL: "Årsmöte",
  EXTRAORDINARY: "Extra stämma",
};

const methodLabels: Record<DecisionMethod, string> = {
  ACCLAMATION: "Acklamation",
  ROLL_CALL: "Votering (namnupprop)",
  COUNTED: "Votering (räknade)",
};

const methodColors: Record<DecisionMethod, string> = {
  ACCLAMATION: "bg-green-100 text-green-700",
  ROLL_CALL: "bg-blue-100 text-blue-700",
  COUNTED: "bg-purple-100 text-purple-700",
};

export function DecisionLog({ initialData }: { initialData: Decision[] }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? initialData.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.reference.toLowerCase().includes(search.toLowerCase()) ||
          d.decisionText.toLowerCase().includes(search.toLowerCase())
      )
    : initialData;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Beslutslogg</h1>
        <p className="mt-1 text-sm text-gray-500">
          Alla beslut fattade i styrelsemöten och stämmor
        </p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök beslut..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {search ? "Inga beslut matchar sökningen" : "Inga beslut ännu"}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((decision) => (
            <Link
              key={decision.id}
              href={`/styrelse/beslut/${decision.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-600">
                      {decision.reference}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {decision.title}
                    </h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", methodColors[decision.method])}>
                      {methodLabels[decision.method]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap line-clamp-2">
                    {decision.decisionText}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {typeLabels[decision.meeting.type]}: {decision.meeting.title}
                    </span>
                    {decision.method === "COUNTED" && decision.votesFor !== null && (
                      <span className="flex items-center gap-1">
                        <Vote className="h-3 w-3" />
                        {decision.votesFor}–{decision.votesAgainst ?? 0}
                        {decision.votesAbstained ? ` (${decision.votesAbstained} avstod)` : ""}
                      </span>
                    )}
                    {decision._count.voteRecords > 0 && (
                      <span className="flex items-center gap-1">
                        <Vote className="h-3 w-3" />
                        {decision._count.voteRecords} individuella röster
                      </span>
                    )}
                    {decision._count.tasks > 0 && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                        {decision._count.tasks} uppföljningsärenden
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {format(new Date(decision.decidedAt), "d MMM yyyy", { locale: sv })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
