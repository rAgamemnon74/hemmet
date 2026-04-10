import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { isBoardMember } from "@/lib/permissions";

const createMotionSchema = z.object({
  title: z.string().min(1, "Titel krävs"),
  description: z.string().min(1, "Beskrivning krävs"),
  proposal: z.string().min(1, "Yrkande krävs"),
});

const respondMotionSchema = z.object({
  id: z.string(),
  boardResponse: z.string().min(1, "Styrelsens yttrande krävs"),
  boardRecommendation: z.enum(["APPROVE", "REJECT", "AMEND", "NEUTRAL"]),
  alternativeProposal: z.string().optional(),
});

const addVoteProposalSchema = z.object({
  motionId: z.string(),
  label: z.string().min(1, "Etikett krävs"),
  description: z.string().min(1, "Beslutstext krävs"),
  source: z.enum(["MOTIONER", "BOARD", "AMENDMENT"]).default("BOARD"),
});

const recordVoteResultSchema = z.object({
  id: z.string(),
  votesFor: z.number().int().min(0),
  votesAgainst: z.number().int().min(0),
  votesAbstained: z.number().int().min(0),
  adopted: z.boolean(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hasMeetingRole(
  db: any,
  meetingId: string,
  userId: string
): Promise<boolean> {
  const meeting = await db.meeting.findUnique({
    where: { id: meetingId },
    select: { meetingChairpersonId: true, meetingSecretaryId: true, adjusters: true },
  });
  if (!meeting) return false;
  return (
    meeting.meetingChairpersonId === userId ||
    meeting.meetingSecretaryId === userId ||
    meeting.adjusters.includes(userId)
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function canRecordVotes(
  db: any,
  motionId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const motion = await db.motion.findUnique({
    where: { id: motionId },
    select: {
      status: true,
      meetingId: true,
      meeting: {
        select: {
          status: true,
          meetingChairpersonId: true,
          meetingSecretaryId: true,
          adjusters: true,
        },
      },
    },
  });

  if (!motion) return { allowed: false, reason: "Motionen hittades inte" };
  if (["DECIDED", "STRUCK", "NOT_TREATED"].includes(motion.status)) {
    return { allowed: false, reason: "Motionen är redan färdigbehandlad" };
  }
  if (!motion.meeting) {
    return { allowed: false, reason: "Motionen är inte kopplad till ett möte" };
  }

  const meetingStatus = motion.meeting.status;

  // During meeting: board members can record
  if (meetingStatus === "IN_PROGRESS") {
    return { allowed: true };
  }

  // Finalizing: only meeting roles (chairperson, secretary, adjuster)
  if (meetingStatus === "FINALIZING") {
    const isMeetingRole =
      motion.meeting.meetingChairpersonId === userId ||
      motion.meeting.meetingSecretaryId === userId ||
      motion.meeting.adjusters.includes(userId);

    if (!isMeetingRole) {
      return {
        allowed: false,
        reason: "Under efterbehandling kan bara mötesordförande, mötessekreterare eller justerare registrera röster",
      };
    }
    return { allowed: true };
  }

  // Completed: no changes
  if (meetingStatus === "COMPLETED") {
    return { allowed: false, reason: "Mötet är avslutat — inga ändringar kan göras" };
  }

  return { allowed: false, reason: "Mötet har inte startat" };
}

export const motionRouter = router({
  list: protectedProcedure
    .use(requirePermission("motion:submit"))
    .input(
      z.object({
        status: z
          .enum(["DRAFT", "SUBMITTED", "RECEIVED", "BOARD_RESPONSE", "DECIDED", "WITHDRAWN", "STRUCK", "NOT_TREATED"])
          .optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userRoles = (ctx.user.roles ?? []) as Role[];
      const isBoard = isBoardMember(userRoles);

      return ctx.db.motion.findMany({
        where: {
          status: input?.status,
          ...(!isBoard
            ? {
                OR: [
                  { authorId: ctx.user.id },
                  { status: { in: ["BOARD_RESPONSE", "DECIDED", "STRUCK", "NOT_TREATED"] } },
                ],
              }
            : {}),
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          meeting: { select: { id: true, title: true, scheduledAt: true, status: true } },
          _count: { select: { documents: true, voteProposals: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("motion:submit"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const motion = await ctx.db.motion.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, email: true } },
          meeting: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              status: true,
              meetingChairpersonId: true,
              meetingSecretaryId: true,
              adjusters: true,
            },
          },
          documents: {
            select: { id: true, fileName: true, fileUrl: true, fileSize: true, createdAt: true },
          },
          voteProposals: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
      if (!motion) throw new TRPCError({ code: "NOT_FOUND" });
      return motion;
    }),

  create: protectedProcedure
    .use(requirePermission("motion:submit"))
    .input(createMotionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.motion.create({
        data: {
          ...input,
          authorId: ctx.user.id,
          status: "SUBMITTED",
          submittedAt: new Date(),
          voteProposals: {
            create: [
              {
                sortOrder: 1,
                label: "Bifall",
                description: input.proposal,
                isDefault: true,
                source: "MOTIONER",
              },
              {
                sortOrder: 2,
                label: "Avslag",
                description: "Motionen avslås.",
                source: "MOTIONER",
              },
            ],
          },
        },
      });
    }),

  respond: protectedProcedure
    .use(requirePermission("motion:respond"))
    .input(respondMotionSchema)
    .mutation(async ({ ctx, input }) => {
      const motion = await ctx.db.motion.findUnique({
        where: { id: input.id },
        include: { voteProposals: true },
      });
      if (!motion) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["SUBMITTED", "RECEIVED"].includes(motion.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan bara yttra sig över inlämnade motioner" });
      }

      if (input.alternativeProposal && input.boardRecommendation === "AMEND") {
        const maxOrder = motion.voteProposals.reduce((max, p) => Math.max(max, p.sortOrder), 0);
        await ctx.db.motionVoteProposal.create({
          data: {
            motionId: input.id,
            sortOrder: maxOrder + 1,
            label: "Styrelsens förslag",
            description: input.alternativeProposal,
            source: "BOARD",
          },
        });
      }

      return ctx.db.motion.update({
        where: { id: input.id },
        data: {
          boardResponse: input.boardResponse,
          boardRecommendation: input.boardRecommendation,
          status: "BOARD_RESPONSE",
        },
      });
    }),

  acknowledge: protectedProcedure
    .use(requirePermission("motion:respond"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.motion.update({
        where: { id: input.id },
        data: { status: "RECEIVED" },
      });
    }),

  withdraw: protectedProcedure
    .use(requirePermission("motion:submit"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const motion = await ctx.db.motion.findUnique({ where: { id: input.id } });
      if (!motion) throw new TRPCError({ code: "NOT_FOUND" });
      if (motion.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Kan bara dra tillbaka egna motioner" });
      }
      if (["DECIDED", "STRUCK", "NOT_TREATED"].includes(motion.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Motionen är redan färdigbehandlad" });
      }
      return ctx.db.motion.update({
        where: { id: input.id },
        data: { status: "WITHDRAWN" },
      });
    }),

  // Mark motion as struck or not treated
  setOutcome: protectedProcedure
    .use(requirePermission("motion:respond"))
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["STRUCK", "NOT_TREATED"]),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const motion = await ctx.db.motion.findUnique({
        where: { id: input.id },
        include: { meeting: { select: { status: true } } },
      });
      if (!motion) throw new TRPCError({ code: "NOT_FOUND" });
      if (["DECIDED", "STRUCK", "NOT_TREATED"].includes(motion.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Motionen är redan färdigbehandlad" });
      }

      const meetingStatus = motion.meeting?.status;
      if (meetingStatus && !["IN_PROGRESS", "FINALIZING"].includes(meetingStatus)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mötet måste vara pågående eller under efterbehandling" });
      }

      return ctx.db.motion.update({
        where: { id: input.id },
        data: {
          status: input.status,
          resolution:
            input.resolution ??
            (input.status === "STRUCK"
              ? "Motionen ströks från dagordningen."
              : "Motionen behandlades ej på grund av tidsbrist."),
        },
      });
    }),

  // Vote proposals
  addProposal: protectedProcedure
    .use(requirePermission("motion:respond"))
    .input(addVoteProposalSchema)
    .mutation(async ({ ctx, input }) => {
      const motion = await ctx.db.motion.findUnique({ where: { id: input.motionId } });
      if (!motion) throw new TRPCError({ code: "NOT_FOUND" });
      if (["DECIDED", "STRUCK", "NOT_TREATED"].includes(motion.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan inte ändra förslag på färdigbehandlad motion" });
      }

      const maxOrder = await ctx.db.motionVoteProposal.aggregate({
        where: { motionId: input.motionId },
        _max: { sortOrder: true },
      });
      return ctx.db.motionVoteProposal.create({
        data: {
          ...input,
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });
    }),

  removeProposal: protectedProcedure
    .use(requirePermission("motion:respond"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.motionVoteProposal.findUnique({
        where: { id: input.id },
        include: { motion: { select: { status: true } } },
      });
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
      if (proposal.isDefault) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan inte ta bort standardförslag (bifall/avslag)" });
      }
      if (["DECIDED", "STRUCK", "NOT_TREATED"].includes(proposal.motion.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan inte ändra förslag på färdigbehandlad motion" });
      }
      return ctx.db.motionVoteProposal.delete({ where: { id: input.id } });
    }),

  recordVoteResult: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(recordVoteResultSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get proposal + motion to check permissions
      const proposal = await ctx.db.motionVoteProposal.findUnique({
        where: { id },
        include: { motion: { select: { id: true, meetingId: true, status: true } } },
      });
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });

      // Check if recording is allowed
      if (proposal.motion.meetingId) {
        const check = await canRecordVotes(ctx.db, proposal.motion.id, ctx.user.id);
        if (!check.allowed) {
          throw new TRPCError({ code: "FORBIDDEN", message: check.reason });
        }
      }

      // If this proposal is adopted, unadopt others for same motion
      if (data.adopted) {
        await ctx.db.motionVoteProposal.updateMany({
          where: { motionId: proposal.motion.id, id: { not: id } },
          data: { adopted: false },
        });
      }

      const updated = await ctx.db.motionVoteProposal.update({
        where: { id },
        data,
      });

      // Mark motion as decided if a proposal was adopted
      if (data.adopted) {
        await ctx.db.motion.update({
          where: { id: updated.motionId },
          data: {
            status: "DECIDED",
            resolution: `${updated.label}: ${updated.description}`,
          },
        });
      }

      return updated;
    }),
});
