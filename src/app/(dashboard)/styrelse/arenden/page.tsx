import { serverTrpc } from "@/lib/trpc-server";
import { TaskList } from "./task-list";

export default async function TasksPage() {
  const trpc = await serverTrpc();
  const [tasks, boardMembers] = await Promise.all([
    trpc.task.list(),
    trpc.attendance.getBoardMembers(),
  ]);

  return <TaskList initialData={tasks} boardMembers={boardMembers} />;
}
