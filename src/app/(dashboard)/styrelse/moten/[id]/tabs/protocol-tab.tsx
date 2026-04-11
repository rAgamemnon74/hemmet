"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Lock, Unlock, PenLine, CheckCircle, Archive, Wand2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";

type Protocol = {
  id: string;
  content: string;
  status: string;
  signedAt: Date | null;
  signedBy: string[];
  finalizedAt: Date | null;
  finalizedBy: string | null;
  archivedAt: Date | null;
} | null;

const statusLabels: Record<string, string> = {
  DRAFT: "Utkast",
  FINALIZED: "Slutbehandlat",
  SIGNED: "Justerat",
  ARCHIVED: "Arkiverat",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  FINALIZED: "bg-blue-100 text-blue-700",
  SIGNED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-purple-100 text-purple-700",
};

export function ProtocolTab({
  meetingId,
  protocol,
  canEdit,
  meetingChairpersonId,
  adjusters,
}: {
  meetingId: string;
  protocol: Protocol;
  canEdit: boolean;
  meetingChairpersonId?: string | null;
  adjusters?: string[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [content, setContent] = useState(protocol?.content ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  const generateDraft = trpc.protocol.generate.useQuery({ meetingId }, { enabled: false });
  const upsertProtocol = trpc.protocol.upsert.useMutation({
    onSuccess: () => { setHasChanges(false); router.refresh(); },
  });
  const finalize = trpc.protocol.finalize.useMutation({ onSuccess: () => router.refresh() });
  const reopen = trpc.protocol.reopen.useMutation({ onSuccess: () => router.refresh() });
  const sign = trpc.protocol.sign.useMutation({ onSuccess: () => router.refresh() });
  const archive = trpc.protocol.archive.useMutation({ onSuccess: () => router.refresh() });

  const status = protocol?.status ?? "DRAFT";
  const isLocked = status === "SIGNED" || status === "ARCHIVED";
  const isFinalized = status === "FINALIZED";
  const isFinalizer = protocol?.finalizedBy === userId;
  const canEditContent = canEdit && (status === "DRAFT" || (isFinalized && isFinalizer));
  const canSign = isFinalized && (userId === meetingChairpersonId || (adjusters ?? []).includes(userId ?? ""));
  const hasSigned = protocol?.signedBy?.includes(userId ?? "") ?? false;

  function handleChange(value: string) {
    setContent(value);
    setHasChanges(true);
  }

  function handleSave() {
    upsertProtocol.mutate({ meetingId, content });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {protocol ? (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[status])}>
              {statusLabels[status]}
            </span>
          ) : (
            <span className="text-sm text-gray-500">Inget protokoll ännu</span>
          )}
          {protocol?.signedBy && protocol.signedBy.length > 0 && status !== "DRAFT" && (
            <span className="text-xs text-gray-400">
              {protocol.signedBy.length} signatur{protocol.signedBy.length !== 1 ? "er" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Generate draft from meeting log */}
          {canEditContent && status === "DRAFT" && !content && (
            <button
              onClick={async () => {
                const result = await generateDraft.refetch();
                if (result.data) {
                  setContent(result.data);
                  setHasChanges(true);
                }
              }}
              disabled={generateDraft.isFetching}
              className="inline-flex items-center gap-1.5 rounded-md border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
            >
              <Wand2 className="h-4 w-4" />
              {generateDraft.isFetching ? "Genererar..." : "Generera utkast från möteslogg"}
            </button>
          )}

          {/* Save button */}
          {canEditContent && hasChanges && (
            <button onClick={handleSave} disabled={upsertProtocol.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              <Save className="h-4 w-4" />
              {upsertProtocol.isPending ? "Sparar..." : "Spara"}
            </button>
          )}

          {/* Finalize button — secretary locks the protocol */}
          {canEdit && protocol && status === "DRAFT" && (
            <button onClick={() => finalize.mutate({ meetingId })} disabled={finalize.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50">
              <Lock className="h-4 w-4" />
              Slutbehandla
            </button>
          )}

          {/* Reopen button — only the secretary who finalized */}
          {isFinalizer && isFinalized && (
            <button onClick={() => reopen.mutate({ meetingId })} disabled={reopen.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Unlock className="h-4 w-4" />
              Återöppna
            </button>
          )}

          {/* Sign button — chairperson and adjusters */}
          {canSign && !hasSigned && (
            <button onClick={() => sign.mutate({ meetingId })} disabled={sign.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              <PenLine className="h-4 w-4" />
              Signera
            </button>
          )}
          {canSign && hasSigned && (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" /> Signerat
            </span>
          )}

          {/* Archive button — after all signatures */}
          {canEdit && status === "SIGNED" && (
            <button onClick={() => archive.mutate({ meetingId })} disabled={archive.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50">
              <Archive className="h-4 w-4" />
              Arkivera
            </button>
          )}
        </div>
      </div>

      {/* Error messages */}
      {upsertProtocol.error && <p className="mb-2 text-sm text-red-600">{upsertProtocol.error.message}</p>}
      {finalize.error && <p className="mb-2 text-sm text-red-600">{finalize.error.message}</p>}
      {sign.error && <p className="mb-2 text-sm text-red-600">{sign.error.message}</p>}

      {/* Protocol content */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {canEditContent ? (
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            rows={20}
            className="w-full rounded-lg p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            placeholder="Skriv mötesprotokoll här...

§1 Mötets öppnande
Ordförande förklarar mötet öppnat.

§2 Val av justerare
...

§3 Godkännande av dagordning
..."
          />
        ) : (
          <div className="whitespace-pre-wrap p-4 text-sm text-gray-800">
            {content || "Inget protokoll har skrivits ännu."}
          </div>
        )}
      </div>

      {/* Status info */}
      {isFinalized && !isFinalizer && !canSign && (
        <p className="mt-2 text-xs text-blue-600">
          Protokollet är slutbehandlat och inväntar signering av ordförande och justerare.
        </p>
      )}
      {isLocked && (
        <p className="mt-2 text-xs text-gray-400">
          Protokollet är {status === "ARCHIVED" ? "arkiverat" : "justerat"} och kan inte ändras.
        </p>
      )}
    </div>
  );
}
