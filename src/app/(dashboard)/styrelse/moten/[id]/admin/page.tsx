"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Play, ChevronLeft, ChevronRight, CheckCircle,
  Gavel, Monitor, Vote, FileText, Square, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { DecisionMethod } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSubItems(activeItem: any, meeting: any) {
  if (!activeItem) return [];
  const items: Array<{ id: string; title: string; type: "motion" | "suggestion" }> = [];
  if (activeItem.specialType === "MOTIONS") {
    for (const m of meeting.motions ?? []) items.push({ id: m.id, title: m.title, type: "motion" });
  }
  if (activeItem.specialType === "BOARD_MATTERS") {
    for (const m of meeting.pendingMotions ?? []) items.push({ id: m.id, title: m.title, type: "motion" });
    for (const s of meeting.pendingSuggestions ?? []) items.push({ id: s.id, title: s.title, type: "suggestion" });
  }
  return items;
}

export default function MeetingAdminPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const stateQuery = trpc.meetingLive.getState.useQuery({ meetingId }, { refetchInterval: 3000 });
  const setActiveItem = trpc.meetingLive.setActiveItem.useMutation({ onSuccess: () => stateQuery.refetch() });
  const setActiveSubItem = trpc.meetingLive.setActiveSubItem.useMutation({ onSuccess: () => stateQuery.refetch() });
  const updateMeeting = trpc.meeting.update.useMutation({ onSuccess: () => stateQuery.refetch() });
  const quickDecision = trpc.meetingLive.quickDecision.useMutation({ onSuccess: () => stateQuery.refetch() });
  const updateAttendance = trpc.attendance.update.useMutation({ onSuccess: () => stateQuery.refetch() });
  const updateMeetingRoles = trpc.meeting.update.useMutation({ onSuccess: () => stateQuery.refetch() });
  const updateNotes = trpc.agenda.updateNotes.useMutation();

  const [decisionForm, setDecisionForm] = useState({ title: "", decisionText: "", method: "ACCLAMATION" as DecisionMethod, votesFor: "", votesAgainst: "", votesAbstained: "" });
  const [notesValue, setNotesValue] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimerRef = { current: null as NodeJS.Timeout | null };
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [recusals, setRecusals] = useState<Record<string, string>>({});  // userId → reason

  const declareRecusal = trpc.decision.declareRecusal.useMutation({ onSuccess: () => stateQuery.refetch() });

  const meeting = stateQuery.data;
  if (!meeting) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  const activeItem = meeting.agendaItems.find((item) => item.id === meeting.activeAgendaItemId);
  const activeIndex = meeting.agendaItems.findIndex((item) => item.id === meeting.activeAgendaItemId);
  const isRunning = meeting.status === "IN_PROGRESS";
  const canControl = isRunning || meeting.status === "FINALIZING";

  const subItems = getSubItems(activeItem, meeting);
  const activeSubIndex = meeting.activeSubItemId ? subItems.findIndex((s) => s.id === meeting.activeSubItemId) : -1;
  const activeSubItem = activeSubIndex >= 0 ? subItems[activeSubIndex] : null;

  // Get full data for active sub-item
  const activeMotionDetail = activeSubItem?.type === "motion"
    ? [...(meeting.motions ?? []), ...(meeting.pendingMotions ?? [])].find((m) => m.id === activeSubItem.id)
    : null;
  const activeSuggestionDetail = activeSubItem?.type === "suggestion"
    ? (meeting.pendingSuggestions ?? []).find((s) => s.id === activeSubItem.id)
    : null;

  function goToItem(index: number) {
    const item = meeting!.agendaItems[index];
    if (item) setActiveItem.mutate({ meetingId, agendaItemId: item.id });
  }

  function handleNav(direction: "prev" | "next") {
    // If we're in a sub-item, navigate within sub-items first
    if (activeSubItem && subItems.length > 0) {
      const newIndex = direction === "next" ? activeSubIndex + 1 : activeSubIndex - 1;
      if (newIndex >= 0 && newIndex < subItems.length) {
        setActiveSubItem.mutate({ meetingId, type: subItems[newIndex].type, id: subItems[newIndex].id });
        return;
      }
      // Exiting sub-items
      if (direction === "prev" && activeSubIndex === 0) {
        setActiveSubItem.mutate({ meetingId, type: null, id: null }); // Back to parent
        return;
      }
      if (direction === "next" && activeSubIndex === subItems.length - 1) {
        // Move to next agenda item
        if (activeIndex < meeting!.agendaItems.length - 1) goToItem(activeIndex + 1);
        return;
      }
    }
    // If we're on a special point with sub-items and pressing next, enter sub-items
    if (!activeSubItem && subItems.length > 0 && direction === "next") {
      setActiveSubItem.mutate({ meetingId, type: subItems[0].type, id: subItems[0].id });
      return;
    }
    // Normal navigation
    if (direction === "prev" && activeIndex > 0) goToItem(activeIndex - 1);
    if (direction === "next" && activeIndex < meeting!.agendaItems.length - 1) goToItem(activeIndex + 1);
  }

  function handleStartMeeting() {
    updateMeeting.mutate({ id: meetingId, status: "IN_PROGRESS" });
    if (meeting!.agendaItems.length > 0) {
      setActiveItem.mutate({ meetingId, agendaItemId: meeting!.agendaItems[0].id });
    }
  }

  function handleQuickDecision() {
    if (!activeItem) return;
    quickDecision.mutate({
      meetingId,
      agendaItemId: activeItem.id,
      title: decisionForm.title || activeItem.title,
      decisionText: decisionForm.decisionText,
      method: decisionForm.method,
      votesFor: decisionForm.votesFor ? parseInt(decisionForm.votesFor) : undefined,
      votesAgainst: decisionForm.votesAgainst ? parseInt(decisionForm.votesAgainst) : undefined,
      votesAbstained: decisionForm.votesAbstained ? parseInt(decisionForm.votesAbstained) : undefined,
    });
    setShowDecisionForm(false);
    setDecisionForm({ title: "", decisionText: "", method: "ACCLAMATION", votesFor: "", votesAgainst: "", votesAbstained: "" });
  }

  // Current position label
  const posLabel = activeSubItem
    ? `§${activeIndex + 1}.${activeSubIndex + 1} av ${subItems.length}`
    : `${activeIndex + 1} / ${meeting.agendaItems.length}`;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/styrelse/moten/${meetingId}`} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Gavel className="h-5 w-5 text-blue-600" /> Mötesadministration</h1>
            <p className="text-xs text-gray-500">{meeting.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/styrelse/moten/${meetingId}/presentation`} target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Monitor className="h-3.5 w-3.5" /> Öppna presentation
          </Link>
          {meeting.status === "SCHEDULED" && (
            <button onClick={handleStartMeeting} className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
              <Play className="h-3.5 w-3.5" /> Öppna mötet
            </button>
          )}
          {meeting.status === "IN_PROGRESS" && (
            <button onClick={() => updateMeeting.mutate({ id: meetingId, status: "FINALIZING" })}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
              <Square className="h-3.5 w-3.5" /> Avsluta → Efterbehandling
            </button>
          )}
          {meeting.status === "FINALIZING" && (
            <button onClick={() => updateMeeting.mutate({ id: meetingId, status: "COMPLETED" })}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700">
              <CheckCircle className="h-3.5 w-3.5" /> Lås möte
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Agenda with sub-items */}
        <div className="col-span-1 rounded-lg border border-gray-200 bg-white">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase">Dagordning</span>
              {canControl && (
                <div className="flex gap-1">
                  <button onClick={() => handleNav("prev")} className="rounded p-1 text-gray-400 hover:bg-gray-100"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => handleNav("next")} className="rounded p-1 text-gray-400 hover:bg-gray-100"><ChevronRight className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {meeting.agendaItems.map((item, i) => {
              const isActive = item.id === meeting.activeAgendaItemId;
              const hasDecision = item.decisions.length > 0;
              const itemSubItems = getSubItems(item, meeting);

              return (
                <div key={item.id}>
                  <button
                    onClick={() => canControl && setActiveItem.mutate({ meetingId, agendaItemId: item.id })}
                    disabled={!canControl}
                    className={cn(
                      "w-full text-left px-3 py-2 border-b border-gray-50 transition-colors",
                      isActive && !activeSubItem ? "bg-blue-50 border-l-2 border-l-blue-600" :
                      isActive ? "bg-blue-50/50" : "hover:bg-gray-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        isActive && !activeSubItem ? "bg-blue-600 text-white" : hasDecision ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {hasDecision ? <CheckCircle className="h-3 w-3" /> : i + 1}
                      </span>
                      <span className={cn("text-xs", isActive && !activeSubItem ? "font-semibold text-blue-900" : "text-gray-700")}>
                        {item.title}
                      </span>
                      {itemSubItems.length > 0 && (
                        <span className="ml-auto text-[10px] text-gray-400">{itemSubItems.length}</span>
                      )}
                    </div>
                  </button>

                  {/* Sub-items */}
                  {isActive && itemSubItems.length > 0 && (
                    <div className="bg-gray-50/50">
                      {itemSubItems.map((sub, si) => {
                        const isSubActive = sub.id === meeting.activeSubItemId;
                        return (
                          <button key={sub.id}
                            onClick={() => canControl && setActiveSubItem.mutate({ meetingId, type: sub.type, id: sub.id })}
                            disabled={!canControl}
                            className={cn(
                              "w-full text-left px-3 py-1.5 pl-8 flex items-center gap-2 border-b border-gray-50",
                              isSubActive ? "bg-blue-100 border-l-2 border-l-blue-600" : "hover:bg-gray-100"
                            )}
                          >
                            {sub.type === "motion" ? <FileText className="h-3 w-3 text-purple-500 shrink-0" /> : <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />}
                            <span className={cn("text-[11px]", isSubActive ? "font-semibold text-blue-900" : "text-gray-600")}>
                              §{i + 1}.{si + 1} {sub.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Content */}
        <div className="col-span-2 space-y-4">
          {!activeItem && (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">{canControl ? "Välj en punkt till vänster." : "Mötet har inte startat."}</p>
            </div>
          )}

          {activeItem && !activeSubItem && (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-5">
                <div className="text-xs text-blue-600 font-medium mb-1">§ {activeIndex + 1} av {meeting.agendaItems.length}</div>
                <h2 className="text-lg font-bold text-gray-900">{activeItem.title}</h2>
                {activeItem.description && <p className="mt-2 text-sm text-gray-600">{activeItem.description}</p>}
                {subItems.length > 0 && (
                  <p className="mt-2 text-xs text-blue-600">
                    {subItems.filter((s) => s.type === "motion").length} motioner, {subItems.filter((s) => s.type === "suggestion").length} förslag — tryck Nästa för att behandla
                  </p>
                )}
              </div>

              {/* Secretary notes */}
              {canControl && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2 flex items-center gap-1">
                    Anteckningar {notesSaving && <span className="text-gray-400 font-normal">(sparar...)</span>}
                  </h3>
                  <textarea
                    rows={3}
                    value={activeItem.id === (meeting.agendaItems.find((i) => i.id === meeting.activeAgendaItemId))?.id ? notesValue : (activeItem.notes ?? "")}
                    onChange={(e) => {
                      setNotesValue(e.target.value);
                      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
                      notesTimerRef.current = setTimeout(() => {
                        setNotesSaving(true);
                        updateNotes.mutate({ id: activeItem.id, notes: e.target.value }, {
                          onSettled: () => setNotesSaving(false),
                        });
                      }, 2000);
                    }}
                    onFocus={() => setNotesValue(activeItem.notes ?? "")}
                    placeholder="Sekreterarens anteckningar under denna punkt..."
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              )}

              {/* ATTENDANCE: Board meeting — show all board members with status */}
              {activeItem.specialType === "ATTENDANCE" && canControl && meeting.type === "BOARD" && (() => {
                const attendanceMap = new Map(meeting.attendances.map((a) => [a.user.id, a]));
                const presentCount = meeting.boardMembers.filter((bm) => {
                  const att = attendanceMap.get(bm.id);
                  return att && (att.status === "PRESENT" || att.status === "PROXY");
                }).length;

                const roleLabels: Record<string, string> = {
                  BOARD_CHAIRPERSON: "Ordförande",
                  BOARD_SECRETARY: "Sekreterare",
                  BOARD_TREASURER: "Kassör",
                  BOARD_PROPERTY_MGR: "Förvaltningsansvarig",
                  BOARD_ENVIRONMENT: "Miljöansvarig",
                  BOARD_EVENTS: "Aktivitetsansvarig",
                  BOARD_MEMBER: "Ledamot",
                  BOARD_SUBSTITUTE: "Suppleant",
                };

                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">
                      Närvaroregistrering — Styrelsemedlemmar ({presentCount} av {meeting.boardMembers.length})
                    </h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {meeting.boardMembers.map((bm) => {
                        const att = attendanceMap.get(bm.id);
                        const isPresent = att && (att.status === "PRESENT" || att.status === "PROXY");
                        return (
                          <div key={bm.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50">
                            <div className="flex-1">
                              <span className="text-sm text-gray-700">{bm.firstName} {bm.lastName}</span>
                              <span className="ml-2 text-xs text-gray-400">{roleLabels[bm.role] ?? bm.role}</span>
                            </div>
                            <button
                              onClick={() => updateAttendance.mutate({ meetingId, userId: bm.id, status: isPresent ? "ABSENT" : "PRESENT" })}
                              className={cn("rounded px-3 py-1 text-xs font-medium",
                                isPresent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-green-50"
                              )}
                            >
                              {isPresent ? "Närvarande ✓" : "Markera närvarande"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {presentCount} av {meeting.boardMembers.length} närvarande
                    </p>
                  </div>
                );
              })()}

              {activeItem.specialType === "ATTENDANCE" && canControl && meeting.type !== "BOARD" && (() => {
                const checkedInIds = new Set(meeting.voterRegistry?.entries.filter((e) => e.checkedIn).map((e) => e.memberId) ?? []);
                const proxyMap = new Map(meeting.proxies.map((p) => [p.memberId, p]));

                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">
                      Närvaroregistrering — Medlemmar ({checkedInIds.size} av {meeting.members.length} incheckade)
                    </h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {meeting.members.map((m) => {
                        const isCheckedIn = checkedInIds.has(m.id);
                        const proxy = proxyMap.get(m.id);
                        const hasProxy = !!proxy;

                        return (
                          <div key={m.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50">
                            <div className="flex-1">
                              <span className="text-sm text-gray-700">{m.firstName} {m.lastName}</span>
                              {hasProxy && (
                                <span className="ml-2 text-xs text-blue-600">
                                  (ombud: {proxy.proxyType === "MEMBER" ? "medlem" : proxy.externalName ?? "extern"})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {isCheckedIn ? (
                                <span className="rounded px-3 py-1 text-xs font-medium bg-green-100 text-green-700">
                                  Incheckad ✓{hasProxy ? " via ombud" : ""}
                                </span>
                              ) : hasProxy ? (
                                <button
                                  onClick={() => {
                                    if (meeting.voterRegistry) {
                                      updateAttendance.mutate({ meetingId, userId: m.id, status: "PROXY", proxyFor: proxy.proxyMemberId ?? proxy.externalName ?? undefined });
                                    }
                                  }}
                                  className="rounded px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                  Checka in via ombud
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateAttendance.mutate({ meetingId, userId: m.id, status: "PRESENT" })}
                                  className="rounded px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500 hover:bg-green-50"
                                >
                                  Checka in
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                      <span>{checkedInIds.size} närvarande</span>
                      <span>{meeting.proxies.length} ombud registrerade</span>
                    </div>
                  </div>
                );
              })()}

              {/* ELECT_CHAIR: Select chairperson */}
              {activeItem.specialType === "ELECT_CHAIR" && canControl && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Välj mötesordförande</h3>
                  <select
                    value={meeting.meetingChairpersonId ?? ""}
                    onChange={(e) => updateMeetingRoles.mutate({ id: meetingId, meetingChairpersonId: e.target.value || null })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Ej vald</option>
                    {meeting.attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY").map((a) => (
                      <option key={a.user.id} value={a.user.id}>{a.user.firstName} {a.user.lastName}</option>
                    ))}
                  </select>
                  {meeting.meetingChairpersonId && (
                    <p className="mt-2 text-sm text-green-700 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Vald: {meeting.attendances.find((a) => a.user.id === meeting.meetingChairpersonId)?.user.firstName ?? ""} {meeting.attendances.find((a) => a.user.id === meeting.meetingChairpersonId)?.user.lastName ?? ""}
                    </p>
                  )}
                </div>
              )}

              {/* ELECT_SECRETARY: Select secretary */}
              {activeItem.specialType === "ELECT_SECRETARY" && canControl && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Välj mötessekreterare</h3>
                  <select
                    value={meeting.meetingSecretaryId ?? ""}
                    onChange={(e) => updateMeetingRoles.mutate({ id: meetingId, meetingSecretaryId: e.target.value || null })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Ej vald</option>
                    {meeting.attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY").map((a) => (
                      <option key={a.user.id} value={a.user.id}>{a.user.firstName} {a.user.lastName}</option>
                    ))}
                  </select>
                  {meeting.meetingSecretaryId && (
                    <p className="mt-2 text-sm text-green-700 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Vald: {meeting.attendances.find((a) => a.user.id === meeting.meetingSecretaryId)?.user.firstName ?? ""} {meeting.attendances.find((a) => a.user.id === meeting.meetingSecretaryId)?.user.lastName ?? ""}
                    </p>
                  )}
                </div>
              )}

              {/* ELECT_ADJUSTERS: Select adjusters */}
              {activeItem.specialType === "ELECT_ADJUSTERS" && canControl && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Välj justerare</h3>
                  <div className="space-y-1">
                    {meeting.attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY").map((a) => {
                      const isSelected = meeting.adjusters.includes(a.user.id);
                      return (
                        <label key={a.user.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const newAdjusters = isSelected
                                ? meeting.adjusters.filter((id) => id !== a.user.id)
                                : [...meeting.adjusters, a.user.id];
                              updateMeetingRoles.mutate({ id: meetingId, adjusters: newAdjusters });
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{a.user.firstName} {a.user.lastName}</span>
                        </label>
                      );
                    })}
                  </div>
                  {meeting.adjusters.length > 0 && (
                    <p className="mt-2 text-sm text-green-700 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {meeting.adjusters.length} justerare valda
                    </p>
                  )}
                </div>
              )}

              {activeItem.decisions.map((d) => (
                <div key={d.id} className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center gap-2 text-xs text-green-700 mb-1">
                    <CheckCircle className="h-3.5 w-3.5" /><span className="font-mono">{d.reference}</span>
                  </div>
                  <p className="text-sm text-green-800">{d.decisionText}</p>
                </div>
              ))}
            </>
          )}

          {/* Sub-item detail: Motion */}
          {activeItem && activeMotionDetail && (
            <div className="space-y-3">
              <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-5">
                <div className="text-xs text-purple-600 font-medium mb-1">§{activeIndex + 1}.{activeSubIndex + 1} — Motion</div>
                <h2 className="text-lg font-bold text-gray-900">{activeMotionDetail.title}</h2>
                <p className="mt-2 text-sm text-gray-700">{activeMotionDetail.proposal}</p>
                <p className="mt-1 text-xs text-gray-500">Av {activeMotionDetail.author.firstName} {activeMotionDetail.author.lastName}</p>
              </div>

              {activeMotionDetail.boardResponse && (
                <div className="rounded-lg border border-purple-200 bg-white p-4">
                  <p className="text-xs font-semibold text-purple-700 mb-1">Styrelsens yttrande</p>
                  <p className="text-sm text-gray-700">{activeMotionDetail.boardResponse}</p>
                </div>
              )}

              {activeMotionDetail.voteProposals.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Omröstningsförslag</p>
                  <div className="space-y-2">
                    {activeMotionDetail.voteProposals.map((p) => (
                      <div key={p.id} className={cn("rounded border p-3", p.adopted ? "border-green-300 bg-green-50" : "border-gray-200")}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900">{p.label}</span>
                          {p.adopted && <span className="text-[10px] text-green-700 font-bold">ANTAGET</span>}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{p.description}</p>
                        {p.votesFor !== null && (
                          <div className="mt-1 flex gap-3 text-xs">
                            <span className="text-green-700">Ja: {p.votesFor}</span>
                            <span className="text-red-600">Nej: {p.votesAgainst ?? 0}</span>
                            <span className="text-gray-500">Avstår: {p.votesAbstained ?? 0}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link href={`/medlem/motioner/${activeMotionDetail.id}`} target="_blank"
                    className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800">
                    Öppna fullständig motionsvy →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Sub-item detail: Suggestion */}
          {activeItem && activeSuggestionDetail && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-5">
              <div className="text-xs text-amber-600 font-medium mb-1">§{activeIndex + 1}.{activeSubIndex + 1} — Förslag från boende</div>
              <h2 className="text-lg font-bold text-gray-900">{activeSuggestionDetail.title}</h2>
              <p className="mt-2 text-sm text-gray-700">{activeSuggestionDetail.description}</p>
              <p className="mt-1 text-xs text-gray-500">Av {activeSuggestionDetail.author.firstName} {activeSuggestionDetail.author.lastName}</p>
              <Link href={`/boende/forslag/${activeSuggestionDetail.id}`} target="_blank"
                className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800">
                Öppna fullständig förslagsvy →
              </Link>
            </div>
          )}

          {/* Quick decision */}
          {canControl && activeItem && !showDecisionForm && (
            <button onClick={() => { setDecisionForm((f) => ({ ...f, title: activeSubItem?.title ?? activeItem!.title })); setShowDecisionForm(true); }}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <Vote className="h-5 w-5 mx-auto mb-1" /> Dokumentera beslut
            </button>
          )}

          {showDecisionForm && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Snabbdokumentation — beslut</h3>
              <input type="text" value={decisionForm.title} onChange={(e) => setDecisionForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Beslutets titel" />
              <textarea rows={2} value={decisionForm.decisionText} onChange={(e) => setDecisionForm((f) => ({ ...f, decisionText: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Styrelsen beslutar att..." />
              <div className="flex items-center gap-3">
                <select value={decisionForm.method} onChange={(e) => setDecisionForm((f) => ({ ...f, method: e.target.value as DecisionMethod }))}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="ACCLAMATION">Acklamation</option>
                  <option value="COUNTED">Votering</option>
                </select>
                {decisionForm.method === "COUNTED" && (
                  <>
                    <input type="number" min={0} value={decisionForm.votesFor} onChange={(e) => setDecisionForm((f) => ({ ...f, votesFor: e.target.value }))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-xs text-center" placeholder="Ja" />
                    <input type="number" min={0} value={decisionForm.votesAgainst} onChange={(e) => setDecisionForm((f) => ({ ...f, votesAgainst: e.target.value }))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-xs text-center" placeholder="Nej" />
                    <input type="number" min={0} value={decisionForm.votesAbstained} onChange={(e) => setDecisionForm((f) => ({ ...f, votesAbstained: e.target.value }))} className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-xs text-center" placeholder="Avst" />
                  </>
                )}
              </div>
              {/* Jävsdeklaration */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Jäv — är någon närvarande jävig i detta ärende?</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {meeting.attendances.filter((a) => a.status === "PRESENT" || a.status === "PROXY").map((a) => (
                    <label key={a.user.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-amber-50 cursor-pointer text-xs">
                      <input type="checkbox" checked={!!recusals[a.user.id]}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRecusals((r) => ({ ...r, [a.user.id]: "" }));
                          } else {
                            setRecusals((r) => { const n = { ...r }; delete n[a.user.id]; return n; });
                          }
                        }}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                      <span className="text-gray-700">{a.user.firstName} {a.user.lastName}</span>
                      {recusals[a.user.id] !== undefined && (
                        <input type="text" value={recusals[a.user.id]} placeholder="Anledning..."
                          onChange={(e) => setRecusals((r) => ({ ...r, [a.user.id]: e.target.value }))}
                          className="flex-1 rounded border border-amber-200 px-2 py-0.5 text-xs focus:border-amber-400 focus:outline-none" />
                      )}
                    </label>
                  ))}
                </div>
                {Object.keys(recusals).length > 0 && (
                  <p className="mt-1 text-xs text-amber-600">{Object.keys(recusals).length} jäviga — dessa deltar ej i beslutet</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowDecisionForm(false); setRecusals({}); }} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
                <button onClick={handleQuickDecision} disabled={!decisionForm.decisionText.trim() || quickDecision.isPending}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {quickDecision.isPending ? "Sparar..." : "Spara beslut"}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {canControl && activeItem && (
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => handleNav("prev")}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4" /> Föregående
              </button>
              <span className="text-xs text-gray-400">{posLabel}</span>
              <button onClick={() => handleNav("next")}
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Nästa <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
