import { serverTrpc } from "@/lib/trpc-server";
import { MotionList } from "./motion-list";

export default async function MotionsPage() {
  const trpc = await serverTrpc();
  const motions = await trpc.motion.list();
  return <MotionList initialData={motions} />;
}
