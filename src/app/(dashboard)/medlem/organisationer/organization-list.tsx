"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Landmark, Plus, Users, DoorOpen, FileCheck, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type Organization = {
  id: string;
  name: string;
  orgNumber: string;
  email: string | null;
  representatives: Array<{ id: string; firstName: string; lastName: string }>;
  ownerships: Array<{
    apartment: { number: string; building: { name: string } };
  }>;
  mandateDocuments: Array<{ id: string }>;
  _count: { representatives: number; ownerships: number; mandateDocuments: number };
};

export function OrganizationList({ initialData }: { initialData: Organization[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canEdit = hasPermission(userRoles, "member:edit");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", orgNumber: "", email: "" });

  const create = trpc.organization.create.useMutation({
    onSuccess: (org) => router.push(`/medlem/organisationer/${org.id}`),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      name: form.name,
      orgNumber: form.orgNumber,
      email: form.email || undefined,
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organisationer</h1>
          <p className="mt-1 text-sm text-gray-500">
            Juridiska personer som äger bostadsrätter i föreningen
          </p>
        </div>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Lägg till organisation
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Företagsnamn *</label>
              <input
                type="text" required value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Organisationsnummer *</label>
              <input
                type="text" required value={form.orgNumber}
                onChange={(e) => setForm((f) => ({ ...f, orgNumber: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="556xxx-xxxx"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
            <button type="submit" disabled={create.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {create.isPending ? "Skapar..." : "Skapa"}
            </button>
          </div>
        </form>
      )}

      {initialData.length === 0 && !showForm ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Landmark className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga organisationer</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {initialData.map((org) => {
            const hasMandateIssue = org._count.mandateDocuments === 0 && org._count.ownerships > 0;

            return (
              <Link
                key={org.id}
                href={`/medlem/organisationer/${org.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{org.name}</h3>
                      <span className="text-xs text-gray-500">{org.orgNumber}</span>
                      {hasMandateIssue && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          Beslutsdokument saknas
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {org._count.representatives} ombud
                      </span>
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-3 w-3" />
                        {org._count.ownerships} lägenheter
                      </span>
                      <span className="flex items-center gap-1">
                        <FileCheck className="h-3 w-3" />
                        {org._count.mandateDocuments} dokument
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
