import { serverTrpc } from "@/lib/trpc-server";
import { AuditList } from "./audit-list";

export default async function AuditPage() {
  const trpc = await serverTrpc();
  const reports = await trpc.annualReport.list();

  // Filter to only show reports that have an audit record
  const reportsWithAudit = reports.filter((r) => r.audit);

  return <AuditList reports={reportsWithAudit} />;
}
