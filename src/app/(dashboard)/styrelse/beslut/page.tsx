import { serverTrpc } from "@/lib/trpc-server";
import { DecisionLog } from "./decision-log";

export default async function DecisionsPage() {
  const trpc = await serverTrpc();
  const decisions = await trpc.decision.list();

  return <DecisionLog initialData={decisions} />;
}
