import { serverTrpc } from "@/lib/trpc-server";
import { AnnualReportList } from "./annual-report-list";

export default async function AnnualReportsPage() {
  const trpc = await serverTrpc();
  const reports = await trpc.annualReport.list();

  return <AnnualReportList initialData={reports} />;
}
