import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getBrfRules } from "@/lib/rules";
import { logActivity } from "@/lib/audit";

export const transferRouter = router({
  list: protectedProcedure
    .use(requirePermission("transfer:view"))
    .input(
      z.object({
        status: z.enum(["INITIATED", "MEMBERSHIP_REVIEW", "APPROVED", "REJECTED", "APPEALED", "FINANCIAL_SETTLEMENT", "COMPLETED", "CANCELLED"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.transferCase.findMany({
        where: { status: input?.status },
        include: {
          apartment: { select: { number: true, building: { select: { name: true } } } },
          seller: { select: { id: true, firstName: true, lastName: true } },
          buyerApplication: { select: { id: true, firstName: true, lastName: true, organizationName: true, applicantType: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("transfer:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const transfer = await ctx.db.transferCase.findUnique({
        where: { id: input.id },
        include: {
          apartment: {
            include: {
              building: { select: { name: true, address: true } },
              ownerships: {
                where: { active: true },
                include: { user: { select: { id: true, firstName: true, lastName: true } } },
              },
            },
          },
          seller: { select: { id: true, firstName: true, lastName: true, email: true } },
          buyerApplication: true,
          decision: { select: { id: true, reference: true, title: true, decidedAt: true } },
          mortgageNotations: { orderBy: { notationDate: "desc" } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND", message: "Överlåtelseärendet hittades inte" });
      return transfer;
    }),

  create: protectedProcedure
    .use(requirePermission("transfer:create"))
    .input(
      z.object({
        apartmentId: z.string(),
        type: z.enum(["SALE", "PRIVATE_SALE", "INHERITANCE", "DIVORCE_SETTLEMENT", "GIFT", "FORCED_SALE", "SHARE_CHANGE"]),
        sellerId: z.string().optional(),
        accessDate: z.coerce.date().optional(),
        contractDate: z.coerce.date().optional(),
        transferPrice: z.number().positive().optional(),
        externalContactName: z.string().optional(),
        externalContactEmail: z.string().email().optional(),
        externalContactPhone: z.string().optional(),
        buyerApplicationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rules = await getBrfRules();

      // Auto-calculate transfer fee
      const transferFeeAmount = rules.prisbasbelopp * (rules.transferFeeMaxPercent / 100);
      const transferFeePaidBy = rules.transferFeePaidBySeller ? "SELLER" : "BUYER";

      // Check for outstanding debt from seller
      let outstandingDebt: number | null = null;
      if (input.sellerId) {
        const unpaidExpenses = await ctx.db.expense.aggregate({
          where: { submitterId: input.sellerId, status: { in: ["SUBMITTED", "APPROVED"] } },
          _sum: { amount: true },
        });
        if (unpaidExpenses._sum.amount) {
          outstandingDebt = Number(unpaidExpenses._sum.amount);
        }
      }

      return ctx.db.transferCase.create({
        data: {
          apartmentId: input.apartmentId,
          type: input.type,
          sellerId: input.sellerId,
          accessDate: input.accessDate,
          contractDate: input.contractDate,
          transferPrice: input.transferPrice,
          transferFeeAmount,
          transferFeePaidBy,
          outstandingDebt,
          externalContactName: input.externalContactName,
          externalContactEmail: input.externalContactEmail,
          externalContactPhone: input.externalContactPhone,
          buyerApplicationId: input.buyerApplicationId,
          createdById: ctx.user.id as string,
        },
      });
    }),

  updateStatus: protectedProcedure
    .use(requirePermission("transfer:review"))
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["INITIATED", "MEMBERSHIP_REVIEW", "APPROVED", "REJECTED", "APPEALED", "FINANCIAL_SETTLEMENT", "COMPLETED", "CANCELLED"]),
        rejectionReason: z.string().optional(),
        decisionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const transfer = await ctx.db.transferCase.findUnique({ where: { id: input.id } });
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND" });

      // Require rejection reason when rejecting
      if (input.status === "REJECTED" && !input.rejectionReason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Motivering krävs vid avslag (lagkrav för att beslutet ska hålla vid överklagande)",
        });
      }

      // Warn if credit check not done when approving
      if (input.status === "APPROVED" && !transfer.creditCheckDone) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Kreditupplysning har inte utförts. Godkänn ändå genom att först markera kreditkontroll som utförd.",
        });
      }

      const data: Record<string, unknown> = {
        status: input.status,
        rejectionReason: input.rejectionReason,
        decisionId: input.decisionId,
      };

      if (input.status === "APPROVED" || input.status === "REJECTED") {
        data.decisionDate = new Date();
      }
      if (input.status === "COMPLETED") {
        data.completedAt = new Date();
      }

      const result = await ctx.db.transferCase.update({ where: { id: input.id }, data });
      logActivity({ userId: ctx.user.id as string, action: "transfer.updateStatus", entityType: "TransferCase", entityId: input.id, description: `Status: ${transfer.status} → ${input.status}`, before: { status: transfer.status }, after: { status: input.status } });
      return result;
    }),

  updateChecks: protectedProcedure
    .use(requirePermission("transfer:review"))
    .input(
      z.object({
        id: z.string(),
        creditCheckDone: z.boolean().optional(),
        creditCheckDate: z.coerce.date().optional(),
        financingVerified: z.boolean().optional(),
        financingVerifiedDate: z.coerce.date().optional(),
        statuteCheckDone: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.transferCase.update({ where: { id }, data });
    }),

  updateFinancials: protectedProcedure
    .use(requirePermission("transfer:manage_financial"))
    .input(
      z.object({
        id: z.string(),
        transferFeePaidAt: z.coerce.date().optional(),
        pledgeFeeAmount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.transferCase.update({ where: { id }, data });
    }),

  // Complete transfer: deactivate old ownership, create new
  complete: protectedProcedure
    .use(requirePermission("transfer:review"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const transfer = await ctx.db.transferCase.findUnique({
        where: { id: input.id },
        include: { buyerApplication: true },
      });
      if (!transfer) throw new TRPCError({ code: "NOT_FOUND" });
      if (transfer.status !== "FINANCIAL_SETTLEMENT" && transfer.status !== "APPROVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ärendet måste vara godkänt eller under ekonomisk reglering" });
      }

      const app = transfer.buyerApplication;
      if (!app) throw new TRPCError({ code: "BAD_REQUEST", message: "Ingen medlemsansökan kopplad" });

      await ctx.db.$transaction(async (tx) => {
        // Deactivate seller's ownership
        if (transfer.sellerId) {
          await tx.apartmentOwnership.updateMany({
            where: { apartmentId: transfer.apartmentId, userId: transfer.sellerId, active: true },
            data: { active: false, transferredAt: transfer.accessDate ?? new Date() },
          });
        }

        // Create buyer's ownership
        await tx.apartmentOwnership.create({
          data: {
            apartmentId: transfer.apartmentId,
            ownerType: app.applicantType === "ORGANIZATION" ? "ORGANIZATION" : "PERSON",
            userId: app.applicantUserId,
            organizationId: app.organizationId,
            ownershipShare: app.ownershipShare,
            acquiredAt: transfer.accessDate ?? new Date(),
          },
        });

        // Mark transfer as completed
        await tx.transferCase.update({
          where: { id: input.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });

        // Mark application as approved if not already
        if (app.status !== "APPROVED") {
          await tx.membershipApplication.update({
            where: { id: app.id },
            data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: ctx.user.id as string },
          });
        }
      });

      return { success: true };
    }),

  // Add mortgage notation
  addMortgage: protectedProcedure
    .use(requirePermission("transfer:manage_financial"))
    .input(
      z.object({
        apartmentId: z.string(),
        transferCaseId: z.string().optional(),
        bankName: z.string().min(1),
        amount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rules = await getBrfRules();
      const fee = rules.prisbasbelopp * (rules.pledgeFeeMaxPercent / 100);

      return ctx.db.mortgageNotation.create({
        data: {
          apartmentId: input.apartmentId,
          transferCaseId: input.transferCaseId,
          bankName: input.bankName,
          amount: input.amount,
          fee,
          requestedById: ctx.user.id as string,
        },
      });
    }),

  // Remove (denotate) mortgage
  denotateMortgage: protectedProcedure
    .use(requirePermission("transfer:manage_financial"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mortgageNotation.update({
        where: { id: input.id },
        data: { denotationDate: new Date() },
      });
    }),

  // Get overdue transfers (for warnings)
  getOverdue: protectedProcedure
    .use(requirePermission("transfer:view"))
    .query(async ({ ctx }) => {
      const rules = await getBrfRules();
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() - rules.transferDecisionDeadlineWeeks * 7);

      return ctx.db.transferCase.findMany({
        where: {
          status: { in: ["INITIATED", "MEMBERSHIP_REVIEW"] },
          createdAt: { lt: deadlineDate },
        },
        include: {
          apartment: { select: { number: true, building: { select: { name: true } } } },
          buyerApplication: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),
});
