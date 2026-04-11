import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";
import { notifyRole } from "@/lib/notifications";

export const nominationRouter = router({
  // Get nomination period for a meeting
  getByMeeting: protectedProcedure
    .use(requirePermission("nomination:view"))
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.nominationPeriod.findUnique({
        where: { meetingId: input.meetingId },
        include: {
          nominations: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          memberNominations: {
            orderBy: { createdAt: "desc" },
            include: { nominationPeriod: false },
          },
        },
      });
    }),

  // Create nomination period (board/admin)
  createPeriod: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(z.object({
      meetingId: z.string(),
      chairpersonId: z.string().optional(),
      opensAt: z.coerce.date().optional(),
      closesAt: z.coerce.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.nominationPeriod.create({ data: input });
      logActivity({ userId: ctx.user.id as string, action: "nomination.createPeriod", entityType: "NominationPeriod", entityId: result.id, description: "Skapade valberedningsperiod", after: { meetingId: input.meetingId } });
      return result;
    }),

  // Update period status
  updatePeriodStatus: protectedProcedure
    .use(requirePermission("nomination:manage"))
    .input(z.object({
      id: z.string(),
      status: z.enum(["PLANNING", "OPEN", "CLOSED", "PRESENTED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const period = await ctx.db.nominationPeriod.findUnique({ where: { id: input.id } });
      if (!period) throw new TRPCError({ code: "NOT_FOUND" });

      const data: Record<string, unknown> = { status: input.status };
      if (input.status === "PRESENTED") data.presentedAt = new Date();

      const result = await ctx.db.nominationPeriod.update({ where: { id: input.id }, data });

      if (input.status === "OPEN") {
        notifyRole("MEMBER", { title: "Nomineringsperiod öppen", body: "Du kan nu föreslå kandidater till styrelse och revisorer.", link: "/medlem/nomineringar" });
      }

      logActivity({ userId: ctx.user.id as string, action: "nomination.updatePeriodStatus", entityType: "NominationPeriod", entityId: input.id, description: `Status: ${period.status} → ${input.status}`, before: { status: period.status }, after: { status: input.status } });
      return result;
    }),

  // Committee adds nomination
  addNomination: protectedProcedure
    .use(requirePermission("nomination:manage"))
    .input(z.object({
      nominationPeriodId: z.string(),
      position: z.enum(["CHAIRPERSON", "BOARD_MEMBER", "BOARD_SUBSTITUTE", "AUDITOR", "AUDITOR_SUBSTITUTE"]),
      candidateId: z.string().optional(),
      candidateName: z.string(),
      motivation: z.string().optional(),
      competenceAreas: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.nomination.create({ data: { ...input, source: "COMMITTEE" } });
      logActivity({ userId: ctx.user.id as string, action: "nomination.add", entityType: "Nomination", entityId: result.id, description: `Nominerade ${input.candidateName} till ${input.position}`, after: { position: input.position, candidateName: input.candidateName } });
      return result;
    }),

  // Update nomination status (contacted, accepted, declined)
  updateNominationStatus: protectedProcedure
    .use(requirePermission("nomination:manage"))
    .input(z.object({
      id: z.string(),
      status: z.enum(["CONTACTED", "ACCEPTED", "DECLINED", "WITHDRAWN", "ELECTED", "NOT_ELECTED"]),
      declinedReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const nom = await ctx.db.nomination.findUnique({ where: { id: input.id } });
      if (!nom) throw new TRPCError({ code: "NOT_FOUND" });

      const data: Record<string, unknown> = { status: input.status, declinedReason: input.declinedReason };
      if (input.status === "ACCEPTED") data.acceptedAt = new Date();

      const result = await ctx.db.nomination.update({ where: { id: input.id }, data });
      logActivity({ userId: ctx.user.id as string, action: "nomination.updateStatus", entityType: "Nomination", entityId: input.id, description: `${nom.candidateName}: ${nom.status} → ${input.status}`, before: { status: nom.status }, after: { status: input.status } });
      return result;
    }),

  // Member submits nomination suggestion
  submitSuggestion: protectedProcedure
    .use(requirePermission("nomination:submit"))
    .input(z.object({
      nominationPeriodId: z.string(),
      candidateId: z.string().optional(),
      candidateName: z.string().optional(),
      position: z.enum(["CHAIRPERSON", "BOARD_MEMBER", "BOARD_SUBSTITUTE", "AUDITOR", "AUDITOR_SUBSTITUTE"]),
      motivation: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const period = await ctx.db.nominationPeriod.findUnique({ where: { id: input.nominationPeriodId } });
      if (!period || period.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nomineringsperioden är inte öppen" });
      }

      const result = await ctx.db.memberNomination.create({
        data: { ...input, submittedById: ctx.user.id as string },
      });
      logActivity({ userId: ctx.user.id as string, action: "nomination.memberSuggestion", entityType: "MemberNomination", entityId: result.id, description: `Medlemsförslag: ${input.candidateName ?? "egen"} till ${input.position}` });
      return result;
    }),

  // Finalize — lock and present (chairperson only)
  finalize: protectedProcedure
    .use(requirePermission("nomination:finalize"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.nominationPeriod.update({
        where: { id: input.id },
        data: { status: "PRESENTED", presentedAt: new Date() },
      });
      logActivity({ userId: ctx.user.id as string, action: "nomination.finalize", entityType: "NominationPeriod", entityId: input.id, description: "Valberedningens förslag presenterat" });
      return result;
    }),
});
