import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import {
  createTaskSchema,
  updateTaskSchema,
  createTaskCommentSchema,
} from "@/lib/validators/task";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const taskRouter = router({
  list: protectedProcedure
    .use(requirePermission("task:view"))
    .input(
      z.object({
        status: z.enum(["TODO", "IN_PROGRESS", "WAITING", "DONE", "CANCELLED"]).optional(),
        assigneeId: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.TaskWhereInput = {};
      if (input?.status) where.status = input.status;
      if (input?.assigneeId) where.assigneeId = input.assigneeId;
      if (input?.priority) where.priority = input.priority;

      return ctx.db.task.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          decision: {
            select: { id: true, reference: true, title: true },
          },
          _count: { select: { comments: true } },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("task:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: {
          assignee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          decision: {
            select: { id: true, reference: true, title: true },
          },
          comments: {
            include: {
              author: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ärendet hittades inte" });
      }
      return task;
    }),

  create: protectedProcedure
    .use(requirePermission("task:create"))
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.create({
        data: {
          ...input,
          createdById: ctx.user.id,
        },
      });
    }),

  update: protectedProcedure
    .use(requirePermission("task:view"))
    .input(updateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.task.update({
        where: { id },
        data: {
          ...data,
          ...(data.status === "DONE" ? { completedAt: new Date() } : {}),
        },
      });
    }),

  delete: protectedProcedure
    .use(requirePermission("task:create"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.delete({ where: { id: input.id } });
    }),

  addComment: protectedProcedure
    .use(requirePermission("task:view"))
    .input(createTaskCommentSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.taskComment.create({
        data: {
          taskId: input.taskId,
          authorId: ctx.user.id,
          content: input.content,
        },
      });
    }),
});
