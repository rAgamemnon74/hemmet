"use client";

import { useState } from "react";
import { Users, Plus, X, Edit2, Key, Copy, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { Role } from "@prisma/client";

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "BOARD_CHAIRPERSON", label: "Ordförande" },
  { value: "BOARD_SECRETARY", label: "Sekreterare" },
  { value: "BOARD_TREASURER", label: "Kassör" },
  { value: "BOARD_PROPERTY_MGR", label: "Förvaltningsansvarig" },
  { value: "BOARD_ENVIRONMENT", label: "Miljöansvarig" },
  { value: "BOARD_EVENTS", label: "Festansvarig" },
  { value: "BOARD_MEMBER", label: "Ledamot" },
  { value: "BOARD_SUBSTITUTE", label: "Suppleant" },
  { value: "AUDITOR", label: "Revisor" },
  { value: "AUDITOR_SUBSTITUTE", label: "Revisorssuppleant" },
  { value: "NOMINATING_COMMITTEE", label: "Valberedare" },
  { value: "NOMINATING_COMMITTEE_CHAIR", label: "Valberedning (sammankallande)" },
  { value: "MEMBER", label: "Medlem" },
  { value: "RESIDENT", label: "Boende" },
];

type EditingUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function AnvandareTab() {
  const membersQuery = trpc.member.list.useQuery();
  const addRole = trpc.member.addRole.useMutation({ onSuccess: () => membersQuery.refetch() });
  const removeRole = trpc.member.removeRole.useMutation({ onSuccess: () => membersQuery.refetch() });
  const updateUser = trpc.member.update.useMutation({ onSuccess: () => { membersQuery.refetch(); setEditing(null); } });
  const createUser = trpc.member.create.useMutation({ onSuccess: () => { membersQuery.refetch(); } });
  const setPassword = trpc.member.setPassword.useMutation();

  const [addingRoleFor, setAddingRoleFor] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("MEMBER");
  const [editing, setEditing] = useState<EditingUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", firstName: "", lastName: "", phone: "" });
  const [credentialModal, setCredentialModal] = useState<{ email: string; password: string; kind: "created" | "reset" } | null>(null);
  const [copied, setCopied] = useState(false);

  if (membersQuery.isLoading) return <p className="text-sm text-gray-500">Laddar...</p>;
  const data = membersQuery.data;
  const members = data && "members" in data ? data.members : [];

  async function handleCreate() {
    const result = await createUser.mutateAsync(createForm);
    if (result.initialPassword) {
      setCredentialModal({
        email: result.user.email,
        password: result.initialPassword,
        kind: "created",
      });
    }
    setShowCreate(false);
    setCreateForm({ email: "", firstName: "", lastName: "", phone: "" });
  }

  async function handleReset(userId: string, email: string) {
    if (!confirm(`Generera ett nytt slumpat lösenord för ${email}?\n\nAnvändaren kan inte logga in med sitt gamla lösenord längre.`)) return;
    const result = await setPassword.mutateAsync({ userId });
    if (result.newPassword) {
      setCredentialModal({
        email: result.user.email,
        password: result.newPassword,
        kind: "reset",
      });
    }
  }

  function handleSaveEdit() {
    if (!editing) return;
    updateUser.mutate({
      id: editing.id,
      firstName: editing.firstName,
      lastName: editing.lastName,
      email: editing.email,
      phone: editing.phone || null,
    });
  }

  function copyPassword() {
    if (!credentialModal) return;
    navigator.clipboard.writeText(credentialModal.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Användare ({members.length})
        </h2>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <UserPlus className="h-4 w-4" /> Ny användare
          </button>
        )}
      </div>

      {/* Skapa-formulär */}
      {showCreate && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Skapa ny användare</h3>
          {/*
            autoComplete="off" på alla fält — detta är admin-skapar-annan-användare,
            INTE registrerings-/login-formulär. Admin:s egna uppgifter ska inte
            autofyllas här, och Chrome ska inte erbjuda att spara den andra
            användarens uppgifter under admin:s konto.
          */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-700">E-post *</span>
              <input type="email" name="new-user-email" autoComplete="off" required
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="namn@exempel.se"
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Telefon</span>
              <input type="tel" name="new-user-phone" autoComplete="off"
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Förnamn *</span>
              <input type="text" name="new-user-firstname" autoComplete="off" required
                value={createForm.firstName}
                onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Efternamn *</span>
              <input type="text" name="new-user-lastname" autoComplete="off" required
                value={createForm.lastName}
                onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>
          </div>
          <p className="text-xs text-gray-500 italic">
            Ett slumpat lösenord genereras automatiskt. Det visas EN gång efter att kontot skapats — kopiera och skicka säkert till användaren.
          </p>
          {createUser.error && <p className="text-xs text-red-600">{createUser.error.message}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowCreate(false); setCreateForm({ email: "", firstName: "", lastName: "", phone: "" }); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Avbryt
            </button>
            <button onClick={handleCreate} disabled={createUser.isPending || !createForm.email || !createForm.firstName || !createForm.lastName}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {createUser.isPending ? "Skapar..." : "Skapa användare"}
            </button>
          </div>
        </div>
      )}

      {/* Användarlista */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3">E-post</th>
              <th className="px-4 py-3">Roller</th>
              <th className="px-4 py-3 w-32 text-right">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => {
              const userRoles = m.roles.map((r) => r.role);
              const isEditingThis = editing?.id === m.id;
              return (
                <tr key={m.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-sm">
                    {isEditingThis ? (
                      <div className="space-y-1">
                        <input name="edit-firstname" autoComplete="off" value={editing.firstName}
                          onChange={(e) => setEditing((v) => v ? { ...v, firstName: e.target.value } : v)}
                          placeholder="Förnamn"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                        <input name="edit-lastname" autoComplete="off" value={editing.lastName}
                          onChange={(e) => setEditing((v) => v ? { ...v, lastName: e.target.value } : v)}
                          placeholder="Efternamn"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">{m.firstName} {m.lastName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {isEditingThis ? (
                      <div className="space-y-1">
                        <input type="email" name="edit-email" autoComplete="off" value={editing.email}
                          onChange={(e) => setEditing((v) => v ? { ...v, email: e.target.value } : v)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                        <input type="tel" name="edit-phone" autoComplete="off" value={editing.phone}
                          onChange={(e) => setEditing((v) => v ? { ...v, phone: e.target.value } : v)}
                          placeholder="Telefon"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
                      </div>
                    ) : (
                      <>
                        <div>{m.email}</div>
                        {m.phone && <div className="text-xs text-gray-400">{m.phone}</div>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {userRoles.map((role) => {
                        const label = ALL_ROLES.find((r) => r.value === role)?.label ?? role;
                        return (
                          <span key={role} className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {label}
                            <button onClick={() => removeRole.mutate({ userId: m.id, role })}
                              className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5" title="Ta bort roll">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    {addingRoleFor === m.id && (
                      <div className="mt-1 flex items-center gap-1">
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as Role)}
                          className="rounded border border-gray-300 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {ALL_ROLES.filter((r) => !userRoles.includes(r.value)).map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <button onClick={() => { addRole.mutate({ userId: m.id, role: selectedRole }); setAddingRoleFor(null); }}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">OK</button>
                        <button onClick={() => setAddingRoleFor(null)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">✗</button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {isEditingThis ? (
                        <>
                          <button onClick={handleSaveEdit} disabled={updateUser.isPending}
                            className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">
                            Spara
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
                            Avbryt
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setAddingRoleFor(m.id)}
                            className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Lägg till roll">
                            <Plus className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditing({ id: m.id, firstName: m.firstName, lastName: m.lastName, email: m.email, phone: m.phone ?? "" })}
                            className="rounded p-1 text-gray-400 hover:bg-amber-50 hover:text-amber-600" title="Redigera">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleReset(m.id, m.email)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Återställ lösenord">
                            <Key className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {updateUser.error && <p className="text-sm text-red-600">{updateUser.error.message}</p>}
      {setPassword.error && <p className="text-sm text-red-600">{setPassword.error.message}</p>}

      {/* Modal för nya/återställda lösenord */}
      {credentialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setCredentialModal(null); setCopied(false); }}>
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {credentialModal.kind === "created" ? "Användare skapad" : "Lösenord återställt"}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Detta lösenord visas <strong>EN gång</strong>. Skicka det säkert till användaren (inte via e-post). Efter att modalen stängs kan ingen se det igen — då får du generera ett nytt via &ldquo;Återställ lösenord&rdquo;.
            </p>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500">E-post</dt>
                <dd className="text-sm font-mono text-gray-800">{credentialModal.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Lösenord</dt>
                <dd className="flex items-center gap-2">
                  <code className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 font-mono text-sm text-gray-900 select-all">
                    {credentialModal.password}
                  </code>
                  <button onClick={copyPassword}
                    className={cn("inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs",
                      copied ? "border-green-300 bg-green-50 text-green-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50")}>
                    {copied ? <><Check className="h-3 w-3" /> Kopierat</> : <><Copy className="h-3 w-3" /> Kopiera</>}
                  </button>
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setCredentialModal(null); setCopied(false); }}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                Klart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
