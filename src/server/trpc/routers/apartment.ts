import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createApartmentSchema, updateApartmentSchema } from "@/lib/validators/apartment";
import { TRPCError } from "@trpc/server";

export const apartmentRouter = router({
  list: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .input(
      z.object({
        buildingId: z.string().optional(),
        type: z.enum(["APARTMENT", "COMMERCIAL", "GARAGE", "STORAGE", "OTHER"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.apartment.findMany({
        where: {
          buildingId: input?.buildingId,
          type: input?.type,
        },
        include: {
          building: { select: { id: true, name: true } },
          residents: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: [
          { building: { name: "asc" } },
          { number: "asc" },
        ],
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const apt = await ctx.db.apartment.findUnique({
        where: { id: input.id },
        include: {
          building: true,
          residents: {
            select: {
              id: true, firstName: true, lastName: true, email: true, phone: true,
              roles: { where: { active: true }, select: { role: true } },
            },
          },
          damageReports: {
            where: { status: { not: "CLOSED" } },
            select: { id: true, title: true, status: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });
      if (!apt) throw new TRPCError({ code: "NOT_FOUND" });
      return apt;
    }),

  create: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(createApartmentSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.apartment.create({ data: input });
    }),

  update: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(updateApartmentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.apartment.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.apartment.delete({ where: { id: input.id } });
    }),

  getBuildings: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .query(async ({ ctx }) => {
      return ctx.db.building.findMany({
        include: {
          _count: { select: { apartments: true } },
        },
        orderBy: { name: "asc" },
      });
    }),

  summary: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .query(async ({ ctx }) => {
      const apartments = await ctx.db.apartment.findMany({
        select: { share: true, monthlyFee: true, area: true, type: true },
      });
      const totalShare = apartments.reduce((s, a) => s + (a.share ?? 0), 0);
      const totalFee = apartments.reduce((s, a) => s + (a.monthlyFee ?? 0), 0);
      const totalArea = apartments.reduce((s, a) => s + (a.area ?? 0), 0);
      const count = apartments.filter((a) => a.type === "APARTMENT").length;
      return { totalShare, totalFee, totalArea, count, total: apartments.length };
    }),
});
