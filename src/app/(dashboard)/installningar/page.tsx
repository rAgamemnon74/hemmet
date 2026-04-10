"use client";

import { useState } from "react";
import {
  Building2, CreditCard, Scale, Users, ListChecks, Plug, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GrunddataTab } from "./tabs/grunddata-tab";
import { EkonomiTab } from "./tabs/ekonomi-tab";
import { StadgeregelTab } from "./tabs/stadgeregel-tab";
import { FastigheterTab } from "./tabs/fastigheter-tab";
import { AnvandareTab } from "./tabs/anvandare-tab";
import { DagordningTab } from "./tabs/dagordning-tab";
import { IntegrationerTab } from "./tabs/integrationer-tab";

const tabs = [
  { id: "grunddata", label: "Grunddata", icon: Building2 },
  { id: "ekonomi", label: "Ekonomi", icon: CreditCard },
  { id: "stadgeregler", label: "Stadgeregler", icon: Scale },
  { id: "fastigheter", label: "Fastigheter", icon: Building2 },
  { id: "anvandare", label: "Användare", icon: Users },
  { id: "dagordning", label: "Dagordning", icon: ListChecks },
  { id: "integrationer", label: "Integrationer", icon: Plug },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("grunddata");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Inställningar
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === "grunddata" && <GrunddataTab />}
          {activeTab === "ekonomi" && <EkonomiTab />}
          {activeTab === "stadgeregler" && <StadgeregelTab />}
          {activeTab === "fastigheter" && <FastigheterTab />}
          {activeTab === "anvandare" && <AnvandareTab />}
          {activeTab === "dagordning" && <DagordningTab />}
          {activeTab === "integrationer" && <IntegrationerTab />}
        </div>
      </div>
    </div>
  );
}
