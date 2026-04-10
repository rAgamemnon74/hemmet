import { serverTrpc } from "@/lib/trpc-server";
import { TransferList } from "./transfer-list";

export default async function TransferListPage() {
  const trpc = await serverTrpc();
  const transfers = await trpc.transfer.list();
  const overdue = await trpc.transfer.getOverdue();
  return <TransferList initialData={transfers} overdueCount={overdue.length} />;
}
