import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createContractSchema, updateContractSchema, createCallOffSchema } from "@/lib/validators/contract";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { Prisma } from "@prisma/client";

export const contractRouter = router({
  list: protectedProcedure
    .use(requirePermission("contract:view"))
    .input(z.object({
      category: z.enum(["SERVICE", "INSURANCE", "FINANCIAL", "MANAGEMENT", "UTILITY", "PROJECT", "CONSULTING", "OTHER"]).optional(),
      status: z.enum(["DRAFT", "ACTIVE", "RENEWAL_PENDING", "EXPIRING", "EXPIRED", "TERMINATED"]).optional(),
      frameworkOnly: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.contract.findMany({
        where: {
          ...(input?.category ? { category: input.category } : {}),
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.frameworkOnly ? { isFrameworkAgreement: true } : {}),
        },
        include: {
          contractor: { select: { id: true, name: true, category: true, pubAgreement: true } },
          _count: { select: { callOffs: true } },
          callOffs: {
            select: { actualCost: true, estimatedCost: true },
          },
        },
        orderBy: [{ noticeDeadline: "asc" }, { endDate: "asc" }],
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("contract:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
        include: {
          contractor: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          signedBy: { select: { id: true, firstName: true, lastName: true } },
          callOffs: {
            include: {
              calledOffBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { calledOffAt: "desc" },
          },
        },
      });
      if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
      return contract;
    }),

  create: protectedProcedure
    .use(requirePermission("contract:manage"))
    .input(createContractSchema)
    .mutation(async ({ ctx, input }) => {
      const { annualCost, totalValue, annualCeiling, ...rest } = input;

      // Calculate notice deadline
      let noticeDeadline: Date | null = null;
      if (rest.endDate && rest.noticePeriodMonths) {
        noticeDeadline = new Date(rest.endDate);
        noticeDeadline.setMonth(noticeDeadline.getMonth() - rest.noticePeriodMonths);
      }

      const contract = await ctx.db.contract.create({
        data: {
          ...rest,
          annualCost: annualCost != null ? new Prisma.Decimal(annualCost) : null,
          totalValue: totalValue != null ? new Prisma.Decimal(totalValue) : null,
          annualCeiling: annualCeiling != null ? new Prisma.Decimal(annualCeiling) : null,
          noticeDeadline,
          status: "ACTIVE",
          createdById: ctx.user.id,
        },
      });

      logActivity({
        userId: ctx.user.id, action: "contract.create",
        entityType: "Contract", entityId: contract.id,
        description: `Nytt avtal: ${contract.title} med ${contract.counterpartyName}`,
      });

      return contract;
    }),

  update: protectedProcedure
    .use(requirePermission("contract:manage"))
    .input(updateContractSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, annualCost, totalValue, annualCeiling, ...rest } = input;

      const before = await ctx.db.contract.findUniqueOrThrow({ where: { id } });

      // Recalculate notice deadline if dates changed
      let noticeDeadline = before.noticeDeadline;
      const endDate = rest.endDate ?? before.endDate;
      const noticePeriodMonths = rest.noticePeriodMonths ?? before.noticePeriodMonths;
      if (endDate && noticePeriodMonths) {
        noticeDeadline = new Date(endDate);
        noticeDeadline.setMonth(noticeDeadline.getMonth() - noticePeriodMonths);
      }

      const contract = await ctx.db.contract.update({
        where: { id },
        data: {
          ...rest,
          ...(annualCost !== undefined ? { annualCost: annualCost != null ? new Prisma.Decimal(annualCost) : null } : {}),
          ...(totalValue !== undefined ? { totalValue: totalValue != null ? new Prisma.Decimal(totalValue) : null } : {}),
          ...(annualCeiling !== undefined ? { annualCeiling: annualCeiling != null ? new Prisma.Decimal(annualCeiling) : null } : {}),
          noticeDeadline,
        },
      });

      logActivity({
        userId: ctx.user.id, action: "contract.update",
        entityType: "Contract", entityId: id,
        description: `Uppdaterade avtal: ${contract.title}`,
        before: { status: before.status },
        after: { status: contract.status },
      });

      return contract;
    }),

  terminate: protectedProcedure
    .use(requirePermission("contract:manage"))
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.contract.findUniqueOrThrow({ where: { id: input.id } });
      const contract = await ctx.db.contract.update({
        where: { id: input.id },
        data: { status: "TERMINATED", notes: input.reason ? `${before.notes ?? ""}\nUppsagt: ${input.reason}` : before.notes },
      });
      logActivity({
        userId: ctx.user.id, action: "contract.terminate",
        entityType: "Contract", entityId: input.id,
        description: `Sade upp avtal: ${contract.title}`,
        before: { status: before.status },
        after: { status: "TERMINATED" },
      });
      return contract;
    }),

  renew: protectedProcedure
    .use(requirePermission("contract:manage"))
    .input(z.object({ id: z.string(), newEndDate: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const old = await ctx.db.contract.findUniqueOrThrow({ where: { id: input.id } });

      let noticeDeadline: Date | null = null;
      if (old.noticePeriodMonths) {
        noticeDeadline = new Date(input.newEndDate);
        noticeDeadline.setMonth(noticeDeadline.getMonth() - old.noticePeriodMonths);
      }

      const contract = await ctx.db.contract.update({
        where: { id: input.id },
        data: {
          status: "ACTIVE",
          endDate: input.newEndDate,
          noticeDeadline,
        },
      });

      logActivity({
        userId: ctx.user.id, action: "contract.renew",
        entityType: "Contract", entityId: input.id,
        description: `Förnyade avtal: ${contract.title} till ${input.newEndDate.toISOString().slice(0, 10)}`,
      });

      return contract;
    }),

  addCallOff: protectedProcedure
    .use(requirePermission("contract:manage"))
    .input(createCallOffSchema)
    .mutation(async ({ ctx, input }) => {
      const contract = await ctx.db.contract.findUniqueOrThrow({ where: { id: input.contractId } });
      if (!contract.isFrameworkAgreement) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Avrop kan bara göras mot ramavtal" });
      }

      const callOff = await ctx.db.contractCallOff.create({
        data: {
          contractId: input.contractId,
          description: input.description,
          estimatedCost: input.estimatedCost != null ? new Prisma.Decimal(input.estimatedCost) : null,
          damageReportId: input.damageReportId,
          inspectionId: input.inspectionId,
          calledOffById: ctx.user.id,
        },
      });

      logActivity({
        userId: ctx.user.id, action: "contract.callOff",
        entityType: "Contract", entityId: input.contractId,
        description: `Nytt avrop: ${input.description} (~${input.estimatedCost?.toLocaleString("sv-SE") ?? "?"} kr)`,
      });

      return callOff;
    }),

  listCallOffs: protectedProcedure
    .use(requirePermission("contract:view"))
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.contractCallOff.findMany({
        where: { contractId: input.contractId },
        include: {
          calledOffBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { calledOffAt: "desc" },
      });
    }),

  getExpiring: protectedProcedure
    .use(requirePermission("contract:view"))
    .input(z.object({ withinDays: z.number().int().default(90) }).optional())
    .query(async ({ ctx, input }) => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (input?.withinDays ?? 90));

      return ctx.db.contract.findMany({
        where: {
          status: { in: ["ACTIVE", "RENEWAL_PENDING"] },
          OR: [
            { noticeDeadline: { lte: deadline } },
            { endDate: { lte: deadline } },
          ],
        },
        include: {
          contractor: { select: { id: true, name: true } },
        },
        orderBy: { noticeDeadline: "asc" },
      });
    }),
});
