import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { MotionDetail } from "./motion-detail";

export default async function MotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();
  try {
    const motion = await trpc.motion.getById({ id });
    return <MotionDetail motion={motion} />;
  } catch {
    notFound();
  }
}
