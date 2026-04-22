"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Play, CheckCircle, AlertTriangle, XCircle, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Report = {
  actions: string[];
  warnings: string[];
  errors: string[];
  stats: {
    settingsChanged: boolean;
    rulesChanged: boolean;
    propertyChanged: boolean;
    buildingsChanged: number;
    apartmentsCreated: number;
    resourcesChanged: number;
    slotsCreated: number;
    usersCreated: number;
    usersUpdated: number;
    staleUsersRemoved: number;
    auditorChanged: boolean;
  };
};

export function ImporteraTab() {
  const [yaml, setYaml] = useState("");
  const [dryRunReport, setDryRunReport] = useState<Report | null>(null);
  const [applyReport, setApplyReport] = useState<Report | null>(null);
  const [validationIssues, setValidationIssues] = useState<Array<{ path: string; message: string }> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const importMutation = trpc.settings.importBrf.useMutation();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setYaml(String(ev.target?.result ?? ""));
      clearResults();
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function clearResults() {
    setDryRunReport(null);
    setApplyReport(null);
    setValidationIssues(null);
    setParseError(null);
  }

  async function runDryRun() {
    clearResults();
    const result = await importMutation.mutateAsync({ yaml, apply: false });
    if (!result.ok) {
      setParseError(result.error);
      if ("issues" in result) setValidationIssues(result.issues ?? null);
      return;
    }
    setDryRunReport(result.report);
  }

  async function runApply() {
    const result = await importMutation.mutateAsync({ yaml, apply: true });
    if (!result.ok) {
      setParseError(result.error);
      if ("issues" in result) setValidationIssues(result.issues ?? null);
      return;
    }
    setApplyReport(result.report);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importera BRF-mall
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Ladda upp eller klistra in en BRF-mall i YAML-format för att snabbgrundladda
          föreningsinformation, stadgeregler, fastighet, bokningsresurser, styrelse,
          valberedning och revisor. Körningen är idempotent — samma fil kan importeras
          flera gånger utan dubbletter.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".yaml,.yml,text/yaml,text/plain"
          onChange={handleFile}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FileText className="h-4 w-4" /> Ladda upp .yaml
        </button>
        {yaml && (
          <span className="text-xs text-gray-500">
            {yaml.split("\n").length} rader, {Math.round(yaml.length / 1024)} KB
          </span>
        )}
        <a
          href="/example-brf.yaml"
          download="example-brf.yaml"
          className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <Download className="h-3 w-3" /> Ladda ner exempel-YAML
        </a>
      </div>

      <textarea
        value={yaml}
        onChange={(e) => { setYaml(e.target.value); clearResults(); }}
        rows={18}
        placeholder={`schema: "1.0"

settings:
  name: "Brf ..."
  orgNumber: "123456-7890"
  address: "Exempelvägen 1"
  city: "Stockholm"
  postalCode: "111 11"

rules:
  affiliation: NONE
  minBoardMembers: 3
  ...`}
        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="flex gap-2">
        <button
          onClick={runDryRun}
          disabled={!yaml.trim() || importMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {importMutation.isPending && !applyReport ? "Validerar..." : "Validera (dry-run)"}
        </button>
        <button
          onClick={runApply}
          disabled={!dryRunReport || importMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          title={!dryRunReport ? "Validera först" : undefined}
        >
          <CheckCircle className="h-4 w-4" />
          {importMutation.isPending && dryRunReport ? "Importerar..." : "Importera"}
        </button>
        {(dryRunReport || applyReport || validationIssues || parseError) && (
          <button onClick={clearResults}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Rensa
          </button>
        )}
      </div>

      {/* Parse-fel */}
      {parseError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-semibold text-red-900 flex items-center gap-1.5">
            <XCircle className="h-4 w-4" /> Fel
          </h3>
          <p className="mt-1 text-sm text-red-800">{parseError}</p>
          {validationIssues && validationIssues.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-red-800">
              {validationIssues.map((issue, i) => (
                <li key={i}>
                  <span className="font-mono">{issue.path || "(rot)"}</span>: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Dry-run resultat */}
      {dryRunReport && !applyReport && (
        <ReportView report={dryRunReport} mode="dry-run" />
      )}

      {/* Apply resultat */}
      {applyReport && (
        <ReportView report={applyReport} mode="applied" />
      )}
    </div>
  );
}

function ReportView({ report, mode }: { report: Report; mode: "dry-run" | "applied" }) {
  const isApplied = mode === "applied";
  return (
    <div className={`rounded-md border p-4 ${isApplied ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}>
      <h3 className={`text-sm font-semibold flex items-center gap-1.5 ${isApplied ? "text-green-900" : "text-blue-900"}`}>
        {isApplied ? <CheckCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {isApplied ? "Importerat" : "Förhandsgranskning"}
      </h3>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <StatCell label="BrfSettings" value={report.stats.settingsChanged ? "✓" : "–"} />
        <StatCell label="BrfRules" value={report.stats.rulesChanged ? "✓" : "–"} />
        <StatCell label="Property" value={report.stats.propertyChanged ? "✓" : "–"} />
        <StatCell label="Auditor" value={report.stats.auditorChanged ? "✓" : "–"} />
        <StatCell label="Byggnader" value={report.stats.buildingsChanged} />
        <StatCell label="Lägenheter" value={report.stats.apartmentsCreated} />
        <StatCell label="Resurser" value={report.stats.resourcesChanged} />
        <StatCell label="Pass" value={report.stats.slotsCreated} />
        <StatCell label="Nya användare" value={report.stats.usersCreated} />
        <StatCell label="Uppdaterade" value={report.stats.usersUpdated} />
        <StatCell label="Städade (stale)" value={report.stats.staleUsersRemoved} />
      </div>

      {report.warnings.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Varningar</p>
          <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs text-amber-800">
            {report.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <details className="mt-3">
        <summary className={`cursor-pointer text-xs font-semibold ${isApplied ? "text-green-900" : "text-blue-900"}`}>
          Detaljer ({report.actions.length} operationer)
        </summary>
        <ul className={`mt-2 space-y-0.5 font-mono text-[11px] ${isApplied ? "text-green-800" : "text-blue-800"}`}>
          {report.actions.map((a, i) => <li key={i}>✓ {a}</li>)}
        </ul>
      </details>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
