"use client";

import { useParams } from "next/navigation";
import { Home, CheckCircle, Clock, FileText, Lightbulb, Vote } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { AttendanceQR } from "@/components/meeting/attendance-qr";

export default function PresentationPage() {
  const params = useParams();
  const meetingId = params.id as string;

  const stateQuery = trpc.meetingLive.getState.useQuery(
    { meetingId },
    { refetchInterval: 5000 }
  );

  const meeting = stateQuery.data;

  if (!meeting) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  const activeItem = meeting.agendaItems.find((item) => item.id === meeting.activeAgendaItemId);
  const activeIndex = meeting.agendaItems.findIndex((item) => item.id === meeting.activeAgendaItemId);
  const isWaiting = meeting.status === "DRAFT" || meeting.status === "SCHEDULED";
  const isFinished = meeting.status === "COMPLETED" || meeting.status === "FINALIZING";

  const subItems = getSubItems(activeItem, meeting);
  const activeSubItem = meeting.activeSubItemId
    ? subItems.find((s) => s.id === meeting.activeSubItemId)
    : null;

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex">
      {/* Left: Agenda with sub-items */}
      <div className="w-80 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">Hemmet</span>
          </div>
          <h1 className="text-lg font-bold">{meeting.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{meeting._count.attendances} närvarande</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-0.5">
            {meeting.agendaItems.map((item, i) => {
              const isActive = item.id === meeting.activeAgendaItemId;
              const isPast = activeIndex >= 0 && i < activeIndex;
              const hasDecision = item.decisions.length > 0;
              const itemSubItems = getSubItems(item, meeting);

              return (
                <div key={item.id}>
                  <div className={cn(
                    "rounded-lg px-3 py-2.5 transition-all",
                    isActive && !activeSubItem ? "bg-blue-600 text-white" :
                    isActive ? "bg-blue-900/50 text-blue-200" :
                    isPast ? "bg-gray-700/50 text-gray-400" : "text-gray-300"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isActive && !activeSubItem ? "bg-white text-blue-600" :
                        isActive ? "bg-blue-700 text-blue-200" :
                        isPast ? "bg-gray-600 text-gray-400" : "bg-gray-700 text-gray-400"
                      )}>
                        {isPast && hasDecision ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span className={cn("text-sm", (isActive && !activeSubItem) && "font-semibold")}>
                        {item.title}
                      </span>
                    </div>
                  </div>

                  {isActive && itemSubItems.length > 0 && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {itemSubItems.map((sub, si) => {
                        const isSubActive = sub.id === meeting.activeSubItemId;
                        return (
                          <div key={sub.id} className={cn(
                            "rounded px-3 py-1.5 text-xs flex items-center gap-2",
                            isSubActive ? "bg-blue-600 text-white font-semibold" : "text-blue-300/70"
                          )}>
                            {sub.type === "motion" ? <FileText className="h-3 w-3 shrink-0" /> : <Lightbulb className="h-3 w-3 shrink-0" />}
                            <span>§{i + 1}.{si + 1} {sub.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Content */}
      <div className="flex-1 flex items-center justify-center p-12">
        {isWaiting && (
          <div className="text-center">
            <Clock className="mx-auto h-24 w-24 text-gray-600 mb-8" />
            <h2 className="text-4xl font-bold text-gray-300">Väntar på att mötet öppnas</h2>
            <p className="mt-4 text-xl text-gray-500">{meeting.title}</p>
          </div>
        )}

        {isFinished && !activeItem && (
          <div className="text-center">
            <CheckCircle className="mx-auto h-24 w-24 text-green-500 mb-8" />
            <h2 className="text-4xl font-bold text-gray-300">Mötet är avslutat</h2>
          </div>
        )}

        {/* Main agenda item (no sub-item active) */}
        {activeItem && !activeSubItem && (
          <div className="max-w-3xl w-full">
            <div className="mb-2 text-blue-400 text-lg font-medium">
              § {activeIndex + 1} av {meeting.agendaItems.length}
            </div>
            <h2 className="text-5xl font-bold leading-tight mb-8">{activeItem.title}</h2>
            {activeItem.description && (
              <p className="text-xl text-gray-300 leading-relaxed mb-8">{activeItem.description}</p>
            )}

            {/* QR code for self-registration during OPENING and ATTENDANCE */}
            {(activeItem.specialType === "OPENING" || activeItem.specialType === "ATTENDANCE") && (
              <div className="mb-8">
                <AttendanceQR meetingId={meetingId} variant="dark" />
              </div>
            )}

            {/* ATTENDANCE: Show attendance count */}
            {activeItem.specialType === "ATTENDANCE" && (() => {
              const present = meeting.attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY");
              return (
                <div className="rounded-xl bg-gray-800 border border-gray-700 p-8">
                  <div className="text-center mb-6">
                    <p className="text-7xl font-bold text-white">{present.length}</p>
                    <p className="text-xl text-gray-400 mt-2">
                      närvarande av {meeting.attendances.length} registrerade
                    </p>
                  </div>
                  {present.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 max-w-2xl mx-auto">
                      {present.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-lg text-gray-200">
                          <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                          <span>{a.user.firstName} {a.user.lastName}</span>
                          {a.status === "PROXY" && (
                            <span className="text-sm text-blue-400">(ombud)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ELECT_CHAIR: Show selected */}
            {activeItem.specialType === "ELECT_CHAIR" && (
              <div className="rounded-xl bg-gray-800 border border-gray-700 p-8">
                {meeting.meetingChairpersonId ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-400 uppercase mb-2">Vald mötesordförande</p>
                    <p className="text-4xl font-bold text-white">
                      {meeting.attendances.find((a) => a.user.id === meeting.meetingChairpersonId)?.user.firstName}{" "}
                      {meeting.attendances.find((a) => a.user.id === meeting.meetingChairpersonId)?.user.lastName}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl text-gray-500 text-center">Inväntar val...</p>
                )}
              </div>
            )}

            {/* ELECT_SECRETARY: Show selected */}
            {activeItem.specialType === "ELECT_SECRETARY" && (
              <div className="rounded-xl bg-gray-800 border border-gray-700 p-8">
                {meeting.meetingSecretaryId ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-400 uppercase mb-2">Vald mötessekreterare</p>
                    <p className="text-4xl font-bold text-white">
                      {meeting.attendances.find((a) => a.user.id === meeting.meetingSecretaryId)?.user.firstName}{" "}
                      {meeting.attendances.find((a) => a.user.id === meeting.meetingSecretaryId)?.user.lastName}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl text-gray-500 text-center">Inväntar val...</p>
                )}
              </div>
            )}

            {/* ELECT_ADJUSTERS: Show selected */}
            {activeItem.specialType === "ELECT_ADJUSTERS" && (
              <div className="rounded-xl bg-gray-800 border border-gray-700 p-8">
                {meeting.adjusters.length > 0 ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-400 uppercase mb-4">Valda justerare</p>
                    <div className="space-y-2">
                      {meeting.adjusters.map((id) => {
                        const a = meeting.attendances.find((att) => att.user.id === id);
                        return a ? (
                          <p key={id} className="text-3xl font-bold text-white">
                            {a.user.firstName} {a.user.lastName}
                          </p>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl text-gray-500 text-center">Inväntar val...</p>
                )}
              </div>
            )}

            {activeItem.decisions.map((d) => <DecisionCard key={d.id} decision={d} />)}

            {subItems.length > 0 && (
              <div className="mt-8 rounded-xl bg-gray-800 border border-gray-700 p-6 space-y-2">
                {subItems.filter((s) => s.type === "motion").length > 0 && (
                  <p className="flex items-center gap-2 text-lg text-purple-400">
                    <FileText className="h-5 w-5" />
                    {subItems.filter((s) => s.type === "motion").length} motioner att behandla
                  </p>
                )}
                {subItems.filter((s) => s.type === "suggestion").length > 0 && (
                  <p className="flex items-center gap-2 text-lg text-amber-400">
                    <Lightbulb className="h-5 w-5" />
                    {subItems.filter((s) => s.type === "suggestion").length} förslag att behandla
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active sub-item detail */}
        {activeItem && activeSubItem && (
          <div className="max-w-3xl w-full">
            <div className="mb-2 text-blue-400 text-lg font-medium">
              § {activeIndex + 1}.{subItems.indexOf(activeSubItem) + 1}
              <span className="text-gray-500 ml-2">({activeSubItem.type === "motion" ? "Motion" : "Förslag"})</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-6">{activeSubItem.title}</h2>

            {activeSubItem.type === "motion" && activeSubItem.motion && (
              <div className="space-y-6">
                <div className="rounded-xl bg-blue-900/20 border border-blue-700 p-6">
                  <p className="text-sm text-blue-400 font-medium mb-2">Yrkande</p>
                  <p className="text-lg text-blue-100">{activeSubItem.motion.proposal}</p>
                </div>

                {activeSubItem.motion.boardResponse && (
                  <div className="rounded-xl bg-purple-900/20 border border-purple-700 p-6">
                    <p className="text-sm text-purple-400 font-medium mb-2">Styrelsens yttrande</p>
                    <p className="text-lg text-purple-100">{activeSubItem.motion.boardResponse}</p>
                  </div>
                )}

                {activeSubItem.motion.voteProposals.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400 font-medium uppercase">Omröstningsförslag</p>
                    {activeSubItem.motion.voteProposals.map((p) => (
                      <div key={p.id} className={cn(
                        "rounded-xl border p-5",
                        p.adopted ? "bg-green-900/30 border-green-700" : "bg-gray-800 border-gray-700"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <Vote className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-200">{p.label}</span>
                          {p.adopted && <span className="text-xs text-green-400 font-bold">ANTAGET</span>}
                        </div>
                        <p className="text-gray-300">{p.description}</p>
                        {p.votesFor !== null && (
                          <div className="mt-3 flex gap-6 text-lg">
                            <span className="text-green-300">Ja: {p.votesFor}</span>
                            <span className="text-red-300">Nej: {p.votesAgainst ?? 0}</span>
                            <span className="text-gray-400">Avstår: {p.votesAbstained ?? 0}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSubItem.type === "suggestion" && activeSubItem.suggestion && (
              <div className="space-y-6">
                <div className="rounded-xl bg-amber-900/20 border border-amber-700 p-6">
                  <p className="text-lg text-amber-100 leading-relaxed">{activeSubItem.suggestion.description}</p>
                  <p className="text-sm text-amber-400 mt-3">Av {activeSubItem.suggestion.author.firstName} {activeSubItem.suggestion.author.lastName}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!isWaiting && !isFinished && !activeItem && (
          <div className="text-center">
            <p className="text-2xl text-gray-500">Ingen punkt vald — väntar på ordföranden</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionCard({ decision: d }: { decision: { id: string; reference: string; decisionText: string; method: string; votesFor: number | null; votesAgainst: number | null; votesAbstained: number | null } }) {
  return (
    <div className="rounded-xl bg-green-900/30 border border-green-700 p-6 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <span className="text-sm font-mono text-green-400">{d.reference}</span>
      </div>
      <p className="text-xl text-green-100">{d.decisionText}</p>
      {d.method === "COUNTED" && d.votesFor !== null && (
        <div className="mt-4 flex gap-6 text-lg">
          <span className="text-green-300">Ja: {d.votesFor}</span>
          <span className="text-red-300">Nej: {d.votesAgainst ?? 0}</span>
          <span className="text-gray-400">Avstår: {d.votesAbstained ?? 0}</span>
        </div>
      )}
    </div>
  );
}

type SubItem = {
  id: string; title: string; type: "motion" | "suggestion";
  motion?: { proposal: string; boardResponse: string | null; voteProposals: Array<{ id: string; label: string; description: string; adopted: boolean; votesFor: number | null; votesAgainst: number | null; votesAbstained: number | null }> };
  suggestion?: { description: string; author: { firstName: string; lastName: string } };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSubItems(activeItem: any, meeting: any): SubItem[] {
  if (!activeItem) return [];
  const items: SubItem[] = [];
  if (activeItem.specialType === "MOTIONS") {
    for (const m of meeting.motions ?? []) items.push({ id: m.id, title: m.title, type: "motion", motion: { proposal: m.proposal, boardResponse: m.boardResponse, voteProposals: m.voteProposals } });
  }
  if (activeItem.specialType === "BOARD_MATTERS") {
    for (const m of meeting.pendingMotions ?? []) items.push({ id: m.id, title: m.title, type: "motion", motion: { proposal: m.proposal, boardResponse: m.boardResponse, voteProposals: m.voteProposals } });
    for (const s of meeting.pendingSuggestions ?? []) items.push({ id: s.id, title: s.title, type: "suggestion", suggestion: { description: s.description, author: s.author } });
  }
  return items;
}
