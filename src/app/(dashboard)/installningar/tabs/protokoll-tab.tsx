"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Save, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  DEFAULT_PROTOCOL_HEADER_CONFIG,
  FIELD_LABELS,
  FIELD_ORDER,
  MEETING_TYPE_LABELS,
  parseProtocolHeaderConfig,
  type ProtocolHeaderConfig,
  type ProtocolHeaderFieldKey,
} from "@/lib/protocol-header";
import type { MeetingType } from "@prisma/client";

const MEETING_TYPES: MeetingType[] = ["BOARD", "ANNUAL", "EXTRAORDINARY"];

export function ProtokollTab() {
  const router = useRouter();
  const settingsQuery = trpc.settings.get.useQuery();
  const updateConfig = trpc.settings.updateProtocolHeaderConfig.useMutation({
    onSuccess: () => { setDirty(false); router.refresh(); },
  });

  const [config, setConfig] = useState<ProtocolHeaderConfig>(DEFAULT_PROTOCOL_HEADER_CONFIG);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settingsQuery.data?.protocolHeaderConfig !== undefined) {
      setConfig(parseProtocolHeaderConfig(settingsQuery.data.protocolHeaderConfig));
    }
  }, [settingsQuery.data?.protocolHeaderConfig]);

  function toggle(type: MeetingType, field: ProtocolHeaderFieldKey) {
    setConfig((c) => ({
      ...c,
      [type]: { ...c[type], [field]: !c[type][field] },
    }));
    setDirty(true);
  }

  function resetDefaults() {
    setConfig(DEFAULT_PROTOCOL_HEADER_CONFIG);
    setDirty(true);
  }

  function save() {
    updateConfig.mutate({ config });
  }

  if (settingsQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Protokoll-huvud
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Välj vilka rader som ska ingå i sidhuvudet på genererade protokoll, per mötestyp.
          Inställningarna påverkar &ldquo;Generera utkast från möteslogg&rdquo; samt .md- och .docx-nedladdningar.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border-b border-gray-200 px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600">Fält</th>
              {MEETING_TYPES.map((t) => (
                <th key={t} className="border-b border-gray-200 px-4 py-2.5 text-center text-xs font-semibold uppercase text-gray-600">
                  {MEETING_TYPE_LABELS[t]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELD_ORDER.map((field) => (
              <tr key={field} className="hover:bg-gray-50/50">
                <td className="border-b border-gray-100 px-4 py-2 text-sm text-gray-800">
                  {FIELD_LABELS[field]}
                </td>
                {MEETING_TYPES.map((t) => (
                  <td key={t} className="border-b border-gray-100 px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={config[t][field]}
                      onChange={() => toggle(t, field)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs text-blue-900">
        <p className="font-semibold">Tips</p>
        <ul className="mt-1 ml-4 list-disc space-y-0.5 text-blue-800">
          <li>Styrelseprotokoll är interna — kontaktuppgifter (webb/e-post) är default av.</li>
          <li>Stämmoprotokoll publiceras till medlemmar — webb/e-post hjälper att hitta föreningen.</li>
          <li>Protokollsreferens beräknas automatiskt som &ldquo;N:e möte av denna typ under räkenskapsåret&rdquo;.</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={!dirty || updateConfig.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {updateConfig.isPending ? "Sparar..." : "Spara"}
        </button>
        <button
          onClick={resetDefaults}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
          Återställ standardvärden
        </button>
        {updateConfig.error && (
          <span className="text-sm text-red-600 self-center">{updateConfig.error.message}</span>
        )}
      </div>
    </div>
  );
}
