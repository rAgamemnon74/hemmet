import { serverTrpc } from "@/lib/trpc-server";
import { DamageReportList } from "./damage-report-list";

export default async function DamageReportsPage() {
  const trpc = await serverTrpc();
  const reports = await trpc.damageReport.list();

  return <DamageReportList initialData={reports} />;
}
