"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, Send, Undo2, CheckCircle, Plus, FileText, Vote, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc"
import { AttachmentSection } from "@/components/attachments";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, MotionStatus, MotionRecommendation, MotionProposalSource } from "@prisma/client";

type MotionData = {
  id: string;
  title: string;
  description: string;
  proposal: string;
  boardResponse: string | null;
  boardRecommendation: MotionRecommendation | null;
  status: MotionStatus;
  resolution: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  authorId: string;
  author: { id: string; firstName: string; lastName: string; email: string };
  meeting: {
    id: string; title: string; scheduledAt: Date; status: string;
    meetingChairpersonId: string | null; meetingSecretaryId: string | null; adjusters: string[];
  } | null;
  documents: Array<{ id: string; fileName: string; fileUrl: string; fileSize: number; createdAt: Date }>;
  voteProposals: Array<{
    id: string;
    sortOrder: number;
    label: string;
    description: string;
    isDefault: boolean;
    source: MotionProposalSource;
    votesFor: number | null;
    votesAgainst: number | null;
    votesAbstained: number | null;
    adopted: boolean;
  }>;
};

const statusLabels: Record<MotionStatus, string> = {
  DRAFT: "Utkast", SUBMITTED: "Inskickad", RECEIVED: "Mottagen",
  BOARD_RESPONSE: "Styrelsens yttrande", DECIDED: "Beslutad", WITHDRAWN: "Återtagen",
  STRUCK: "Struken", NOT_TREATED: "Ej behandlad",
};
const statusColors: Record<MotionStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700", SUBMITTED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-blue-100 text-blue-700", BOARD_RESPONSE: "bg-purple-100 text-purple-700",
  DECIDED: "bg-green-100 text-green-700", WITHDRAWN: "bg-gray-100 text-gray-500",
  STRUCK: "bg-red-100 text-red-700", NOT_TREATED: "bg-orange-100 text-orange-700",
};
const recommendationLabels: Record<MotionRecommendation, string> = {
  APPROVE: "Styrelsen tillstyrker", REJECT: "Styrelsen avstyrker",
  AMEND: "Styrelsen föreslår ändring", NEUTRAL: "Styrelsen tar inte ställning",
};
const recommendationColors: Record<MotionRecommendation, string> = {
  APPROVE: "bg-green-50 text-green-800 border-green-200",
  REJECT: "bg-red-50 text-red-800 border-red-200",
  AMEND: "bg-amber-50 text-amber-800 border-amber-200",
  NEUTRAL: "bg-gray-50 text-gray-700 border-gray-200",
};
const sourceLabels: Record<MotionProposalSource, string> = {
  MOTIONER: "Motionärens yrkande", BOARD: "Styrelsens förslag", AMENDMENT: "Ändringsyrkande",
};

export function MotionDetail({ motion }: { motion: MotionData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canRespond = hasPermission(userRoles, "motion:respond");
  const isAuthor = session?.user?.id === motion.authorId;

  const [response, setResponse] = useState("");
  const [recommendation, setRecommendation] = useState<MotionRecommendation>("APPROVE");
  const [altProposal, setAltProposal] = useState("");
  const [showAddProposal, setShowAddProposal] = useState(false);
  const [newProposal, setNewProposal] = useState({ label: "", description: "" });

  const acknowledge = trpc.motion.acknowledge.useMutation({ onSuccess: () => router.refresh() });
  const respond = trpc.motion.respond.useMutation({ onSuccess: () => router.refresh() });
  const withdraw = trpc.motion.withdraw.useMutation({ onSuccess: () => router.refresh() });
  const addProposal = trpc.motion.addProposal.useMutation({
    onSuccess: () => { setShowAddProposal(false); setNewProposal({ label: "", description: "" }); router.refresh(); },
  });
  const removeProposal = trpc.motion.removeProposal.useMutation({ onSuccess: () => router.refresh() });
  const recordVote = trpc.motion.recordVoteResult.useMutation({ onSuccess: () => router.refresh() });
  const setOutcome = trpc.motion.setOutcome.useMutation({ onSuccess: () => router.refresh() });

  const isFinished = ["DECIDED", "STRUCK", "NOT_TREATED"].includes(motion.status);
  const meetingStatus = motion.meeting?.status;
  const meetingActive = meetingStatus === "IN_PROGRESS" || meetingStatus === "FINALIZING";
  const isMeetingRole = motion.meeting
    ? motion.meeting.meetingChairpersonId === session?.user?.id ||
      motion.meeting.meetingSecretaryId === session?.user?.id ||
      motion.meeting.adjusters.includes(session?.user?.id ?? "")
    : false;
  const canRecordVotes = canRespond && !isFinished && (meetingStatus === "IN_PROGRESS" || (meetingStatus === "FINALIZING" && isMeetingRole));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/medlem/motioner" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till motioner
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">{motion.title}</h1>
            <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusColors[motion.status])}>
              {statusLabels[motion.status]}
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Av {motion.author.firstName} {motion.author.lastName} — {format(new Date(motion.createdAt), "d MMMM yyyy", { locale: sv })}
            {motion.meeting && <span> — Kopplad till: {motion.meeting.title}</span>}
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Bakgrund</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{motion.description}</p>
            </div>
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Yrkande</h3>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">{motion.proposal}</p>
            </div>
          </div>
        </div>

        {/* Bilagor */}
        {motion.documents.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bilagor ({motion.documents.length})
            </h2>
            <div className="space-y-2">
              {motion.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">{(doc.fileSize / 1024).toFixed(0)} KB — {format(new Date(doc.createdAt), "d MMM yyyy", { locale: sv })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Board response */}
        {motion.boardResponse && (
          <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-purple-900">Styrelsens yttrande</h2>
              {motion.boardRecommendation && (
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", recommendationColors[motion.boardRecommendation])}>
                  {recommendationLabels[motion.boardRecommendation]}
                </span>
              )}
            </div>
            <p className="text-sm text-purple-800 whitespace-pre-wrap">{motion.boardResponse}</p>
          </div>
        )}

        {/* Vote proposals */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Omröstningsförslag ({motion.voteProposals.length})
            </h2>
            {canRespond && !showAddProposal && (
              <button onClick={() => setShowAddProposal(true)}
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                <Plus className="h-3.5 w-3.5" /> Lägg till förslag
              </button>
            )}
          </div>

          <div className="space-y-3">
            {motion.voteProposals.map((p) => (
              <div key={p.id} className={cn("rounded-md border p-4", p.adopted ? "border-green-300 bg-green-50" : "border-gray-200")}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{p.label}</h3>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{sourceLabels[p.source]}</span>
                      {p.adopted && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Antaget
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{p.description}</p>
                    {p.votesFor !== null && (
                      <div className="mt-2 flex gap-3 text-xs">
                        <span className="text-green-700">Ja: {p.votesFor}</span>
                        <span className="text-red-700">Nej: {p.votesAgainst ?? 0}</span>
                        <span className="text-gray-500">Avstår: {p.votesAbstained ?? 0}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {canRecordVotes && p.votesFor === null && (
                      <VoteRecorder proposalId={p.id}
                        onRecord={(data) => recordVote.mutate({ id: p.id, ...data })}
                        isPending={recordVote.isPending} />
                    )}
                    {canRespond && !p.isDefault && (
                      <button onClick={() => removeProposal.mutate({ id: p.id })}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Ta bort">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAddProposal && (
            <form onSubmit={(e) => { e.preventDefault(); addProposal.mutate({ motionId: motion.id, label: newProposal.label, description: newProposal.description, source: "AMENDMENT" }); }}
              className="mt-3 rounded-md border border-blue-200 bg-blue-50/50 p-3 space-y-2">
              <input type="text" required value={newProposal.label} onChange={(e) => setNewProposal((f) => ({ ...f, label: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Etikett, t.ex. 'Ändringsyrkande'" />
              <textarea rows={3} required value={newProposal.description} onChange={(e) => setNewProposal((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Beslutstext..." />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddProposal(false)} className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
                <button type="submit" disabled={addProposal.isPending} className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {addProposal.isPending ? "Lägger till..." : "Lägg till"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Strike / Not treated */}
        {canRespond && meetingActive && !isFinished && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">Markera motion som ej behandlad:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setOutcome.mutate({ id: motion.id, status: "STRUCK" })}
                disabled={setOutcome.isPending}
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Stryk motion
              </button>
              <button
                onClick={() => setOutcome.mutate({ id: motion.id, status: "NOT_TREATED" })}
                disabled={setOutcome.isPending}
                className="rounded-md border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
              >
                Ej behandlad (tidsbrist)
              </button>
            </div>
          </div>
        )}

        {/* Resolution */}
        {motion.resolution && (
          <div className="rounded-lg border border-green-200 bg-green-50/30 p-6">
            <h2 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" /> Beslut
            </h2>
            <p className="text-sm text-green-800 whitespace-pre-wrap">{motion.resolution}</p>
          </div>
        )}

        {/* Board respond form */}
        {canRespond && ["SUBMITTED", "RECEIVED"].includes(motion.status) && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            {motion.status === "SUBMITTED" && (
              <button onClick={() => acknowledge.mutate({ id: motion.id })} disabled={acknowledge.isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {acknowledge.isPending ? "Bekräftar..." : "Bekräfta mottagande"}
              </button>
            )}
            <h3 className="text-sm font-semibold text-gray-900">Styrelsens yttrande</h3>
            <textarea rows={5} value={response} onChange={(e) => setResponse(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Styrelsen har behandlat motionen..." />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Rekommendation</label>
              <select value={recommendation} onChange={(e) => setRecommendation(e.target.value as MotionRecommendation)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="APPROVE">Tillstyrker (bifall)</option>
                <option value="REJECT">Avstyrker (avslag)</option>
                <option value="AMEND">Föreslår ändring (eget förslag)</option>
                <option value="NEUTRAL">Tar inte ställning</option>
              </select>
            </div>
            {recommendation === "AMEND" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Styrelsens alternativa beslutsförslag</label>
                <textarea rows={3} value={altProposal} onChange={(e) => setAltProposal(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Styrelsen föreslår att stämman beslutar att..." />
              </div>
            )}
            <button
              onClick={() => respond.mutate({ id: motion.id, boardResponse: response, boardRecommendation: recommendation, alternativeProposal: recommendation === "AMEND" ? altProposal : undefined })}
              disabled={!response.trim() || respond.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
              <Send className="h-4 w-4" /> {respond.isPending ? "Skickar..." : "Lämna yttrande"}
            </button>
          </div>
        )}

        {/* Author withdraw */}
        {isAuthor && ["SUBMITTED", "RECEIVED"].includes(motion.status) && (
          <div className="flex justify-end">
            <button onClick={() => withdraw.mutate({ id: motion.id })} disabled={withdraw.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Undo2 className="h-4 w-4" /> {withdraw.isPending ? "Drar tillbaka..." : "Dra tillbaka motion"}
            </button>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AttachmentSection entityType="Motion" entityId={motion.id} canEdit={canRespond} />
        </div>
      </div>
    </div>
  );
}

function VoteRecorder({
  proposalId,
  onRecord,
  isPending,
}: {
  proposalId: string;
  onRecord: (data: { votesFor: number; votesAgainst: number; votesAbstained: number; adopted: boolean }) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [votes, setVotes] = useState({ votesFor: 0, votesAgainst: 0, votesAbstained: 0 });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100">
        Registrera röster
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input type="number" min={0} value={votes.votesFor} onChange={(e) => setVotes((v) => ({ ...v, votesFor: parseInt(e.target.value) || 0 }))}
        className="w-14 rounded border border-gray-300 px-1.5 py-1 text-xs text-center" placeholder="Ja" title="Röster för" />
      <input type="number" min={0} value={votes.votesAgainst} onChange={(e) => setVotes((v) => ({ ...v, votesAgainst: parseInt(e.target.value) || 0 }))}
        className="w-14 rounded border border-gray-300 px-1.5 py-1 text-xs text-center" placeholder="Nej" title="Röster emot" />
      <input type="number" min={0} value={votes.votesAbstained} onChange={(e) => setVotes((v) => ({ ...v, votesAbstained: parseInt(e.target.value) || 0 }))}
        className="w-14 rounded border border-gray-300 px-1.5 py-1 text-xs text-center" placeholder="Avst" title="Avstår" />
      <button onClick={() => { onRecord({ ...votes, adopted: votes.votesFor > votes.votesAgainst }); setOpen(false); }}
        disabled={isPending} className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">OK</button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">X</button>
    </div>
  );
}
