import { serverTrpc } from "@/lib/trpc-server";
import { OrganizationList } from "./organization-list";

export default async function OrganizationsPage() {
  const trpc = await serverTrpc();
  const organizations = await trpc.organization.list();
  return <OrganizationList initialData={organizations} />;
}
