import { serverTrpc } from "@/lib/trpc-server";
import { notFound } from "next/navigation";
import { SuggestionDetail } from "./suggestion-detail";

export default async function SuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await serverTrpc();
  try {
    const suggestion = await trpc.suggestion.getById({ id });
    return <SuggestionDetail suggestion={suggestion} />;
  } catch {
    notFound();
  }
}
