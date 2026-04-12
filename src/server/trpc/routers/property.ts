import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { logActivity } from "@/lib/audit";

export const propertyRouter = router({
  // Properties with buildings and components — full hierarchy
  listPropertiesWithBuildings: protectedProcedure
    .use(requirePermission("meeting:view"))
    .query(async ({ ctx }) => {
      return ctx.db.property.findMany({
        select: {
          id: true,
          propertyDesignation: true,
          address: true,
          city: true,
          plotArea: true,
          taxationValue: true,
          buildings: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              address: true,
              constructionYear: true,
              excludedComponentCategories: true,
              components: {
                orderBy: [{ category: "asc" }, { name: "asc" }],
                select: {
                  id: true, category: true, name: true, installYear: true,
                  expectedLifespan: true, condition: true, lastInspectedAt: true,
                  nextActionYear: true, estimatedCost: true, notes: true,
                },
              },
            },
          },
        },
        orderBy: { address: "asc" },
      });
    }),

  // Backward compatible — buildings flat list
  listBuildingsWithComponents: protectedProcedure
    .use(requirePermission("meeting:view"))
    .query(async ({ ctx }) => {
      return ctx.db.building.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          constructionYear: true,
          excludedComponentCategories: true,
          components: {
            orderBy: [{ category: "asc" }, { name: "asc" }],
            select: {
              id: true, category: true, name: true, installYear: true,
              expectedLifespan: true, condition: true, lastInspectedAt: true,
              nextActionYear: true, estimatedCost: true, notes: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  // Toggle category exclusion for a building
  toggleCategoryExclusion: protectedProcedure
    .use(requirePermission("report:manage"))
    .input(z.object({ buildingId: z.string(), category: z.string(), excluded: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const building = await ctx.db.building.findUnique({ where: { id: input.buildingId }, select: { excludedComponentCategories: true } });
      if (!building) return;

      const current = building.excludedComponentCategories;
      const updated = input.excluded
        ? [...new Set([...current, input.category])]
        : current.filter((c) => c !== input.category);

      await ctx.db.building.update({ where: { id: input.buildingId }, data: { excludedComponentCategories: updated } });
      logActivity({ userId: ctx.user.id as string, action: "property.toggleCategory", entityType: "Building", entityId: input.buildingId, description: `${input.excluded ? "Uteslöt" : "Aktiverade"} kategori: ${input.category}` });
    }),

  // Building components (flat list, kept for backward compatibility)
  listComponents: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ buildingId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.buildingComponent.findMany({
        where: input?.buildingId ? { buildingId: input.buildingId } : undefined,
        include: { building: { select: { name: true } } },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
    }),

  addComponent: protectedProcedure
    .use(requirePermission("report:manage"))
    .input(z.object({
      buildingId: z.string(),
      category: z.enum(["ROOF", "FACADE", "WINDOWS", "PLUMBING", "ELECTRICAL", "VENTILATION", "ELEVATOR", "BALCONY", "FOUNDATION", "DRAINAGE", "HEATING", "COMMON_AREAS", "PARKING", "OUTDOOR", "OTHER"]),
      name: z.string().min(1),
      installYear: z.number().int().optional(),
      expectedLifespan: z.number().int().positive().optional(),
      condition: z.enum(["GOOD", "FAIR", "POOR", "CRITICAL"]).default("GOOD"),
      nextActionYear: z.number().int().optional(),
      estimatedCost: z.number().positive().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.buildingComponent.create({ data: input });
      logActivity({ userId: ctx.user.id as string, action: "property.addComponent", entityType: "BuildingComponent", entityId: result.id, description: `Ny komponent: ${input.name}`, after: { category: input.category, name: input.name } });
      return result;
    }),

  updateComponent: protectedProcedure
    .use(requirePermission("report:manage"))
    .input(z.object({
      id: z.string(),
      condition: z.enum(["GOOD", "FAIR", "POOR", "CRITICAL"]).optional(),
      nextActionYear: z.number().int().optional(),
      estimatedCost: z.number().positive().optional(),
      lastInspectedAt: z.coerce.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const before = await ctx.db.buildingComponent.findUnique({ where: { id }, select: { condition: true, nextActionYear: true } });
      const result = await ctx.db.buildingComponent.update({ where: { id }, data });
      logActivity({ userId: ctx.user.id as string, action: "property.updateComponent", entityType: "BuildingComponent", entityId: id, description: `Uppdaterade komponent`, before: before as Record<string, unknown>, after: data as Record<string, unknown> });
      return result;
    }),

  // Inspections
  listInspections: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ buildingId: z.string().optional(), upcoming: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.inspection.findMany({
        where: {
          buildingId: input?.buildingId,
          ...(input?.upcoming ? { nextDueAt: { gte: new Date() } } : {}),
        },
        include: {
          building: { select: { name: true } },
          component: { select: { name: true, category: true } },
        },
        orderBy: { nextDueAt: "asc" },
      });
    }),

  addInspection: protectedProcedure
    .use(requirePermission("report:manage"))
    .input(z.object({
      buildingId: z.string(),
      componentId: z.string().optional(),
      type: z.enum(["OVK", "ELEVATOR", "FIRE_SAFETY", "ENERGY", "RADON", "PLAYGROUND", "CISTERN", "COMPONENT", "OTHER"]),
      scheduledAt: z.coerce.date().optional(),
      completedAt: z.coerce.date().optional(),
      result: z.enum(["APPROVED", "APPROVED_WITH_REMARKS", "FAILED", "PENDING"]).default("PENDING"),
      inspector: z.string().optional(),
      nextDueAt: z.coerce.date().optional(),
      remarks: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.inspection.create({ data: input });
      logActivity({ userId: ctx.user.id as string, action: "property.addInspection", entityType: "Inspection", entityId: result.id, description: `Ny besiktning: ${input.type}`, after: { type: input.type, result: input.result } });
      return result;
    }),

  // Overdue inspections
  getOverdueInspections: protectedProcedure
    .use(requirePermission("report:manage"))
    .query(async ({ ctx }) => {
      return ctx.db.inspection.findMany({
        where: { nextDueAt: { lt: new Date() }, result: { not: "FAILED" } },
        include: { building: { select: { name: true } }, component: { select: { name: true } } },
        orderBy: { nextDueAt: "asc" },
      });
    }),

  // Contractors
  listContractors: protectedProcedure
    .use(requirePermission("meeting:view"))
    .query(async ({ ctx }) => {
      return ctx.db.contractor.findMany({
        where: { active: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
    }),

  addContractor: protectedProcedure
    .use(requirePermission("report:manage"))
    .input(z.object({
      name: z.string().min(1),
      orgNumber: z.string().optional(),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      category: z.string(),
      contractStartDate: z.coerce.date().optional(),
      contractEndDate: z.coerce.date().optional(),
      pubAgreement: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.contractor.create({ data: input });
      logActivity({ userId: ctx.user.id as string, action: "property.addContractor", entityType: "Contractor", entityId: result.id, description: `Ny leverantör: ${input.name}`, after: { name: input.name, category: input.category, pubAgreement: input.pubAgreement } });
      return result;
    }),

  updateContractor: protectedProcedure
    .use(requirePermission("report:manage"))
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      contractEndDate: z.coerce.date().optional(),
      pubAgreement: z.boolean().optional(),
      active: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db.contractor.update({ where: { id }, data });
      logActivity({ userId: ctx.user.id as string, action: "property.updateContractor", entityType: "Contractor", entityId: id, description: `Uppdaterade leverantör`, after: data as Record<string, unknown> });
      return result;
    }),
});
