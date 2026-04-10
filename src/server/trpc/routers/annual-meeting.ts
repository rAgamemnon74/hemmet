import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";

export const annualMeetingRouter = router({
  // List all annual/extraordinary meetings (current + historical)
  list: protectedProcedure
    .use(requirePermission("annual:view"))
    .query(async ({ ctx }) => {
      return ctx.db.meeting.findMany({
        where: { type: { in: ["ANNUAL", "EXTRAORDINARY"] } },
        include: {
          _count: {
            select: {
              agendaItems: true,
              attendances: true,
              decisions: true,
              motions: true,
              documents: true,
            },
          },
          protocol: { select: { id: true, signedAt: true } },
          voterRegistry: {
            select: {
              id: true,
              locked: true,
              entries: { select: { id: true, checkedIn: true } },
            },
          },
          proxies: { select: { id: true, approved: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });
    }),

  // Get full detail for member view
  getById: protectedProcedure
    .use(requirePermission("annual:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        include: {
          agendaItems: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              sortOrder: true,
              title: true,
              description: true,
              duration: true,
            },
          },
          protocol: {
            select: { id: true, content: true, signedAt: true, pdfUrl: true },
          },
          decisions: {
            orderBy: { decidedAt: "asc" },
            select: {
              id: true,
              reference: true,
              title: true,
              decisionText: true,
              method: true,
              votesFor: true,
              votesAgainst: true,
              votesAbstained: true,
            },
          },
          motions: {
            include: {
              author: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          voterRegistry: {
            include: {
              entries: {
                select: { id: true, memberId: true, checkedIn: true, checkedInAt: true },
              },
            },
          },
          proxies: {
            orderBy: { registeredAt: "asc" },
          },
          documents: {
            select: { id: true, fileName: true, fileUrl: true, category: true, createdAt: true },
          },
          _count: { select: { attendances: true } },
        },
      });

      if (!meeting) throw new TRPCError({ code: "NOT_FOUND" });
      if (meeting.type !== "ANNUAL" && meeting.type !== "EXTRAORDINARY") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Inte ett årsmöte" });
      }

      // Get linked annual report + audit if exists
      const annualReport = await ctx.db.annualReport.findFirst({
        where: { status: { in: ["APPROVED", "PUBLISHED"] } },
        include: {
          audit: {
            select: { status: true, recommendation: true, statement: true },
          },
        },
        orderBy: { fiscalYear: "desc" },
      });

      return { meeting, annualReport };
    }),

  // Member: register own proxy before meeting
  getMyProxy: protectedProcedure
    .use(requirePermission("annual:vote"))
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.meetingProxy.findUnique({
        where: {
          meetingId_memberId: {
            meetingId: input.meetingId,
            memberId: ctx.user.id,
          },
        },
      });
    }),
});
