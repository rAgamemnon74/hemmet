"use client";

import { useSession } from "next-auth/react";
import { CalendarDays, AlertTriangle, CheckSquare, Megaphone } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Välkommen, {session?.user?.name?.split(" ")[0]}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          icon={CalendarDays}
          title="Kommande möten"
          value="0"
          color="blue"
        />
        <DashboardCard
          icon={CheckSquare}
          title="Öppna ärenden"
          value="0"
          color="amber"
        />
        <DashboardCard
          icon={AlertTriangle}
          title="Felanmälningar"
          value="0"
          color="red"
        />
        <DashboardCard
          icon={Megaphone}
          title="Meddelanden"
          value="0"
          color="green"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Senaste aktivitet
          </h2>
          <p className="text-sm text-gray-500">Ingen aktivitet ännu.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Kommande händelser
          </h2>
          <p className="text-sm text-gray-500">Inga kommande händelser.</p>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  color: "blue" | "amber" | "red" | "green";
}) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorStyles[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
