import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { AuditDetail } from "./audit-detail";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();

  try {
    const report = await trpc.annualReport.getById({ id });
    if (!report.audit) notFound();
    return <AuditDetail report={report} />;
  } catch {
    notFound();
  }
}
