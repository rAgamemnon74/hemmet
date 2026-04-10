"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  FileText, Upload, Search, Filter, Download, Lock, Trash2,
  Eye, EyeOff, Users, Globe, Shield, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, DocumentCategory } from "@prisma/client";

const categoryLabels: Record<DocumentCategory, string> = {
  MEETING_PROTOCOL: "Mötesprotokoll",
  MEETING_ATTACHMENT: "Mötesbilagor",
  EXPENSE_RECEIPT: "Kvitton",
  MOTION_ATTACHMENT: "Motionsbilagor",
  DAMAGE_REPORT_PHOTO: "Felanmälan-foton",
  ANNUAL_REPORT: "Årsredovisning",
  FINANCIAL_STATEMENT: "Bokslut",
  AUDIT_REPORT: "Revisionsberättelse",
  ORGANIZATION_MANDATE: "Mandatdokument",
  RULES: "Stadgar & ordningsregler",
  OTHER: "Övrigt",
};

const categoryColors: Record<string, string> = {
  MEETING_PROTOCOL: "bg-blue-100 text-blue-700",
  ANNUAL_REPORT: "bg-green-100 text-green-700",
  AUDIT_REPORT: "bg-purple-100 text-purple-700",
  RULES: "bg-amber-100 text-amber-700",
  EXPENSE_RECEIPT: "bg-gray-100 text-gray-700",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canUpload = hasPermission(userRoles, "document:upload");

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const docsQuery = trpc.document.list.useQuery({
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    search: search || undefined,
  });

  const lockDoc = trpc.document.lock.useMutation({ onSuccess: () => docsQuery.refetch() });
  const deleteDoc = trpc.document.delete.useMutation({ onSuccess: () => docsQuery.refetch() });
  const updateDoc = trpc.document.update.useMutation({ onSuccess: () => docsQuery.refetch() });

  const docs = docsQuery.data ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokumentarkiv</h1>
          <p className="mt-1 text-sm text-gray-500">{docs.length} dokument</p>
        </div>
        {canUpload && !showUpload && (
          <button onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            <Upload className="h-4 w-4" /> Ladda upp
          </button>
        )}
      </div>

      {/* Upload form */}
      {showUpload && (
        <UploadForm
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); docsQuery.refetch(); }}
        />
      )}

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök dokument..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400" />
          <button onClick={() => setCategoryFilter("ALL")}
            className={cn("rounded-full px-3 py-1 text-xs font-medium", categoryFilter === "ALL" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
            Alla
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button key={key} onClick={() => setCategoryFilter(key)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium", categoryFilter === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      {docs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga dokument</h3>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Dokument</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Storlek</th>
                <th className="px-4 py-3">Uppladdad</th>
                <th className="px-4 py-3">Synlighet</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {doc.locked && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <div>
                        <a href={`/api/documents/${doc.id}/download`} target="_blank"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {doc.fileName}
                        </a>
                        {doc.description && <p className="text-xs text-gray-500">{doc.description}</p>}
                        {doc._count.versions > 0 && (
                          <span className="text-xs text-gray-400">{doc._count.versions + 1} versioner</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[doc.category] ?? "bg-gray-100 text-gray-600")}>
                      {categoryLabels[doc.category as DocumentCategory] ?? doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(doc.fileSize)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</p>
                    <p className="text-xs text-gray-400">{format(new Date(doc.updatedAt), "d MMM yyyy", { locale: sv })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {doc.visibleToAll ? (
                        <span className="flex items-center gap-0.5 text-xs text-green-600"><Globe className="h-3 w-3" /> Alla</span>
                      ) : doc.visibleToMembers ? (
                        <span className="flex items-center gap-0.5 text-xs text-blue-600"><Users className="h-3 w-3" /> Medlemmar</span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-xs text-gray-500"><Shield className="h-3 w-3" /> Styrelsen</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canUpload && (
                      <div className="flex items-center gap-1">
                        <a href={`/api/documents/${doc.id}/download`} target="_blank"
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Ladda ner">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        {!doc.locked && (
                          <>
                            <button onClick={() => {
                              const next = !doc.visibleToMembers;
                              updateDoc.mutate({ id: doc.id, visibleToMembers: next });
                            }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100" title="Synlighet medlemmar">
                              {doc.visibleToMembers ? <Eye className="h-3.5 w-3.5 text-blue-500" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => lockDoc.mutate({ id: doc.id })}
                              className="rounded p-1 text-gray-400 hover:bg-amber-50 hover:text-amber-500" title="Lås">
                              <Lock className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { if (confirm("Radera dokumentet?")) deleteDoc.mutate({ id: doc.id }); }}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Radera">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {doc.locked && (
                          <span className="text-xs text-amber-500 flex items-center gap-0.5">
                            <CheckCircle className="h-3 w-3" /> Låst
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UploadForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>("OTHER");
  const [description, setDescription] = useState("");
  const [visibleToMembers, setVisibleToMembers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("visibleToMembers", String(visibleToMembers));

    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
    setUploading(false);

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      alert(data.error ?? "Uppladdning misslyckades");
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Ladda upp dokument</h3>

      <div
        onClick={() => fileRef.current?.click()}
        className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        {selectedFile ? (
          <p className="text-sm text-gray-900 font-medium">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
        ) : (
          <p className="text-sm text-gray-500">Klicka för att välja fil</p>
        )}
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Beskrivning</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Valfri beskrivning" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={visibleToMembers} onChange={(e) => setVisibleToMembers(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        Synlig för medlemmar
      </label>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
        <button onClick={handleUpload} disabled={!selectedFile || uploading}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {uploading ? "Laddar upp..." : "Ladda upp"}
        </button>
      </div>
    </div>
  );
}
