"use client";

import { Users, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function ContractorsPage() {
  const contractorsQuery = trpc.property.listContractors.useQuery();

  if (contractorsQuery.isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  const contractors = contractorsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Users className="h-6 w-6 text-blue-600" /> Leverantörer
      </h1>

      {contractors.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga leverantörer registrerade</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {contractors.map((c) => {
            const contractExpiring = c.contractEndDate && new Date(c.contractEndDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            return (
              <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.category}{c.contactPerson ? ` — ${c.contactPerson}` : ""}</p>
                    {c.phone && <p className="text-xs text-gray-400">{c.phone}{c.email ? ` | ${c.email}` : ""}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.pubAgreement ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> PUB-avtal
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> PUB saknas
                      </span>
                    )}
                    {contractExpiring && (
                      <span className="text-xs text-amber-600">Avtal förfaller snart</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
