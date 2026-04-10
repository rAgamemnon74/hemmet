import { serverTrpc } from "@/lib/trpc-server";
import { ApplicationList } from "./application-list";

export default async function ApplicationsPage() {
  const trpc = await serverTrpc();
  const applications = await trpc.membership.listApplications();
  return <ApplicationList initialData={applications} />;
}
