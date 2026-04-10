import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { ApplicationDetail } from "./application-detail";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();
  try {
    const application = await trpc.membership.getApplication({ id });
    return <ApplicationDetail application={application} />;
  } catch {
    notFound();
  }
}
