import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { logActivity } from "@/lib/audit";

const ALLOWED_ENTITY_TYPES = [
  "Inspection", "TransferCase", "Expense", "DamageReport",
  "SubletApplication", "RenovationApplication", "DisturbanceCase",
  "Motion", "MembershipApplication", "AnnualReport", "Meeting", "Protocol",
] as const;

export const attachmentRouter = router({
  // List attachments for an entity
  list: protectedProcedure
    .input(z.object({
      entityType: z.enum(ALLOWED_ENTITY_TYPES),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.attachment.findMany({
        where: { entityType: input.entityType, entityId: input.entityId },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Add attachment (file or link)
  add: protectedProcedure
    .input(z.object({
      entityType: z.enum(ALLOWED_ENTITY_TYPES),
      entityId: z.string(),
      type: z.enum(["file", "link"]),
      name: z.string().min(1),
      url: z.string().min(1),
      mimeType: z.string().optional(),
      fileSize: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.attachment.create({
        data: { ...input, uploadedById: ctx.user.id as string },
      });

      logActivity({
        userId: ctx.user.id as string,
        action: "attachment.add",
        entityType: input.entityType,
        entityId: input.entityId,
        description: `Bilaga: ${input.name} (${input.type === "file" ? "fil" : "länk"})`,
      });

      return result;
    }),

  // Remove attachment
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.db.attachment.findUnique({ where: { id: input.id } });
      if (!attachment) return;

      await ctx.db.attachment.delete({ where: { id: input.id } });

      logActivity({
        userId: ctx.user.id as string,
        action: "attachment.remove",
        entityType: attachment.entityType,
        entityId: attachment.entityId,
        description: `Tog bort bilaga: ${attachment.name}`,
      });
    }),
});
