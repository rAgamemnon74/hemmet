import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { DecisionDetail } from "./decision-detail";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();

  try {
    const [decision, boardMembers] = await Promise.all([
      trpc.decision.getById({ id }),
      trpc.attendance.getBoardMembers(),
    ]);
    return <DecisionDetail decision={decision} boardMembers={boardMembers} />;
  } catch {
    notFound();
  }
}
