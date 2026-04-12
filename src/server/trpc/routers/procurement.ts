import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import {
  createProcurementSchema, updateProcurementSchema, approveProcurementSchema,
  addQuoteSchema, updateQuoteSchema, selectQuoteSchema, addNoteSchema,
} from "@/lib/validators/procurement";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { Prisma } from "@prisma/client";

export const procurementRouter = router({
  list: protectedProcedure
    .use(requirePermission("procurement:view"))
    .input(z.object({
      status: z.string().optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.procurement.findMany({
        where: {
          ...(input?.status ? { status: input.status as never } : {}),
          ...(input?.category ? { category: input.category as never } : {}),
        },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { quotes: true, notes: true } },
          quotes: {
            select: { id: true, companyName: true, amount: true, status: true, receivedAt: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("procurement:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const procurement = await ctx.db.procurement.findUnique({
        where: { id: input.id },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          quotes: {
            include: {
              contractor: { select: { id: true, name: true, category: true, fTax: true, insuranceCoverage: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          notes: {
            include: { author: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!procurement) throw new TRPCError({ code: "NOT_FOUND" });
      return procurement;
    }),

  create: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(createProcurementSchema)
    .mutation(async ({ ctx, input }) => {
      const { estimatedCost, annualEstimate, ...rest } = input;
      const procurement = await ctx.db.procurement.create({
        data: {
          ...rest,
          estimatedCost: estimatedCost != null ? new Prisma.Decimal(estimatedCost) : null,
          annualEstimate: annualEstimate != null ? new Prisma.Decimal(annualEstimate) : null,
          status: "NEED",
          createdById: ctx.user.id,
        },
      });

      logActivity({
        userId: ctx.user.id, action: "procurement.create",
        entityType: "Procurement", entityId: procurement.id,
        description: `Nytt behov: ${procurement.title}`,
      });

      return procurement;
    }),

  update: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(updateProcurementSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, estimatedCost, annualEstimate, ...rest } = input;
      const procurement = await ctx.db.procurement.update({
        where: { id },
        data: {
          ...rest,
          ...(estimatedCost !== undefined ? { estimatedCost: estimatedCost != null ? new Prisma.Decimal(estimatedCost) : null } : {}),
          ...(annualEstimate !== undefined ? { annualEstimate: annualEstimate != null ? new Prisma.Decimal(annualEstimate) : null } : {}),
        },
      });

      logActivity({
        userId: ctx.user.id, action: "procurement.update",
        entityType: "Procurement", entityId: id,
        description: `Uppdaterade: ${procurement.title}`,
      });

      return procurement;
    }),

  approve: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(approveProcurementSchema)
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.procurement.findUniqueOrThrow({ where: { id: input.id } });
      if (!["NEED", "NEED_DEFERRED"].includes(before.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan bara godkänna registrerade behov" });
      }

      const procurement = await ctx.db.procurement.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          ownerId: input.ownerId,
          mandateLevel: input.mandateLevel,
          approvedAt: new Date(),
          ...(input.estimatedCost != null ? { estimatedCost: new Prisma.Decimal(input.estimatedCost) } : {}),
          ...(input.quotesDeadline ? { quotesDeadline: input.quotesDeadline } : {}),
          ...(input.decisionNote ? { decisionNote: input.decisionNote } : {}),
        },
      });

      logActivity({
        userId: ctx.user.id, action: "procurement.approve",
        entityType: "Procurement", entityId: input.id,
        description: `Upphandling godkänd: ${procurement.title}`,
        before: { status: before.status },
        after: { status: "APPROVED", ownerId: input.ownerId },
      });

      return procurement;
    }),

  defer: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(z.object({ id: z.string(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.procurement.findUniqueOrThrow({ where: { id: input.id } });
      const procurement = await ctx.db.procurement.update({
        where: { id: input.id },
        data: {
          status: "NEED_DEFERRED",
          deferredCount: { increment: 1 },
          ...(input.note ? { decisionNote: input.note } : {}),
        },
      });

      logActivity({
        userId: ctx.user.id, action: "procurement.defer",
        entityType: "Procurement", entityId: input.id,
        description: `Behov avvaktades: ${procurement.title} (${procurement.deferredCount} gånger)`,
      });

      return procurement;
    }),

  reject: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(z.object({ id: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const procurement = await ctx.db.procurement.update({
        where: { id: input.id },
        data: { status: "REJECTED", rejectionReason: input.reason },
      });

      logActivity({
        userId: ctx.user.id, action: "procurement.reject",
        entityType: "Procurement", entityId: input.id,
        description: `Behov avslagit: ${procurement.title} — ${input.reason}`,
      });

      return procurement;
    }),

  updateStatus: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(z.object({
      id: z.string(),
      status: z.enum(["SPECIFICATION", "RFQ_SENT", "COLLECTING_QUOTES", "EVALUATION", "DECISION_PENDING", "ORDERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.db.procurement.findUniqueOrThrow({ where: { id: input.id } });
      const procurement = await ctx.db.procurement.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.status === "RFQ_SENT" ? { rfqSentAt: new Date() } : {}),
        },
      });

      logActivity({
        userId: ctx.user.id, action: "procurement.updateStatus",
        entityType: "Procurement", entityId: input.id,
        description: `Status ändrad: ${before.status} → ${input.status}`,
        before: { status: before.status },
        after: { status: input.status },
      });

      return procurement;
    }),

  addQuote: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(addQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { amount, amountExVat, annualCost, ...rest } = input;
      const quote = await ctx.db.procurementQuote.create({
        data: {
          ...rest,
          amount: amount != null ? new Prisma.Decimal(amount) : null,
          amountExVat: amountExVat != null ? new Prisma.Decimal(amountExVat) : null,
          annualCost: annualCost != null ? new Prisma.Decimal(annualCost) : null,
          status: amount != null ? "RECEIVED" : "PENDING",
          receivedAt: amount != null ? new Date() : null,
        },
      });

      logActivity({
        userId: ctx.user.id, action: "procurement.addQuote",
        entityType: "Procurement", entityId: input.procurementId,
        description: `Offert från ${input.companyName}${amount != null ? `: ${amount.toLocaleString("sv-SE")} kr` : " (inväntar)"}`,
      });

      return quote;
    }),

  updateQuote: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(updateQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, amount, amountExVat, annualCost, ...rest } = input;
      const quote = await ctx.db.procurementQuote.update({
        where: { id },
        data: {
          ...rest,
          ...(amount !== undefined ? { amount: amount != null ? new Prisma.Decimal(amount) : null } : {}),
          ...(amountExVat !== undefined ? { amountExVat: amountExVat != null ? new Prisma.Decimal(amountExVat) : null } : {}),
          ...(annualCost !== undefined ? { annualCost: annualCost != null ? new Prisma.Decimal(annualCost) : null } : {}),
          // Auto-set status and receivedAt when amount is provided
          ...(amount != null ? { status: "RECEIVED", receivedAt: new Date() } : {}),
        },
      });
      return quote;
    }),

  selectQuote: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(selectQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      const procurement = await ctx.db.procurement.findUniqueOrThrow({
        where: { id: input.procurementId },
        include: { quotes: true },
      });

      const selectedQuote = procurement.quotes.find((q) => q.id === input.quoteId);
      if (!selectedQuote) throw new TRPCError({ code: "NOT_FOUND", message: "Offert hittades inte" });

      // Mark selected, reject others
      await ctx.db.procurementQuote.updateMany({
        where: { procurementId: input.procurementId, id: { not: input.quoteId } },
        data: { status: "REJECTED" },
      });
      await ctx.db.procurementQuote.update({
        where: { id: input.quoteId },
        data: { status: "SELECTED" },
      });

      // Update procurement
      await ctx.db.procurement.update({
        where: { id: input.procurementId },
        data: {
          status: "ORDERED",
          selectedQuoteId: input.quoteId,
          actualCost: selectedQuote.amount,
          decisionNote: input.decisionNote,
        },
      });

      logActivity({
        userId: ctx.user.id, action: "procurement.selectQuote",
        entityType: "Procurement", entityId: input.procurementId,
        description: `Vald leverantör: ${selectedQuote.companyName} (${Number(selectedQuote.amount).toLocaleString("sv-SE")} kr)`,
      });

      // Create contract if requested
      if (input.createContract) {
        const contract = await ctx.db.contract.create({
          data: {
            title: procurement.title,
            description: procurement.description,
            category: "SERVICE",
            status: "ACTIVE",
            contractorId: selectedQuote.contractorId,
            counterpartyName: selectedQuote.companyName,
            counterpartyOrg: selectedQuote.orgNumber,
            counterpartyEmail: selectedQuote.contactEmail,
            totalValue: selectedQuote.amount,
            annualCost: selectedQuote.annualCost,
            paymentTerms: selectedQuote.paymentTerms,
            paymentMethod: selectedQuote.paymentMethod,
            startDate: selectedQuote.proposedStart ?? new Date(),
            endDate: selectedQuote.proposedEnd,
            warrantyMonths: selectedQuote.warrantyMonths,
            noticePeriodMonths: selectedQuote.noticePeriod,
            procurementId: input.procurementId,
            mandateLevel: procurement.mandateLevel ?? "BOARD",
            createdById: ctx.user.id,
          },
        });

        await ctx.db.procurement.update({
          where: { id: input.procurementId },
          data: { contractId: contract.id },
        });

        return { procurement, contract };
      }

      return { procurement };
    }),

  addNote: protectedProcedure
    .use(requirePermission("procurement:manage"))
    .input(addNoteSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.procurementNote.create({
        data: {
          procurementId: input.procurementId,
          authorId: ctx.user.id,
          content: input.content,
        },
      });
    }),
});
