"use client";

import { useState } from "react";
import { Paperclip, Plus, X, Link2, File } from "lucide-react";
import { cn } from "@/lib/utils";

export type PendingAttachment = {
  type: "file" | "link";
  name: string;
  url: string;
};

/**
 * Attachment input for creation forms.
 * Collects attachments locally — parent form submits them after entity creation.
 *
 * Usage:
 * const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
 * <AttachmentInput attachments={attachments} onChange={setAttachments} />
 *
 * After entity created:
 * for (const att of attachments) {
 *   await addAttachment({ entityType, entityId: newId, ...att });
 * }
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
  const [type, setType] = useState<"link" | "file">("link");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  function add() {
    if (!name || !url) return;
    onChange([...attachments, { type, name, url }]);
    setName("");
    setUrl("");
    setAdding(false);
  }

  function remove(index: number) {
    onChange(attachments.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> {label} {attachments.length > 0 && `(${attachments.length})`}
        </label>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
            <Plus className="h-3 w-3" /> Lägg till
          </button>
        )}
      </div>

      {/* Listed attachments */}
      {attachments.length > 0 && (
        <div className="space-y-1 mb-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-700">
                {att.type === "file" ? <File className="h-3 w-3 text-gray-400" /> : <Link2 className="h-3 w-3 text-gray-400" />}
                {att.name}
              </div>
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="rounded border border-blue-200 bg-blue-50/30 p-2 space-y-1.5">
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setType("link")}
              className={cn("rounded px-2 py-0.5 text-xs", type === "link" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              Länk
            </button>
            <button type="button" onClick={() => setType("file")}
              className={cn("rounded px-2 py-0.5 text-xs", type === "file" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              Fil (URL)
            </button>
          </div>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={type === "link" ? "Beskrivning" : "Filnamn"}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder={type === "link" ? "https://..." : "/api/documents/..."}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs" />
          <div className="flex gap-1.5">
            <button type="button" onClick={add} disabled={!name || !url}
              className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
              Lägg till
            </button>
            <button type="button" onClick={() => { setAdding(false); setName(""); setUrl(""); }}
              className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600">
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
