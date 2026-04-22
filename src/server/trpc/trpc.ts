import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "../auth";
import { db } from "../db";
import { hasPermission, type Permission } from "@/lib/permissions";
import { Role } from "@prisma/client";

export async function createTRPCContext() {
  const session = await auth();
  return { db, session };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  // Guard mot stale JWT (t.ex. efter db-reset) — bättre att få 401 och
  // tvingas logga in igen än att få en FK-violation långt nere i stacken.
  const userId = ctx.session.user.id as string | undefined;
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  const userExists = await ctx.db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessionen är ogiltig — logga in igen" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

export function requirePermission(permission: Permission) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const userRoles = (ctx.session.user.roles ?? []) as Role[];
    if (!hasPermission(userRoles, permission)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `Saknar behörighet: ${permission}` });
    }
    return next({
      ctx: {
        session: ctx.session,
        user: ctx.session.user,
      },
    });
  });
}
