"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Plus,
  CheckSquare,
  Filter,
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, TaskStatus, TaskPriority } from "@prisma/client";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  assignee: { id: string; firstName: string; lastName: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  decision: { id: string; reference: string; title: string } | null;
  _count: { comments: number };
};

type BoardMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Array<{ role: string }>;
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "Att göra",
  IN_PROGRESS: "Pågår",
  WAITING: "Väntar",
  DONE: "Klar",
  CANCELLED: "Avbruten",
};

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "text-gray-400",
  MEDIUM: "text-blue-500",
  HIGH: "text-amber-500",
  URGENT: "text-red-500",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Låg",
  MEDIUM: "Normal",
  HIGH: "Hög",
  URGENT: "Brådskande",
};

export function TaskList({
  initialData,
  boardMembers,
}: {
  initialData: TaskItem[];
  boardMembers: BoardMember[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canCreate = hasPermission(userRoles, "task:create");

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ACTIVE" | "ALL">("ACTIVE");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    assigneeId: "",
    dueDate: "",
  });

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setForm({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });
      router.refresh();
    },
  });

  const filtered =
    statusFilter === "ALL"
      ? initialData
      : statusFilter === "ACTIVE"
      ? initialData.filter((t) => !["DONE", "CANCELLED"].includes(t.status))
      : initialData.filter((t) => t.status === statusFilter);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createTask.mutate({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      assigneeId: form.assigneeId || undefined,
      dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
    });
  }

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ärenden</h1>
          <p className="mt-1 text-sm text-gray-500">
            Uppgifter och uppföljningar från styrelsemöten
          </p>
        </div>
        {canCreate && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nytt ärende
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        {(["ACTIVE", "TODO", "IN_PROGRESS", "WAITING", "DONE", "ALL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {s === "ACTIVE" ? "Aktiva" : s === "ALL" ? "Alla" : statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4"
        >
          <div className="space-y-3">
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Titel på ärendet *"
              autoFocus
            />
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Beskrivning"
            />
            <div className="grid grid-cols-3 gap-3">
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOW">Låg prioritet</option>
                <option value="MEDIUM">Normal</option>
                <option value="HIGH">Hög prioritet</option>
                <option value="URGENT">Brådskande</option>
              </select>
              <select
                value={form.assigneeId}
                onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Ingen tilldelad</option>
                {boardMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createTask.isPending ? "Skapar..." : "Skapa ärende"}
            </button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga ärenden</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <Link
              key={task.id}
              href={`/styrelse/arenden/${task.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span title={priorityLabels[task.priority]}>
                  <AlertTriangle
                    className={cn("mt-0.5 h-4 w-4 shrink-0", priorityColors[task.priority])}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-gray-900">
                      {task.title}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        statusColors[task.status]
                      )}
                    >
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    {task.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignee.firstName} {task.assignee.lastName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          isOverdue(task.dueDate) && task.status !== "DONE"
                            ? "text-red-600 font-medium"
                            : ""
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {format(new Date(task.dueDate), "d MMM", { locale: sv })}
                        {isOverdue(task.dueDate) && task.status !== "DONE" && " (försenad)"}
                      </span>
                    )}
                    {task.decision && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                        {task.decision.reference}
                      </span>
                    )}
                    {task._count.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {task._count.comments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
