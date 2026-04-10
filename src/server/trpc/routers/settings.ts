import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";

export const settingsRouter = router({
  get: protectedProcedure
    .use(requirePermission("admin:integrations"))
    .query(async ({ ctx }) => {
      let settings = await ctx.db.brfSettings.findUnique({ where: { id: "default" } });
      if (!settings) {
        settings = await ctx.db.brfSettings.create({
          data: { name: "", orgNumber: "", address: "", city: "", postalCode: "" },
        });
      }
      return settings;
    }),

  update: protectedProcedure
    .use(requirePermission("admin:settings"))
    .input(
      z.object({
        name: z.string().min(1).optional(),
        orgNumber: z.string().optional(),
        registrationDate: z.coerce.date().optional().nullable(),
        seat: z.string().optional().nullable(),
        signatoryRule: z.string().optional().nullable(),
        signatories: z.string().optional().nullable(),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        fiscalYearStart: z.number().int().min(1).max(12).optional(),
        fiscalYearEnd: z.number().int().min(1).max(12).optional(),
        bankgiro: z.string().optional().nullable(),
        plusgiro: z.string().optional().nullable(),
        bankAccount: z.string().optional().nullable(),
        swish: z.string().optional().nullable(),
        vatRegistered: z.boolean().optional(),
        fTax: z.boolean().optional(),
        propertyManager: z.string().optional().nullable(),
        insuranceCompany: z.string().optional().nullable(),
        insurancePolicy: z.string().optional().nullable(),
        insuranceExpiry: z.coerce.date().optional().nullable(),
        logoUrl: z.string().optional().nullable(),
        stadgarUrl: z.string().optional().nullable(),
        ordningsreglerUrl: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.brfSettings.upsert({
        where: { id: "default" },
        update: input,
        create: {
          name: input.name ?? "",
          orgNumber: input.orgNumber ?? "",
          address: input.address ?? "",
          city: input.city ?? "",
          postalCode: input.postalCode ?? "",
          ...input,
        },
      });
    }),

  // Buildings CRUD
  listBuildings: protectedProcedure
    .use(requirePermission("admin:integrations"))
    .query(async ({ ctx }) => {
      return ctx.db.building.findMany({
        include: { _count: { select: { apartments: true } } },
        orderBy: { name: "asc" },
      });
    }),

  getBuilding: protectedProcedure
    .use(requirePermission("admin:integrations"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.building.findUnique({ where: { id: input.id } });
    }),

  createBuilding: protectedProcedure
    .use(requirePermission("admin:settings"))
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().min(1),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        propertyDesignation: z.string().optional(),
        constructionYear: z.number().int().optional(),
        totalArea: z.number().optional(),
        plotArea: z.number().optional(),
        commercialUnits: z.number().int().optional(),
        heatingType: z.string().optional(),
        taxationValue: z.number().optional(),
        energyRating: z.string().optional(),
        energyDeclarationExpiry: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.building.create({ data: input });
    }),

  updateBuilding: protectedProcedure
    .use(requirePermission("admin:settings"))
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        city: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        propertyDesignation: z.string().optional().nullable(),
        constructionYear: z.number().int().optional().nullable(),
        totalArea: z.number().optional().nullable(),
        plotArea: z.number().optional().nullable(),
        commercialUnits: z.number().int().optional().nullable(),
        heatingType: z.string().optional().nullable(),
        taxationValue: z.number().optional().nullable(),
        energyRating: z.string().optional().nullable(),
        energyDeclarationExpiry: z.coerce.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.building.update({ where: { id }, data });
    }),

  deleteBuilding: protectedProcedure
    .use(requirePermission("admin:settings"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.building.delete({ where: { id: input.id } });
    }),
});
