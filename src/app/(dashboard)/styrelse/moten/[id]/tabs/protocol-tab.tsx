"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Protocol = {
  id: string;
  content: string;
  signedAt: Date | null;
} | null;

export function ProtocolTab({
  meetingId,
  protocol,
  canEdit,
}: {
  meetingId: string;
  protocol: Protocol;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState(protocol?.content ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  const upsertProtocol = trpc.protocol.upsert.useMutation({
    onSuccess: () => {
      setHasChanges(false);
      router.refresh();
    },
  });

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
        <div className="text-sm text-gray-500">
          {protocol ? "Protokoll sparat" : "Inget protokoll ännu"}
          {protocol?.signedAt && " — Justerat"}
        </div>
        {canEdit && hasChanges && (
          <button
            onClick={handleSave}
            disabled={upsertProtocol.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {upsertProtocol.isPending ? "Sparar..." : "Spara protokoll"}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {canEdit ? (
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
    </div>
  );
}
