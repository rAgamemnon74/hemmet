"use client";

import { useState, useEffect } from "react";
import { FileText, ImageIcon, File as FileIcon, ExternalLink, X, Maximize2, Link2, FileSpreadsheet, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgendaAttachment = {
  id: string;
  type: string;       // "file" | "link"
  name: string;
  url: string;
  mimeType: string | null;
  fileSize: number | null;
};

type Kind = "pdf" | "image" | "text" | "office-word" | "office-excel" | "office-ppt" | "link" | "unknown";

function getKind(att: AgendaAttachment): Kind {
  if (att.type === "link") return "link";
  const m = (att.mimeType ?? "").toLowerCase();
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("text/") || m === "application/json") return "text";
  if (m.includes("word") || m.includes("officedocument.wordprocessingml")) return "office-word";
  if (m.includes("excel") || m.includes("spreadsheetml")) return "office-excel";
  if (m.includes("powerpoint") || m.includes("presentationml")) return "office-ppt";
  return "unknown";
}

function kindIcon(kind: Kind) {
  switch (kind) {
    case "pdf":         return FileText;
    case "image":       return ImageIcon;
    case "text":        return FileText;
    case "office-word": return FileText;
    case "office-excel": return FileSpreadsheet;
    case "office-ppt":  return Presentation;
    case "link":        return Link2;
    default:            return FileIcon;
  }
}

function canEmbed(kind: Kind): boolean {
  return kind === "pdf" || kind === "image" || kind === "text";
}

export function AgendaAttachmentViewer({ attachments }: { attachments: AgendaAttachment[] }) {
  const [activeId, setActiveId] = useState<string | null>(attachments[0]?.id ?? null);
  const [maximized, setMaximized] = useState(false);

  // Om listan ändras (byte av agendapunkt), återställ
  useEffect(() => {
    setActiveId(attachments[0]?.id ?? null);
    setMaximized(false);
  }, [attachments.map((a) => a.id).join(",")]);

  // Stäng fullskärm med Escape
  useEffect(() => {
    if (!maximized) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMaximized(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maximized]);

  if (attachments.length === 0) return null;
  const active = attachments.find((a) => a.id === activeId) ?? attachments[0];
  const activeKind = getKind(active);

  if (maximized) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white truncate">{active.name}</h3>
          <div className="flex gap-2 shrink-0 ml-4">
            <a href={active.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-sm text-gray-300"
              title="Öppna i ny flik">
              <ExternalLink className="h-4 w-4" /> Ny flik
            </a>
            <button onClick={() => setMaximized(false)}
              className="inline-flex items-center gap-1.5 rounded bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-sm text-gray-300"
              title="Stäng (Esc)">
              <X className="h-4 w-4" /> Stäng
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-white">
          <Preview att={active} kind={activeKind} fullscreen />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Bilagor ({attachments.length})
        </h3>
        {canEmbed(activeKind) && (
          <button onClick={() => setMaximized(true)}
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
            <Maximize2 className="h-3.5 w-3.5" /> Fullskärm
          </button>
        )}
      </div>

      {attachments.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {attachments.map((a) => {
            const Icon = kindIcon(getKind(a));
            return (
              <button key={a.id} onClick={() => setActiveId(a.id)}
                className={cn(
                  "rounded px-2 py-1 text-xs flex items-center gap-1.5 transition-colors",
                  a.id === activeId
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                )}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-[200px]">{a.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-lg overflow-hidden bg-gray-900">
        <Preview att={active} kind={activeKind} />
      </div>
    </div>
  );
}

function Preview({ att, kind, fullscreen = false }: { att: AgendaAttachment; kind: Kind; fullscreen?: boolean }) {
  const heightClass = fullscreen ? "h-full w-full" : "h-[450px] w-full";

  if (kind === "pdf" || kind === "text") {
    return <iframe src={att.url} className={cn(heightClass, "bg-white")} title={att.name} />;
  }
  if (kind === "image") {
    return (
      <div className={cn(heightClass, "flex items-center justify-center bg-gray-900")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={att.url} alt={att.name} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  // Office-format, länkar, okända — fallback till kort med öppna-knapp.
  const Icon = kindIcon(kind);
  const label =
    kind === "office-word"  ? "Word-dokument — förhandsvisning ej tillgänglig i webbläsare" :
    kind === "office-excel" ? "Excel-kalkyl — förhandsvisning ej tillgänglig i webbläsare" :
    kind === "office-ppt"   ? "PowerPoint-presentation — förhandsvisning ej tillgänglig i webbläsare" :
    kind === "link"         ? "Extern länk" :
                              "Förhandsvisning ej tillgänglig för denna filtyp";

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", fullscreen ? "h-full bg-gray-100" : "min-h-[200px]")}>
      <Icon className={cn("mb-3", fullscreen ? "h-24 w-24 text-gray-400" : "h-14 w-14 text-gray-500")} />
      <p className={cn("font-medium mb-1", fullscreen ? "text-2xl text-gray-800" : "text-lg text-gray-200")}>{att.name}</p>
      <p className={cn("mb-4", fullscreen ? "text-sm text-gray-600" : "text-xs text-gray-500")}>{label}</p>
      <a href={att.url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white">
        <ExternalLink className="h-4 w-4" />
        {kind === "link" ? "Öppna länk" : "Öppna i ny flik"}
      </a>
    </div>
  );
}
