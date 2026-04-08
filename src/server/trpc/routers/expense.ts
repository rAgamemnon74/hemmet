import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import {
  createExpenseSchema,
  updateExpenseSchema,
  approveExpenseSchema,
  rejectExpenseSchema,
} from "@/lib/validators/expense";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const expenseRouter = router({
  list: protectedProcedure
    .use(requirePermission("expense:submit"))
    .input(
      z.object({
        status: z
          .enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"])
          .optional(),
        onlyMine: z.boolean().default(false),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.ExpenseWhereInput = {};
      if (input?.status) where.status = input.status;
      if (input?.onlyMine) where.submitterId = ctx.user.id;

      return ctx.db.expense.findMany({
        where,
        include: {
          submitter: {
            select: { id: true, firstName: true, lastName: true },
          },
          approver: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("expense:submit"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findUnique({
        where: { id: input.id },
        include: {
          submitter: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          approver: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });
      if (!expense) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Utlägget hittades inte" });
      }
      return expense;
    }),

  create: protectedProcedure
    .use(requirePermission("expense:submit"))
    .input(createExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.expense.create({
        data: {
          ...input,
          amount: new Prisma.Decimal(input.amount),
          submitterId: ctx.user.id,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    }),

  update: protectedProcedure
    .use(requirePermission("expense:submit"))
    .input(updateExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findUnique({
        where: { id: input.id },
      });
      if (!expense) throw new TRPCError({ code: "NOT_FOUND" });
      if (expense.submitterId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Kan bara redigera egna utlägg",
        });
      }
      if (expense.status !== "DRAFT" && expense.status !== "SUBMITTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kan bara redigera utlägg i utkast eller inskickat status",
        });
      }

      const { id, amount, ...rest } = input;
      return ctx.db.expense.update({
        where: { id },
        data: {
          ...rest,
          ...(amount !== undefined
            ? { amount: new Prisma.Decimal(amount) }
            : {}),
        },
      });
    }),

  approve: protectedProcedure
    .use(requirePermission("expense:approve"))
    .input(approveExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findUnique({
        where: { id: input.id },
      });
      if (!expense) throw new TRPCError({ code: "NOT_FOUND" });
      if (expense.status !== "SUBMITTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kan bara godkänna inskickade utlägg",
        });
      }
      return ctx.db.expense.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          approverId: ctx.user.id,
          approvedAt: new Date(),
        },
      });
    }),

  reject: protectedProcedure
    .use(requirePermission("expense:approve"))
    .input(rejectExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findUnique({
        where: { id: input.id },
      });
      if (!expense) throw new TRPCError({ code: "NOT_FOUND" });
      if (expense.status !== "SUBMITTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kan bara avslå inskickade utlägg",
        });
      }
      return ctx.db.expense.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          approverId: ctx.user.id,
          rejectionNote: input.rejectionNote,
        },
      });
    }),

  markPaid: protectedProcedure
    .use(requirePermission("expense:approve"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findUnique({
        where: { id: input.id },
      });
      if (!expense) throw new TRPCError({ code: "NOT_FOUND" });
      if (expense.status !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kan bara markera godkända utlägg som betalda",
        });
      }
      return ctx.db.expense.update({
        where: { id: input.id },
        data: { status: "PAID", paidAt: new Date() },
      });
    }),
});
