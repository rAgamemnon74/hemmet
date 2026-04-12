"use client";

import { useState } from "react";
import { Paperclip, Link2, Plus, X, ExternalLink, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

type AttachmentData = {
  id: string;
  type: string;
  name: string;
  url: string;
  mimeType: string | null;
  createdAt: Date;
};

/**
 * Reusable attachment section for any entity type.
 * Usage: <AttachmentSection entityType="Inspection" entityId={inspectionId} canEdit={true} />
 */
export function AttachmentSection({
  entityType,
  entityId,
  canEdit = false,
}: {
  entityType: string;
  entityId: string;
  canEdit?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"file" | "link">("link");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const listQuery = trpc.attachment.list.useQuery({ entityType: entityType as never, entityId });
  const addMutation = trpc.attachment.add.useMutation({ onSuccess: () => { setShowForm(false); setName(""); setUrl(""); listQuery.refetch(); } });
  const removeMutation = trpc.attachment.remove.useMutation({ onSuccess: () => listQuery.refetch() });

  const attachments = listQuery.data ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> Bilagor ({attachments.length})
        </h4>
        {canEdit && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50">
            <Plus className="h-3 w-3" /> Lägg till
          </button>
        )}
      </div>

      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1.5 group">
              <a href={att.type === "link" && !att.url.startsWith("http") ? `https://${att.url}` : att.url}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                {att.type === "file" ? <File className="h-3.5 w-3.5 shrink-0" /> : <Link2 className="h-3.5 w-3.5 shrink-0" />}
                {att.name}
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </a>
              {canEdit && (
                <button onClick={() => removeMutation.mutate({ id: att.id })}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded border border-blue-200 bg-blue-50/30 p-2 space-y-2">
          <div className="flex gap-2">
            <button onClick={() => setFormType("link")}
              className={cn("rounded px-2 py-0.5 text-xs font-medium", formType === "link" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              Länk
            </button>
            <button onClick={() => setFormType("file")}
              className={cn("rounded px-2 py-0.5 text-xs font-medium", formType === "file" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              Fil (URL)
            </button>
          </div>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={formType === "link" ? "Namn, t.ex. 'OVK-protokoll hos besiktningsfirma'" : "Filnamn, t.ex. 'OVK-protokoll 2026.pdf'"}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder={formType === "link" ? "https://..." : "/api/documents/..."}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
          <div className="flex gap-2">
            <button onClick={() => {
              if (!name || !url) return;
              addMutation.mutate({ entityType: entityType as never, entityId, type: formType, name, url });
            }} disabled={addMutation.isPending || !name || !url}
              className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
              {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Spara"}
            </button>
            <button onClick={() => { setShowForm(false); setName(""); setUrl(""); }}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600">Avbryt</button>
          </div>
        </div>
      )}

      {attachments.length === 0 && !showForm && (
        <p className="text-xs text-gray-400">Inga bilagor.</p>
      )}
    </div>
  );
}
