import { serverTrpc } from "@/lib/trpc-server";
import { MeetingList } from "./meeting-list";

export default async function MeetingsPage() {
  const trpc = await serverTrpc();
  const meetings = await trpc.meeting.list();

  return (
    <div>
      <MeetingList initialData={meetings} />
    </div>
  );
}
