"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import type { Role, TaskStatus, TaskPriority } from "@prisma/client";

type TaskData = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  assignee: { id: string; firstName: string; lastName: string; email: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  decision: { id: string; reference: string; title: string } | null;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: { id: string; firstName: string; lastName: string };
  }>;
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

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Låg",
  MEDIUM: "Normal",
  HIGH: "Hög",
  URGENT: "Brådskande",
};

export function TaskDetail({
  task,
  boardMembers,
}: {
  task: TaskData;
  boardMembers: BoardMember[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];
  const canEdit = hasPermission(userRoles, "task:create");
  const [comment, setComment] = useState("");

  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => router.refresh(),
  });
  const addComment = trpc.task.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      router.refresh();
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/styrelse/arenden"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till ärenden
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            {task.description && (
              <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                {task.description}
              </p>
            )}
            {task.decision && (
              <div className="mt-3">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                  Beslut {task.decision.reference}: {task.decision.title}
                </span>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Kommentarer ({task.comments.length})
            </h2>

            {task.comments.length > 0 && (
              <div className="space-y-4 mb-4">
                {task.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {c.author.firstName[0]}
                      {c.author.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {c.author.firstName} {c.author.lastName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(c.createdAt), "d MMM HH:mm", { locale: sv })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) {
                  addComment.mutate({ taskId: task.id, content: comment });
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Skriv en kommentar..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!comment.trim() || addComment.isPending}
                className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            {/* Status */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
              {canEdit ? (
                <select
                  value={task.status}
                  onChange={(e) =>
                    updateTask.mutate({ id: task.id, status: e.target.value as TaskStatus })
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">{statusLabels[task.status]}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Prioritet</p>
              {canEdit ? (
                <select
                  value={task.priority}
                  onChange={(e) =>
                    updateTask.mutate({ id: task.id, priority: e.target.value as TaskPriority })
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">{priorityLabels[task.priority]}</p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Tilldelad</p>
              {canEdit ? (
                <select
                  value={task.assignee?.id ?? ""}
                  onChange={(e) =>
                    updateTask.mutate({
                      id: task.id,
                      assigneeId: e.target.value || null,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Ingen tilldelad</option>
                  {boardMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">
                  {task.assignee
                    ? `${task.assignee.firstName} ${task.assignee.lastName}`
                    : "Ingen tilldelad"}
                </p>
              )}
            </div>

            {/* Due date */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Deadline</p>
              {canEdit ? (
                <input
                  type="date"
                  value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    updateTask.mutate({
                      id: task.id,
                      dueDate: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {task.dueDate
                    ? format(new Date(task.dueDate), "d MMMM yyyy", { locale: sv })
                    : "Ingen deadline"}
                </p>
              )}
            </div>

            {/* Created by */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Skapad av</p>
              <p className="text-sm text-gray-700">
                {task.createdBy.firstName} {task.createdBy.lastName}
              </p>
              <p className="text-xs text-gray-400">
                {format(new Date(task.createdAt), "d MMM yyyy", { locale: sv })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
