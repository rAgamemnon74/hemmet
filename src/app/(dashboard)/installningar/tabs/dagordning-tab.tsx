"use client";

import { BOARD_MEETING_TEMPLATE, ANNUAL_MEETING_TEMPLATE, EXTRAORDINARY_MEETING_TEMPLATE } from "@/lib/agenda-templates";
import { Clock } from "lucide-react";

export function DagordningTab() {
  const templates = [
    { type: "Styrelsemöte", items: BOARD_MEETING_TEMPLATE },
    { type: "Årsmöte (ordinarie stämma)", items: ANNUAL_MEETING_TEMPLATE },
    { type: "Extra stämma", items: EXTRAORDINARY_MEETING_TEMPLATE },
  ];

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        Dagordningsmallar som används vid skapande av nya möten. Punkterna kan alltid redigeras efteråt i varje enskilt möte.
      </div>

      {templates.map((tmpl) => {
        const totalMin = tmpl.items.reduce((s, i) => s + (i.duration ?? 0), 0);
        return (
          <div key={tmpl.type} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{tmpl.type}</h2>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                {tmpl.items.length} punkter, ca {totalMin} min
              </span>
            </div>
            <div className="space-y-1">
              {tmpl.items.map((item, i) => (
                <div key={i} className="flex items-baseline gap-3 rounded-md px-3 py-1.5 hover:bg-gray-50">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm text-gray-900">{item.title}</span>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  {item.duration && (
                    <span className="text-xs text-gray-400 shrink-0">{item.duration} min</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-gray-400 italic">
        Anpassade mallar per förening kommer i en framtida version. Kontakta administratören för att ändra standardmallarna.
      </p>
    </div>
  );
}
