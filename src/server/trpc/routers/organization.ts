import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  addRepresentativeSchema,
  uploadMandateSchema,
} from "@/lib/validators/organization";
import { TRPCError } from "@trpc/server";

export const organizationRouter = router({
  list: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .query(async ({ ctx }) => {
      return ctx.db.organization.findMany({
        include: {
          representatives: { where: { active: true } },
          ownerships: {
            where: { active: true },
            include: {
              apartment: {
                select: { number: true, building: { select: { name: true } } },
              },
            },
          },
          mandateDocuments: {
            orderBy: { uploadedAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              representatives: { where: { active: true } },
              ownerships: { where: { active: true } },
              mandateDocuments: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("member:view_registry"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { id: input.id },
        include: {
          representatives: { orderBy: [{ active: "desc" }, { grantedAt: "desc" }] },
          ownerships: {
            where: { active: true },
            include: {
              apartment: {
                include: { building: { select: { name: true } } },
              },
            },
          },
          mandateDocuments: { orderBy: { uploadedAt: "desc" } },
        },
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      return org;
    }),

  create: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organization.create({ data: input });
    }),

  update: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(updateOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.organization.update({ where: { id }, data });
    }),

  // Representatives
  addRepresentative: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(addRepresentativeSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify org has at least one mandate document
      const mandateCount = await ctx.db.organizationMandate.count({
        where: { organizationId: input.organizationId },
      });
      if (mandateCount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ett signerat beslutsdokument måste laddas upp innan ombud kan registreras. Dokumentet ska styrka att ombuden har rätt att representera den juridiska personen.",
        });
      }

      return ctx.db.organizationRepresentative.create({ data: input });
    }),

  revokeRepresentative: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rep = await ctx.db.organizationRepresentative.findUnique({
        where: { id: input.id },
        include: {
          organization: {
            include: {
              representatives: { where: { active: true } },
            },
          },
        },
      });
      if (!rep) throw new TRPCError({ code: "NOT_FOUND" });

      // Must keep at least one active representative
      const activeCount = rep.organization.representatives.length;
      if (activeCount <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "En juridisk person måste ha minst ett aktivt ombud.",
        });
      }

      return ctx.db.organizationRepresentative.update({
        where: { id: input.id },
        data: { active: false, revokedAt: new Date() },
      });
    }),

  // Mandate documents
  uploadMandate: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(uploadMandateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organizationMandate.create({
        data: {
          ...input,
          uploadedBy: ctx.user.id,
        },
      });
    }),

  deleteMandate: protectedProcedure
    .use(requirePermission("member:edit"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if org still has representatives — can't delete last mandate if reps exist
      const mandate = await ctx.db.organizationMandate.findUnique({
        where: { id: input.id },
        include: {
          organization: {
            include: {
              mandateDocuments: true,
              representatives: { where: { active: true } },
            },
          },
        },
      });
      if (!mandate) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        mandate.organization.mandateDocuments.length <= 1 &&
        mandate.organization.representatives.length > 0
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kan inte ta bort sista beslutsdokumentet när aktiva ombud finns registrerade.",
        });
      }

      return ctx.db.organizationMandate.delete({ where: { id: input.id } });
    }),

  // Validate organization membership readiness
  validateMembership: protectedProcedure
    .use(requirePermission("application:review"))
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { id: input.organizationId },
        include: {
          representatives: { where: { active: true } },
          mandateDocuments: {
            where: {
              OR: [
                { validUntil: null },
                { validUntil: { gt: new Date() } },
              ],
            },
          },
        },
      });

      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      const issues: string[] = [];
      if (org.representatives.length === 0) {
        issues.push("Minst ett ombud måste registreras");
      }
      if (org.mandateDocuments.length === 0) {
        issues.push("Ett giltigt signerat beslutsdokument saknas");
      }

      return {
        valid: issues.length === 0,
        issues,
        representativeCount: org.representatives.length,
        mandateCount: org.mandateDocuments.length,
      };
    }),
});
