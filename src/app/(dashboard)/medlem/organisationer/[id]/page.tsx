import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { OrganizationDetail } from "./organization-detail";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();
  try {
    const organization = await trpc.organization.getById({ id });
    return <OrganizationDetail organization={organization} />;
  } catch {
    notFound();
  }
}
