import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createContractorSchema, updateContractorSchema, createContactSchema } from "@/lib/validators/contractor";
import { logActivity } from "@/lib/audit";

export const contractorRouter = router({
  list: protectedProcedure
    .use(requirePermission("contractor:view"))
    .input(z.object({ category: z.string().optional(), active: z.boolean().default(true) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.contractor.findMany({
        where: {
          ...(input?.category ? { category: input.category } : {}),
          ...(input?.active !== undefined ? { active: input.active } : {}),
        },
        include: {
          contacts: { orderBy: { isPrimary: "desc" } },
          _count: { select: { contracts: true, procurementQuotes: true } },
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("contractor:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.contractor.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          contacts: { orderBy: { isPrimary: "desc" } },
          contracts: { where: { status: { not: "EXPIRED" } }, orderBy: { startDate: "desc" } },
          procurementQuotes: {
            include: { procurement: { select: { id: true, title: true, status: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
    }),

  create: protectedProcedure
    .use(requirePermission("contractor:manage"))
    .input(createContractorSchema)
    .mutation(async ({ ctx, input }) => {
      const contractor = await ctx.db.contractor.create({ data: input });
      logActivity({
        userId: ctx.user.id, action: "contractor.create",
        entityType: "Contractor", entityId: contractor.id,
        description: `Ny leverantör: ${contractor.name}`,
      });
      return contractor;
    }),

  update: protectedProcedure
    .use(requirePermission("contractor:manage"))
    .input(updateContractorSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const contractor = await ctx.db.contractor.update({ where: { id }, data });
      logActivity({
        userId: ctx.user.id, action: "contractor.update",
        entityType: "Contractor", entityId: id,
        description: `Uppdaterade leverantör: ${contractor.name}`,
      });
      return contractor;
    }),

  deactivate: protectedProcedure
    .use(requirePermission("contractor:manage"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contractor = await ctx.db.contractor.update({
        where: { id: input.id },
        data: { active: false },
      });
      logActivity({
        userId: ctx.user.id, action: "contractor.deactivate",
        entityType: "Contractor", entityId: input.id,
        description: `Inaktiverade leverantör: ${contractor.name}`,
      });
      return contractor;
    }),

  addContact: protectedProcedure
    .use(requirePermission("contractor:manage"))
    .input(createContactSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contractorContact.create({ data: input });
    }),

  removeContact: protectedProcedure
    .use(requirePermission("contractor:manage"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contractorContact.delete({ where: { id: input.id } });
    }),
});
