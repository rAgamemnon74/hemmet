"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { EXPENSE_CATEGORIES } from "@/lib/validators/expense";

export default function NewExpensePage() {
  const router = useRouter();
  const createExpense = trpc.expense.create.useMutation({
    onSuccess: (expense) => router.push(`/styrelse/utlagg/${expense.id}`),
  });

  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: EXPENSE_CATEGORIES[0] as string,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createExpense.mutate({
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/styrelse/utlagg"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till utlägg
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Nytt utlägg</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        {createExpense.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {createExpense.error.message}
          </div>
        )}

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
            Beskrivning *
          </label>
          <input
            id="description"
            type="text"
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="t.ex. Inköp av lampor till trapphus"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="mb-1 block text-sm font-medium text-gray-700">
              Belopp (SEK) *
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>

          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
              Kategori *
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/styrelse/utlagg"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={createExpense.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {createExpense.isPending ? "Skickar in..." : "Skicka in utlägg"}
          </button>
        </div>
      </form>
    </div>
  );
}
