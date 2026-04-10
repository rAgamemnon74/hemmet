"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, Megaphone, Pin, Users, Shield, Globe, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, AudienceScope } from "@prisma/client";

type Announcement = {
  id: string;
  title: string;
  content: string;
  scope: AudienceScope;
  pinned: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  author: { id: string; firstName: string; lastName: string };
};

const scopeLabels: Record<AudienceScope, string> = {
  ALL: "Alla",
  MEMBERS_ONLY: "Medlemmar",
  BOARD_ONLY: "Styrelsen",
};

const scopeIcons: Record<AudienceScope, typeof Globe> = {
  ALL: Globe,
  MEMBERS_ONLY: Users,
  BOARD_ONLY: Shield,
};

const scopeColors: Record<AudienceScope, string> = {
  ALL: "bg-green-100 text-green-700",
  MEMBERS_ONLY: "bg-blue-100 text-blue-700",
  BOARD_ONLY: "bg-purple-100 text-purple-700",
};

export function AnnouncementList({ initialData }: { initialData: Announcement[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canCreate = hasPermission(userRoles, "announcement:create");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    scope: "ALL" as AudienceScope,
    pinned: false,
  });

  const create = trpc.announcement.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setForm({ title: "", content: "", scope: "ALL", pinned: false });
      router.refresh();
    },
  });

  const remove = trpc.announcement.delete.useMutation({
    onSuccess: () => router.refresh(),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(form);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anslagstavla</h1>
          <p className="mt-1 text-sm text-gray-500">Meddelanden och nyheter</p>
        </div>
        {canCreate && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nytt meddelande
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-5 space-y-4">
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Rubrik *"
            autoFocus
          />
          <textarea
            rows={4}
            required
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Meddelande *"
          />
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-500">Målgrupp</label>
              <select
                value={form.scope}
                onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as AudienceScope }))}
                className="ml-2 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Alla</option>
                <option value="MEMBERS_ONLY">Bara medlemmar</option>
                <option value="BOARD_ONLY">Bara styrelsen</option>
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Pin className="h-3.5 w-3.5" />
              Fäst
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? "Publicerar..." : "Publicera"}
            </button>
          </div>
        </form>
      )}

      {initialData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga meddelanden</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {initialData.map((a) => {
            const ScopeIcon = scopeIcons[a.scope];
            return (
              <div
                key={a.id}
                className={cn(
                  "rounded-lg border bg-white p-5",
                  a.pinned ? "border-amber-300 bg-amber-50/30" : "border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                      <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", scopeColors[a.scope])}>
                        <ScopeIcon className="h-3 w-3" />
                        {scopeLabels[a.scope]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                      <span>{a.author.firstName} {a.author.lastName}</span>
                      <span>{format(new Date(a.createdAt), "d MMM yyyy HH:mm", { locale: sv })}</span>
                    </div>
                  </div>
                  {canCreate && (
                    <button
                      onClick={() => remove.mutate({ id: a.id })}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Ta bort"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
