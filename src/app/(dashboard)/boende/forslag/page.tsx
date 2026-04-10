import { serverTrpc } from "@/lib/trpc-server";
import { SuggestionList } from "./suggestion-list";

export default async function SuggestionsPage() {
  const trpc = await serverTrpc();
  const suggestions = await trpc.suggestion.list();
  return <SuggestionList initialData={suggestions} />;
}
