import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { ApartmentDetail } from "./apartment-detail";

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();
  try {
    const apartment = await trpc.apartment.getById({ id });
    return <ApartmentDetail apartment={apartment} />;
  } catch {
    notFound();
  }
}
