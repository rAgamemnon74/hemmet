import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { getBrfRules } from "@/lib/rules";

export const subletRouter = router({
  list: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.subletApplication.findMany({
        where: input?.status ? { status: input.status as never } : undefined,
        include: {
          apartment: { select: { number: true, building: { select: { name: true } } } },
          applicant: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Member submits sublet application
  submit: protectedProcedure
    .input(z.object({
      apartmentId: z.string(),
      reason: z.string().min(10, "Beskriv skälet till andrahandsuthyrning"),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      tenantName: z.string().min(1),
      tenantEmail: z.string().email().optional(),
      tenantPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const rules = await getBrfRules();
      if (rules.subletRequiresApproval === false) {
        // No approval needed — auto-approve
      }

      const subletFeeAmount = rules.prisbasbelopp * (rules.subletFeeMaxPercent / 100);

      const result = await ctx.db.subletApplication.create({
        data: { ...input, applicantId: ctx.user.id as string, subletFeeAmount },
      });

      logActivity({ userId: ctx.user.id as string, action: "sublet.submit", entityType: "SubletApplication", entityId: result.id, description: `Andrahandsansökan: ${input.tenantName}`, after: { startDate: input.startDate, endDate: input.endDate } });

      return result;
    }),

  // Board reviews
  review: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({
      id: z.string(),
      status: z.enum(["APPROVED", "REJECTED"]),
      rejectionReason: z.string().optional(),
      boardNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const app = await ctx.db.subletApplication.findUnique({ where: { id: input.id } });
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.status === "REJECTED" && !input.rejectionReason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Motivering krävs vid avslag" });
      }

      const result = await ctx.db.subletApplication.update({
        where: { id: input.id },
        data: {
          status: input.status === "APPROVED" ? "ACTIVE" : "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id as string,
          rejectionReason: input.rejectionReason,
          boardNotes: input.boardNotes,
        },
      });

      notify({ userId: app.applicantId, title: input.status === "APPROVED" ? "Andrahandsuthyrning godkänd" : "Andrahandsuthyrning avslagen", body: input.status === "APPROVED" ? `Din ansökan om andrahandsuthyrning har godkänts.` : `Din ansökan har avslagits: ${input.rejectionReason}`, link: "/min-sida" });

      logActivity({ userId: ctx.user.id as string, action: "sublet.review", entityType: "SubletApplication", entityId: input.id, description: `${input.status === "APPROVED" ? "Godkände" : "Avslog"} andrahandsansökan`, before: { status: app.status }, after: { status: result.status } });

      return result;
    }),
});
