"use client";

import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  DoorOpen,
  Users,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApartmentType, ReportStatus } from "@prisma/client";

type ApartmentData = {
  id: string;
  number: string;
  floor: number | null;
  area: number | null;
  rooms: number | null;
  share: number | null;
  monthlyFee: number | null;
  objectNumber: string | null;
  type: ApartmentType;
  balcony: boolean;
  patio: boolean;
  storage: string | null;
  parking: string | null;
  acquiredAt: Date | null;
  notes: string | null;
  building: {
    id: string;
    name: string;
    address: string;
    propertyDesignation: string | null;
  };
  residents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    roles: Array<{ role: string }>;
  }>;
  damageReports: Array<{
    id: string;
    title: string;
    status: ReportStatus;
    createdAt: Date;
  }>;
};

const typeLabels: Record<ApartmentType, string> = {
  APARTMENT: "Lägenhet",
  COMMERCIAL: "Lokal",
  GARAGE: "Garage",
  STORAGE: "Förråd",
  OTHER: "Övrigt",
};

const statusLabels: Record<ReportStatus, string> = {
  SUBMITTED: "Inskickad",
  ACKNOWLEDGED: "Mottagen",
  IN_PROGRESS: "Pågår",
  RESOLVED: "Åtgärdad",
  CLOSED: "Stängd",
};

export function ApartmentDetail({ apartment: apt }: { apartment: ApartmentData }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/medlem/lagenheter"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till lägenhetsregister
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <DoorOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Lägenhet {apt.number}
                </h1>
                <p className="text-sm text-gray-500">
                  {apt.building.name}, {apt.building.address}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem label="Typ" value={typeLabels[apt.type]} />
              <InfoItem label="Våningsplan" value={apt.floor?.toString()} />
              <InfoItem label="Yta" value={apt.area ? `${apt.area} kvm` : undefined} />
              <InfoItem label="Rum" value={apt.rooms?.toString()} />
              <InfoItem label="Objektnummer" value={apt.objectNumber} />
              {apt.building.propertyDesignation && (
                <InfoItem label="Fastighet" value={apt.building.propertyDesignation} />
              )}
            </div>
          </div>

          {/* Residents */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Boende ({apt.residents.length})
            </h2>
            {apt.residents.length > 0 ? (
              <div className="space-y-3">
                {apt.residents.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                      {r.phone && <p className="text-xs text-gray-500">{r.phone}</p>}
                    </div>
                    <div className="flex gap-1">
                      {r.roles.map((role) => (
                        <span key={role.role} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">
                          {role.role.replace("BOARD_", "").replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Vakant — inga boende registrerade.</p>
            )}
          </div>

          {/* Active damage reports */}
          {apt.damageReports.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Öppna felanmälningar
              </h2>
              <div className="space-y-2">
                {apt.damageReports.map((r) => (
                  <Link
                    key={r.id}
                    href={`/boende/skadeanmalan/${r.id}`}
                    className="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{r.title}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{statusLabels[r.status]}</span>
                      <span>{format(new Date(r.createdAt), "d MMM", { locale: sv })}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {apt.notes && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Anteckningar</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{apt.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Ekonomi */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Ekonomi
            </h3>
            <div>
              <p className="text-xs text-gray-500">Andelstal</p>
              <p className="text-lg font-bold text-gray-900">
                {apt.share ? `${(apt.share * 100).toFixed(2)}%` : "Ej satt"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Månadsavgift</p>
              <p className="text-lg font-bold text-gray-900">
                {apt.monthlyFee
                  ? `${apt.monthlyFee.toLocaleString("sv-SE")} kr`
                  : "Ej satt"}
              </p>
            </div>
            {apt.area && apt.monthlyFee && (
              <div>
                <p className="text-xs text-gray-500">Avgift per kvm</p>
                <p className="text-sm font-medium text-gray-700">
                  {Math.round(apt.monthlyFee / apt.area).toLocaleString("sv-SE")} kr/kvm
                </p>
              </div>
            )}
          </div>

          {/* Tillbehör */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Tillbehör</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Balkong</span>
                <span className={apt.balcony ? "text-green-600 font-medium" : "text-gray-400"}>
                  {apt.balcony ? "Ja" : "Nej"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Uteplats</span>
                <span className={apt.patio ? "text-green-600 font-medium" : "text-gray-400"}>
                  {apt.patio ? "Ja" : "Nej"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Förråd</span>
                <span className="text-gray-700">{apt.storage ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parkering</span>
                <span className="text-gray-700">{apt.parking ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Fastighet */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Fastighet
            </h3>
            <p className="text-sm text-gray-900 font-medium">{apt.building.name}</p>
            <p className="text-sm text-gray-600">{apt.building.address}</p>
            {apt.building.propertyDesignation && (
              <p className="text-xs text-gray-500">{apt.building.propertyDesignation}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value ?? "—"}</p>
    </div>
  );
}
