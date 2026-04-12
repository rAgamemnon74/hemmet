import { serverTrpc } from "@/lib/trpc-server";
import { ExpenseList } from "./expense-list";

export default async function ExpensesPage() {
  const trpc = await serverTrpc();
  const expenses = await trpc.expense.list();

  return <ExpenseList initialData={expenses} />;
}
