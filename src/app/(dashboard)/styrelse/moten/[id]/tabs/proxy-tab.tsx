"use client";

import { useState } from "react";
import { UserCheck, Plus, Check, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, ProxyType } from "@prisma/client";

export function ProxyTab({
  meetingId,
  canEdit,
}: {
  meetingId: string;
  canEdit: boolean;
}) {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canApprove = hasPermission(userRoles, "annual:schedule");

  const proxiesQuery = trpc.voterRegistry.listProxies.useQuery({ meetingId });
  const membersQuery = trpc.voterRegistry.getMembers.useQuery();
  const rulesQuery = trpc.brfRules.get.useQuery();
  const rules = rulesQuery.data;

  const registerProxy = trpc.voterRegistry.registerProxy.useMutation({
    onSuccess: () => {
      proxiesQuery.refetch();
      setShowForm(false);
      resetForm();
    },
  });
  const approveProxy = trpc.voterRegistry.approveProxy.useMutation({
    onSuccess: () => proxiesQuery.refetch(),
  });
  const removeProxy = trpc.voterRegistry.removeProxy.useMutation({
    onSuccess: () => proxiesQuery.refetch(),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    memberId: "",
    proxyType: "MEMBER" as ProxyType,
    proxyMemberId: "",
    externalName: "",
    externalPersonalId: "",
    externalAddress: "",
    externalPhone: "",
    externalEmail: "",
  });

  function resetForm() {
    setForm({
      memberId: "", proxyType: "MEMBER", proxyMemberId: "",
      externalName: "", externalPersonalId: "", externalAddress: "",
      externalPhone: "", externalEmail: "",
    });
  }

  const proxies = proxiesQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const proxyMemberIds = new Set(proxies.map((p) => p.memberId));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    registerProxy.mutate({
      meetingId,
      memberId: form.memberId,
      proxyType: form.proxyType,
      proxyMemberId: form.proxyType === "MEMBER" ? form.proxyMemberId : undefined,
      externalName: form.proxyType === "EXTERNAL" ? form.externalName : undefined,
      externalPersonalId: form.proxyType === "EXTERNAL" ? form.externalPersonalId : undefined,
      externalAddress: form.proxyType === "EXTERNAL" ? form.externalAddress : undefined,
      externalPhone: form.proxyType === "EXTERNAL" ? form.externalPhone : undefined,
      externalEmail: form.proxyType === "EXTERNAL" ? form.externalEmail : undefined,
    });
  }

  const getMemberName = (id: string) => {
    const m = members.find((m) => m.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Okänd";
  };

  if (proxiesQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;

  return (
    <div className="space-y-4">
      {/* Rules info */}
      {rules && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-700 space-y-0.5">
            <p>Enligt stadgarna: ett ombud får företräda högst <strong>{rules.maxProxiesPerPerson === 0 ? "obegränsat antal" : rules.maxProxiesPerPerson}</strong> medlem(mar).</p>
            <p>Fullmakt giltig i högst <strong>{rules.proxyMaxValidityMonths} månader</strong>.</p>
            {rules.proxyCircleRestriction && <p>Kretsbegränsning gäller — ombud ska vara närstående (make/sambo/förälder/syskon/barn/god man).</p>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {proxies.length} ombud registrerade
          {proxies.filter((p) => !p.approved).length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {proxies.filter((p) => !p.approved).length} väntar på godkännande
            </span>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Registrera ombud
          </button>
        )}
      </div>

      {/* Proxy list */}
      {proxies.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Medlem</th>
                <th className="px-4 py-3">Ombud</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Status</th>
                {(canApprove || canEdit) && <th className="px-4 py-3 w-32"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proxies.map((proxy) => (
                <tr key={proxy.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {getMemberName(proxy.memberId)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {proxy.proxyType === "MEMBER" && proxy.proxyMemberId
                      ? getMemberName(proxy.proxyMemberId)
                      : proxy.externalName ?? "—"}
                    {proxy.proxyType === "EXTERNAL" && proxy.externalPersonalId && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({proxy.externalPersonalId})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      proxy.proxyType === "MEMBER"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    )}>
                      {proxy.proxyType === "MEMBER" ? "Medlem" : "Extern"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {proxy.approved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" />
                        Godkänd
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        Väntar
                      </span>
                    )}
                  </td>
                  {(canApprove || canEdit) && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canApprove && !proxy.approved && (
                          <button
                            onClick={() => approveProxy.mutate({ id: proxy.id })}
                            className="rounded px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
                          >
                            Godkänn
                          </button>
                        )}
                        <button
                          onClick={() => removeProxy.mutate({ id: proxy.id })}
                          className="rounded px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          Ta bort
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {proxies.length === 0 && !showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <UserCheck className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Inga ombud registrerade.</p>
        </div>
      )}

      {/* Register proxy form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Registrera ombud</h3>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Medlem som ger fullmakt *</label>
            <select
              required
              value={form.memberId}
              onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Välj medlem</option>
              {members
                .filter((m) => !proxyMemberIds.has(m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                    {m.apartment ? ` — lgh ${m.apartment.number}` : ""}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Typ av ombud *</label>
            <select
              value={form.proxyType}
              onChange={(e) => setForm((f) => ({ ...f, proxyType: e.target.value as ProxyType }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="MEMBER">Annan medlem i föreningen</option>
              <option value="EXTERNAL">Extern person</option>
            </select>
          </div>

          {form.proxyType === "MEMBER" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ombud (medlem) *</label>
              <select
                required
                value={form.proxyMemberId}
                onChange={(e) => setForm((f) => ({ ...f, proxyMemberId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Välj ombud</option>
                {members
                  .filter((m) => m.id !== form.memberId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {form.proxyType === "EXTERNAL" && (
            <div className="space-y-3 rounded-md border border-gray-200 bg-white p-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Extern person</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Namn *</label>
                  <input
                    type="text"
                    required
                    value={form.externalName}
                    onChange={(e) => setForm((f) => ({ ...f, externalName: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Personnummer *</label>
                  <input
                    type="text"
                    required
                    value={form.externalPersonalId}
                    onChange={(e) => setForm((f) => ({ ...f, externalPersonalId: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="YYYYMMDD-XXXX"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Adress</label>
                <input
                  type="text"
                  value={form.externalAddress}
                  onChange={(e) => setForm((f) => ({ ...f, externalAddress: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Telefon</label>
                  <input
                    type="tel"
                    value={form.externalPhone}
                    onChange={(e) => setForm((f) => ({ ...f, externalPhone: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">E-post</label>
                  <input
                    type="email"
                    value={form.externalEmail}
                    onChange={(e) => setForm((f) => ({ ...f, externalEmail: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-amber-600">
                Externa ombud kräver godkännande av styrelsen.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={registerProxy.isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {registerProxy.isPending ? "Registrerar..." : "Registrera ombud"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
