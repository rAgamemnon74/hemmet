import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { DamageReportDetail } from "./damage-report-detail";

export default async function DamageReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();

  try {
    const report = await trpc.damageReport.getById({ id });
    return <DamageReportDetail report={report} />;
  } catch {
    notFound();
  }
}
