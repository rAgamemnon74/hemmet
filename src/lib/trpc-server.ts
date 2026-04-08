import "server-only";
import { createTRPCContext } from "@/server/trpc/trpc";
import { appRouter } from "@/server/trpc/router";

export async function serverTrpc() {
  const ctx = await createTRPCContext();
  return appRouter.createCaller(ctx);
}
