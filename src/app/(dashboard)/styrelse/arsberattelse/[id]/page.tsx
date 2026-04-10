import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { AnnualReportDetail } from "./annual-report-detail";

export default async function AnnualReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();

  try {
    const [report, auditors] = await Promise.all([
      trpc.annualReport.getById({ id }),
      trpc.audit.getAuditors(),
    ]);
    return <AnnualReportDetail report={report} auditors={auditors} />;
  } catch {
    notFound();
  }
}
