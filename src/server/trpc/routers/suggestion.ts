import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createSuggestionSchema, respondSuggestionSchema } from "@/lib/validators/suggestion";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { isBoardMember } from "@/lib/permissions";

export const suggestionRouter = router({
  list: protectedProcedure
    .use(requirePermission("suggestion:submit"))
    .query(async ({ ctx }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];
      const isBoard = isBoardMember(userRoles);

      return ctx.db.suggestion.findMany({
        where: isBoard ? {} : { authorId: ctx.user.id },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("suggestion:submit"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const suggestion = await ctx.db.suggestion.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
      if (!suggestion) throw new TRPCError({ code: "NOT_FOUND" });
      return suggestion;
    }),

  create: protectedProcedure
    .use(requirePermission("suggestion:submit"))
    .input(createSuggestionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.suggestion.create({
        data: { ...input, authorId: ctx.user.id },
      });
    }),

  respond: protectedProcedure
    .use(requirePermission("suggestion:respond"))
    .input(respondSuggestionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.suggestion.update({ where: { id }, data });
    }),
});
