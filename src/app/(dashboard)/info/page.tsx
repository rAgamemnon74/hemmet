import { serverTrpc } from "@/lib/trpc-server";
import { AnnouncementList } from "./announcement-list";

export default async function AnnouncementsPage() {
  const trpc = await serverTrpc();
  const announcements = await trpc.announcement.list();
  return <AnnouncementList initialData={announcements} />;
}
