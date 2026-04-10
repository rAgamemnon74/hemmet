import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";

export const brfRulesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    let rules = await ctx.db.brfRules.findUnique({ where: { id: "default" } });
    if (!rules) {
      rules = await ctx.db.brfRules.create({ data: {} });
    }
    return rules;
  }),

  update: protectedProcedure
    .use(requirePermission("admin:settings"))
    .input(
      z.object({
        // Organization
        affiliation: z.enum(["NONE", "HSB", "RIKSBYGGEN", "SBC", "OTHER"]).optional(),
        reservedBoardSeats: z.number().int().min(0).max(3).optional(),
        reservedBoardSubstitutes: z.number().int().min(0).max(3).optional(),
        reservedAuditorSeats: z.number().int().min(0).max(2).optional(),
        requireOrgApprovalForStatuteChange: z.boolean().optional(),
        // Board
        minBoardMembers: z.number().int().min(1).max(15).optional(),
        maxBoardMembers: z.number().int().min(1).max(15).optional(),
        maxBoardSubstitutes: z.number().int().min(0).max(10).optional(),
        allowExternalBoardMembers: z.number().int().min(0).max(5).optional(),
        // Meeting notice
        noticePeriodMinWeeks: z.number().int().min(1).max(8).optional(),
        noticePeriodMaxWeeks: z.number().int().min(2).max(12).optional(),
        noticeMethodDigital: z.boolean().optional(),
        allowDigitalMeeting: z.boolean().optional(),
        // Proxy
        maxProxiesPerPerson: z.number().int().min(0).max(10).optional(),
        proxyCircleRestriction: z.boolean().optional(),
        proxyMaxValidityMonths: z.number().int().min(1).max(24).optional(),
        // Voting
        blankVoteExcluded: z.boolean().optional(),
        secretBallotOnDemand: z.boolean().optional(),
        tieBreakerChairperson: z.boolean().optional(),
        tieBreakerLotteryForElection: z.boolean().optional(),
        // Agenda
        adjustersCount: z.number().int().min(1).max(4).optional(),
        separateVoteCounters: z.boolean().optional(),
        // Motions
        motionDeadlineMonth: z.number().int().min(1).max(12).optional(),
        motionDeadlineDay: z.number().int().min(0).max(31).optional(),
        // Fees
        transferFeeMaxPercent: z.number().min(0).max(10).optional(),
        pledgeFeeMaxPercent: z.number().min(0).max(5).optional(),
        subletFeeMaxPercent: z.number().min(0).max(20).optional(),
        transferFeePaidBySeller: z.boolean().optional(),
        // Auditors
        minAuditors: z.number().int().min(1).max(5).optional(),
        maxAuditors: z.number().int().min(1).max(5).optional(),
        maxAuditorSubstitutes: z.number().int().min(0).max(5).optional(),
        requireAuthorizedAuditor: z.boolean().optional(),
        // Maintenance
        maintenancePlanRequired: z.boolean().optional(),
        maintenancePlanYears: z.number().int().min(5).max(100).optional(),
        maintenanceFundPercent: z.number().min(0).max(5).optional().nullable(),
        // Protocol
        protocolDeadlineWeeks: z.number().int().min(1).max(8).optional(),
        // Ownership
        maxOwnershipPercent: z.number().min(50).max(200).optional(),
        // Sublet
        subletRequiresApproval: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.brfRules.upsert({
        where: { id: "default" },
        update: input,
        create: { ...input },
      });
    }),
});
