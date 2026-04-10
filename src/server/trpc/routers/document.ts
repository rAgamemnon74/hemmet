import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { isBoardMember } from "@/lib/permissions";
import { saveFile, getStoredFilePath } from "@/lib/upload";
import { unlink, copyFile } from "fs/promises";

export const documentRouter = router({
  list: protectedProcedure
    .use(requirePermission("announcement:view")) // Everyone can see some docs
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];
      const isBoard = isBoardMember(userRoles);
      const isMember = userRoles.includes(Role.MEMBER);

      // Filter by visibility
      const visibilityFilter = isBoard
        ? {} // Board sees all
        : isMember
        ? { OR: [{ visibleToMembers: true }, { visibleToAll: true }] }
        : { visibleToAll: true };

      return ctx.db.document.findMany({
        where: {
          ...visibilityFilter,
          category: input?.category as Parameters<typeof ctx.db.document.findMany>[0] extends { where?: infer W } ? W extends { category?: infer C } ? C : never : never,
          ...(input?.search
            ? {
                OR: [
                  { fileName: { contains: input.search, mode: "insensitive" as const } },
                  { description: { contains: input.search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true } },
          _count: { select: { versions: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({
        where: { id: input.id },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true } },
          versions: {
            orderBy: { createdAt: "desc" },
            select: { id: true, fileName: true, fileSize: true, createdAt: true, comment: true, uploadedById: true },
          },
        },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      return doc;
    }),

  update: protectedProcedure
    .use(requirePermission("document:upload"))
    .input(z.object({
      id: z.string(),
      description: z.string().optional().nullable(),
      visibleToMembers: z.boolean().optional(),
      visibleToAll: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({ where: { id: input.id } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      if (doc.locked) throw new TRPCError({ code: "BAD_REQUEST", message: "Dokumentet är låst och kan inte ändras" });

      const { id, ...data } = input;
      return ctx.db.document.update({ where: { id }, data });
    }),

  lock: protectedProcedure
    .use(requirePermission("document:upload"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.document.update({
        where: { id: input.id },
        data: { locked: true, lockedAt: new Date(), lockedBy: ctx.user.id },
      });
    }),

  delete: protectedProcedure
    .use(requirePermission("document:upload"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findUnique({ where: { id: input.id } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      if (doc.locked) throw new TRPCError({ code: "BAD_REQUEST", message: "Dokumentet är låst och kan inte tas bort" });

      // Delete file from disk
      try {
        const filePath = getStoredFilePath(doc.category, doc.storedName);
        await unlink(filePath);
      } catch { /* File may not exist */ }

      // Delete versions' files
      const versions = await ctx.db.documentVersion.findMany({ where: { documentId: input.id } });
      for (const v of versions) {
        try { await unlink(getStoredFilePath(doc.category, v.storedName)); } catch { /* ignore */ }
      }

      return ctx.db.document.delete({ where: { id: input.id } });
    }),
});
