import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { TaskDetail } from "./task-detail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();

  try {
    const [task, boardMembers] = await Promise.all([
      trpc.task.getById({ id }),
      trpc.attendance.getBoardMembers(),
    ]);
    return <TaskDetail task={task} boardMembers={boardMembers} />;
  } catch {
    notFound();
  }
}
