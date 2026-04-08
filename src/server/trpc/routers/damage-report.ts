import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import {
  createDamageReportSchema,
  updateDamageReportStatusSchema,
  createReportCommentSchema,
} from "@/lib/validators/damage-report";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { isBoardMember } from "@/lib/permissions";

export const damageReportRouter = router({
  list: protectedProcedure
    .use(requirePermission("report:submit"))
    .input(
      z.object({
        status: z.enum(["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
        onlyMine: z.boolean().default(false),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];
      const isBoard = isBoardMember(userRoles);

      return ctx.db.damageReport.findMany({
        where: {
          status: input?.status,
          // Non-board users only see their own reports
          ...(!isBoard || input?.onlyMine
            ? { reporterId: ctx.user.id }
            : {}),
        },
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true },
          },
          apartment: {
            select: { number: true, building: { select: { name: true } } },
          },
          _count: { select: { comments: true, photos: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("report:submit"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];
      const isBoard = isBoardMember(userRoles);

      const report = await ctx.db.damageReport.findUnique({
        where: { id: input.id },
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          apartment: {
            select: { number: true, building: { select: { name: true } } },
          },
          comments: {
            where: isBoard ? {} : { isInternal: false },
            include: {
              author: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          photos: {
            select: { id: true, fileName: true, fileUrl: true },
          },
        },
      });

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Felanmälan hittades inte" });
      }

      // Non-board users can only see their own reports
      if (!isBoard && report.reporter.id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return report;
    }),

  create: protectedProcedure
    .use(requirePermission("report:submit"))
    .input(createDamageReportSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.damageReport.create({
        data: {
          ...input,
          reporterId: ctx.user.id,
        },
      });
    }),

  updateStatus: protectedProcedure
    .use(requirePermission("report:manage"))
    .input(updateDamageReportStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.damageReport.update({
        where: { id },
        data: {
          ...data,
          ...(data.status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
        },
      });
    }),

  addComment: protectedProcedure
    .use(requirePermission("report:submit"))
    .input(createReportCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];

      // Only board members can write internal comments
      if (input.isInternal && !isBoardMember(userRoles)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bara styrelsemedlemmar kan skriva interna kommentarer",
        });
      }

      return ctx.db.reportComment.create({
        data: {
          damageReportId: input.damageReportId,
          authorId: ctx.user.id,
          content: input.content,
          isInternal: input.isInternal,
        },
      });
    }),
});
