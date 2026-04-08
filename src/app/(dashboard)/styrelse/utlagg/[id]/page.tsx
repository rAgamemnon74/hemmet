import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { ExpenseDetail } from "./expense-detail";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();

  try {
    const expense = await trpc.expense.getById({ id });
    return <ExpenseDetail expense={expense} />;
  } catch {
    notFound();
  }
}
