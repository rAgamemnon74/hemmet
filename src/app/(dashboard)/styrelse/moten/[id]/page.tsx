import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { MeetingDetail } from "./meeting-detail";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trpc = await serverTrpc();

  try {
    const [meeting, boardMembers] = await Promise.all([
      trpc.meeting.getById({ id }),
      trpc.attendance.getBoardMembers(),
    ]);
    return <MeetingDetail meeting={meeting} boardMembers={boardMembers} />;
  } catch {
    notFound();
  }
}
