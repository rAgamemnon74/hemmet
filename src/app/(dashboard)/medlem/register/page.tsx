import { serverTrpc } from "@/lib/trpc-server";
import { MemberRegistry } from "./member-registry";

export default async function MemberRegistryPage() {
  const trpc = await serverTrpc();
  const members = await trpc.member.list();
  return <MemberRegistry initialData={members} />;
}
