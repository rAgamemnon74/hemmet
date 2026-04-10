import { serverTrpc } from "@/lib/trpc-server";
import { ApartmentRegistry } from "./apartment-registry";

export default async function ApartmentsPage() {
  const trpc = await serverTrpc();
  const [apartments, summary] = await Promise.all([
    trpc.apartment.list(),
    trpc.apartment.summary(),
  ]);
  return <ApartmentRegistry initialData={apartments} summary={summary} />;
}
