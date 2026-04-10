"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  ArrowLeft, Landmark, Users, DoorOpen, FileCheck, Plus,
  UserMinus, AlertTriangle, Check, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type OrganizationData = {
  id: string;
  name: string;
  orgNumber: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  notes: string | null;
  representatives: Array<{
    id: string;
    personalId: string;
    firstName: string;
    lastName: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    active: boolean;
    grantedAt: Date;
    revokedAt: Date | null;
  }>;
  ownerships: Array<{
    id: string;
    ownershipShare: number;
    apartment: {
      id: string;
      number: string;
      area: number | null;
      monthlyFee: number | null;
      building: { name: string };
    };
  }>;
  mandateDocuments: Array<{
    id: string;
    documentName: string;
    documentUrl: string;
    description: string | null;
    validFrom: Date;
    validUntil: Date | null;
    uploadedAt: Date;
  }>;
};

export function OrganizationDetail({ organization: org }: { organization: OrganizationData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canEdit = hasPermission(userRoles, "member:edit");

  const [showRepForm, setShowRepForm] = useState(false);
  const [repForm, setRepForm] = useState({
    personalId: "", firstName: "", lastName: "",
    address: "", phone: "", email: "",
  });

  const addRep = trpc.organization.addRepresentative.useMutation({
    onSuccess: () => {
      setShowRepForm(false);
      setRepForm({ personalId: "", firstName: "", lastName: "", address: "", phone: "", email: "" });
      router.refresh();
    },
  });

  const revokeRep = trpc.organization.revokeRepresentative.useMutation({
    onSuccess: () => router.refresh(),
  });

  const activeReps = org.representatives.filter((r) => r.active);
  const inactiveReps = org.representatives.filter((r) => !r.active);
  const hasMandateDoc = org.mandateDocuments.length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/medlem/organisationer" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Landmark className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{org.name}</h1>
              <p className="text-sm text-gray-500">{org.orgNumber}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {org.address && (
              <div>
                <p className="text-xs text-gray-500">Adress</p>
                <p className="text-gray-900">{org.address}{org.city && `, ${org.city}`}</p>
              </div>
            )}
            {org.phone && (
              <div>
                <p className="text-xs text-gray-500">Telefon</p>
                <p className="text-gray-900">{org.phone}</p>
              </div>
            )}
            {org.email && (
              <div>
                <p className="text-xs text-gray-500">E-post</p>
                <p className="text-gray-900">{org.email}</p>
              </div>
            )}
            {org.contactPerson && (
              <div>
                <p className="text-xs text-gray-500">Kontaktperson</p>
                <p className="text-gray-900">{org.contactPerson}</p>
              </div>
            )}
          </div>
        </div>

        {/* Mandate warning */}
        {!hasMandateDoc && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Beslutsdokument saknas</p>
              <p className="mt-1 text-sm text-red-700">
                Ett signerat beslutsdokument från den juridiska personen måste laddas upp.
                Dokumentet ska styrka att registrerade ombud har rätt att representera organisationen vid årsstämma och i andra föreningsärenden.
              </p>
            </div>
          </div>
        )}

        {/* Mandate documents */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Beslutsdokument ({org.mandateDocuments.length})
            </h2>
          </div>
          {org.mandateDocuments.length > 0 ? (
            <div className="space-y-2">
              {org.mandateDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.documentName}</p>
                    {doc.description && <p className="text-xs text-gray-500">{doc.description}</p>}
                    <p className="text-xs text-gray-400">
                      Uppladdat {format(new Date(doc.uploadedAt), "d MMM yyyy", { locale: sv })}
                      {doc.validUntil
                        ? ` — Giltigt t.o.m. ${format(new Date(doc.validUntil), "d MMM yyyy", { locale: sv })}`
                        : " — Giltigt tillsvidare"}
                    </p>
                  </div>
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Inga dokument uppladdade.</p>
          )}
          {canEdit && (
            <p className="mt-3 text-xs text-gray-400 italic">
              Dokumentuppladdning sker via dokumenthanteringen (kommer i nästa version).
            </p>
          )}
        </div>

        {/* Representatives */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ombud ({activeReps.length} aktiva)
            </h2>
            {canEdit && !showRepForm && (
              <button
                onClick={() => setShowRepForm(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Lägg till ombud
              </button>
            )}
          </div>

          {activeReps.length > 0 && (
            <div className="space-y-3 mb-4">
              {activeReps.map((rep) => (
                <div key={rep.id} className="rounded-md border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {rep.firstName} {rep.lastName}
                      </p>
                      <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                        <span>Personnr: {rep.personalId}</span>
                        {rep.email && <span>E-post: {rep.email}</span>}
                        {rep.phone && <span>Telefon: {rep.phone}</span>}
                        {rep.address && <span>Adress: {rep.address}</span>}
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Registrerad {format(new Date(rep.grantedAt), "d MMM yyyy", { locale: sv })}
                      </p>
                    </div>
                    {canEdit && activeReps.length > 1 && (
                      <button
                        onClick={() => revokeRep.mutate({ id: rep.id })}
                        disabled={revokeRep.isPending}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Återkalla ombud"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeReps.length === 0 && !showRepForm && (
            <p className="text-sm text-gray-500 mb-4">
              Inga aktiva ombud. Minst ett ombud måste registreras.
            </p>
          )}

          {/* Inactive reps */}
          {inactiveReps.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Tidigare ombud</p>
              {inactiveReps.map((rep) => (
                <div key={rep.id} className="text-xs text-gray-400 py-1">
                  {rep.firstName} {rep.lastName} ({rep.personalId})
                  — återkallad {rep.revokedAt && format(new Date(rep.revokedAt), "d MMM yyyy", { locale: sv })}
                </div>
              ))}
            </div>
          )}

          {/* Add representative form */}
          {showRepForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addRep.mutate({
                  organizationId: org.id,
                  ...repForm,
                  address: repForm.address || undefined,
                  phone: repForm.phone || undefined,
                  email: repForm.email || undefined,
                });
              }}
              className="mt-3 rounded-md border border-blue-200 bg-blue-50/50 p-4 space-y-3"
            >
              <h3 className="text-sm font-semibold text-gray-900">Nytt ombud</h3>

              {addRep.error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {addRep.error.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Förnamn *</label>
                  <input type="text" required value={repForm.firstName}
                    onChange={(e) => setRepForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Efternamn *</label>
                  <input type="text" required value={repForm.lastName}
                    onChange={(e) => setRepForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Personnummer *</label>
                <input type="text" required value={repForm.personalId}
                  onChange={(e) => setRepForm((f) => ({ ...f, personalId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="YYYYMMDD-XXXX"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Adress</label>
                <input type="text" value={repForm.address}
                  onChange={(e) => setRepForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Telefon</label>
                  <input type="tel" value={repForm.phone}
                    onChange={(e) => setRepForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">E-post</label>
                  <input type="email" value={repForm.email}
                    onChange={(e) => setRepForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowRepForm(false)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Avbryt
                </button>
                <button type="submit" disabled={addRep.isPending}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {addRep.isPending ? "Lägger till..." : "Lägg till ombud"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Owned apartments */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            Ägda lägenheter ({org.ownerships.length})
          </h2>
          {org.ownerships.length > 0 ? (
            <div className="space-y-2">
              {org.ownerships.map((o) => (
                <Link
                  key={o.id}
                  href={`/medlem/lagenheter/${o.apartment.id}`}
                  className="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50"
                >
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {o.apartment.building.name}, lgh {o.apartment.number}
                    </span>
                    {o.apartment.area && (
                      <span className="text-gray-500 ml-2">{o.apartment.area} kvm</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {(o.ownershipShare * 100).toFixed(0)}%
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Inga lägenheter registrerade.</p>
          )}
        </div>
      </div>
    </div>
  );
}
