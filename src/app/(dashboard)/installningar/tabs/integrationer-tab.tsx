"use client";

import { Plug, ExternalLink } from "lucide-react";

const integrations = [
  { name: "Fortnox", description: "Bokföring och fakturering. Synka utlägg som verifikationer.", status: "planned" },
  { name: "Visma", description: "Alternativ till Fortnox för redovisning.", status: "planned" },
  { name: "Boverket", description: "Export av medlemsregister och lägenhetsförteckning.", status: "planned" },
  { name: "EV-laddning", description: "Laddstationer och laddningssessioner per lägenhet.", status: "planned" },
  { name: "Solenergi", description: "Solproduktion och energidata från solcellsanläggning.", status: "planned" },
  { name: "Elleverantör", description: "Elförbrukning och kostnadsuppföljning.", status: "planned" },
  { name: "Vatten/avlopp", description: "Vattenförbrukning och avloppshantering.", status: "planned" },
  { name: "Sophantering", description: "Sophämtning och återvinningsstatistik.", status: "planned" },
];

export function IntegrationerTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Plug className="h-5 w-5" />
        Integrationer
      </h2>
      <p className="text-sm text-gray-500">
        Kopplingar till externa system. Integrationer är under utveckling.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {integrations.map((int) => (
          <div key={int.name} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-900">{int.name}</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                Planerad
              </span>
            </div>
            <p className="text-xs text-gray-500">{int.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
