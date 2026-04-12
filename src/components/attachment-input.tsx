"use client";

import { useState, useRef } from "react";
import { Paperclip, Plus, X, Link2, File, Upload, Loader2, Camera, Image } from "lucide-react";
import { cn } from "@/lib/utils";

export type PendingAttachment = {
  type: "file" | "link";
  name: string;
  url: string;
  mimeType?: string;
  fileSize?: number;
};

/**
 * Attachment input for creation forms.
 * Supports both file upload and external links.
 * Files are uploaded immediately to /api/documents/upload.
 * Attachments are stored locally until parent form submits.
 */
export function AttachmentInput({
  attachments,
  onChange,
  label = "Bilagor",
}: {
  attachments: PendingAttachment[];
  onChange: (attachments: PendingAttachment[]) => void;
  label?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "OTHER");

      try {
        const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Uppladdning misslyckades");
        const data = await res.json() as { id: string; fileName: string };

        onChange([...attachments, {
          type: "file",
          name: file.name,
          url: `/api/documents/${data.id}/download`,
          mimeType: file.type,
          fileSize: file.size,
        }]);
      } catch {
        // Silently skip failed uploads
      }
    }
    setUploading(false);
    setAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addLink() {
    if (!linkName || !linkUrl) return;
    onChange([...attachments, { type: "link", name: linkName, url: linkUrl }]);
    setLinkName("");
    setLinkUrl("");
    setAdding(false);
  }

  function remove(index: number) {
    onChange(attachments.filter((_, i) => i !== index));
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> {label} {attachments.length > 0 && `(${attachments.length})`}
        </label>
        {!adding && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <Camera className="h-3 w-3" /> Foto
            </button>
            <button type="button" onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <Plus className="h-3 w-3" /> Mer
            </button>
          </div>
        )}
      </div>

      {/* Listed attachments */}
      {attachments.length > 0 && (
        <div className="space-y-1 mb-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-700">
                {att.type === "file" ? <File className="h-3 w-3 text-blue-500" /> : <Link2 className="h-3 w-3 text-green-500" />}
                <span>{att.name}</span>
                {att.fileSize && <span className="text-gray-400">({formatSize(att.fileSize)})</span>}
              </div>
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden camera input — triggers native camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Quick photo button — always visible, one tap to camera */}
      {!adding && attachments.length === 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 active:bg-blue-200"
          >
            <Camera className="h-4 w-4" /> Ta foto
          </button>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" /> Fil eller länk
          </button>
        </div>
      )}

      {/* Add form — expanded view */}
      {adding && (
        <div className="rounded border border-blue-200 bg-blue-50/30 p-2 space-y-2">
          {/* Quick action row — camera + gallery */}
          <div className="flex gap-2">
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 py-2.5 text-xs font-medium text-blue-700 hover:bg-blue-50 active:bg-blue-100">
              <Camera className="h-4 w-4" /> Ta foto
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100">
              <Image className="h-4 w-4" /> Välj bild
            </button>
          </div>

          {uploading && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" /> Laddar upp...
            </div>
          )}

          {/* Mode tabs for file/link */}
          <div className="flex gap-1.5 border-t border-blue-100 pt-2">
            <button type="button" onClick={() => setMode("upload")}
              className={cn("rounded px-2 py-0.5 text-xs", mode === "upload" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              <Upload className="inline h-3 w-3 mr-0.5" /> Ladda upp fil
            </button>
            <button type="button" onClick={() => setMode("link")}
              className={cn("rounded px-2 py-0.5 text-xs", mode === "link" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              <Link2 className="inline h-3 w-3 mr-0.5" /> Extern länk
            </button>
          </div>

          {mode === "upload" && (
            <div>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                className="w-full text-xs text-gray-600 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          )}

          {mode === "link" && (
            <>
              <input type="text" value={linkName} onChange={(e) => setLinkName(e.target.value)}
                placeholder="Beskrivning, t.ex. 'Besiktningsprotokoll hos leverantör'"
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
              <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
              <button type="button" onClick={addLink} disabled={!linkName || !linkUrl}
                className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
                Lägg till
              </button>
            </>
          )}

          <button type="button" onClick={() => { setAdding(false); setLinkName(""); setLinkUrl(""); }}
            className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600">
            Stäng
          </button>
        </div>
      )}
    </div>
  );
}
