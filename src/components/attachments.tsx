"use client";

import { useState, useRef } from "react";
import { Paperclip, Link2, Plus, X, ExternalLink, File, Loader2, Upload } from "lucide-react";
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
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <div className="flex gap-1.5">
            <button onClick={() => setMode("upload")}
              className={cn("rounded px-2 py-0.5 text-xs font-medium", mode === "upload" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              <Upload className="inline h-3 w-3 mr-0.5" /> Ladda upp fil
            </button>
            <button onClick={() => setMode("link")}
              className={cn("rounded px-2 py-0.5 text-xs font-medium", mode === "link" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              <Link2 className="inline h-3 w-3 mr-0.5" /> Extern länk
            </button>
          </div>

          {mode === "upload" && (
            <div>
              <input ref={fileInputRef} type="file" multiple onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                setUploading(true);
                for (const file of Array.from(files)) {
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("category", "OTHER");
                  try {
                    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
                    if (!res.ok) continue;
                    const data = await res.json() as { id: string; fileName: string };
                    addMutation.mutate({
                      entityType: entityType as never, entityId,
                      type: "file", name: file.name,
                      url: `/api/documents/${data.id}/download`,
                      mimeType: file.type, fileSize: file.size,
                    });
                  } catch { /* skip */ }
                }
                setUploading(false);
                setShowForm(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
                className="w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
              {uploading && <div className="flex items-center gap-1 mt-1 text-xs text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> Laddar upp...</div>}
            </div>
          )}

          {mode === "link" && (
            <>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Beskrivning" className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..." className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
              <button onClick={() => {
                if (!name || !url) return;
                addMutation.mutate({ entityType: entityType as never, entityId, type: "link", name, url });
              }} disabled={addMutation.isPending || !name || !url}
                className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
                {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Spara"}
              </button>
            </>
          )}

          <button onClick={() => { setShowForm(false); setName(""); setUrl(""); }}
            className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600">Stäng</button>
        </div>
      )}

      {attachments.length === 0 && !showForm && (
        <p className="text-xs text-gray-400">Inga bilagor.</p>
      )}
    </div>
  );
}
