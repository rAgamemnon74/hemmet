import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "../trpc";
import { createMeetingSchema, updateMeetingSchema } from "@/lib/validators/meeting";
import { getTemplate } from "@/lib/agenda-templates";
import { getBrfRules } from "@/lib/rules";
import { TRPCError } from "@trpc/server";
import { logActivity } from "@/lib/audit";

export const meetingRouter = router({
  list: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(
      z.object({
        type: z.enum(["BOARD", "ANNUAL", "EXTRAORDINARY"]).optional(),
        status: z.enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.meeting.findMany({
        where: {
          type: input?.type,
          status: input?.status,
        },
        include: {
          _count: { select: { agendaItems: true, attendances: true, decisions: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        include: {
          agendaItems: {
            orderBy: { sortOrder: "asc" },
            include: {
              votes: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
              decisions: true,
            },
          },
          attendances: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
          protocol: true,
          decisions: {
            orderBy: { decidedAt: "asc" },
          },
          _count: { select: { documents: true } },
        },
      });

      if (!meeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mötet hittades inte" });
      }

      return meeting;
    }),

  create: protectedProcedure
    .use(requirePermission("meeting:create"))
    .input(createMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      const { useTemplate, ...meetingData } = input;
      const template = useTemplate ? getTemplate(input.type) : [];

      const meeting = await ctx.db.meeting.create({
        data: {
          ...meetingData,
          calledBy: ctx.user.id,
          agendaItems: template.length > 0
            ? {
                create: template.map((item, index) => ({
                  sortOrder: index + 1,
                  title: item.title,
                  description: item.description ?? null,
                  duration: item.duration ?? null,
                  specialType: item.specialType ?? null,
                })),
              }
            : undefined,
        },
      });

      // Auto-link unprocessed motions from current fiscal year
      if (input.type === "ANNUAL" || input.type === "EXTRAORDINARY") {
        const settings = await ctx.db.brfSettings.findUnique({ where: { id: "default" } });
        const fyStart = settings?.fiscalYearStart ?? 1;
        const now = new Date();
        const fiscalYearStart = new Date(now.getFullYear(), fyStart - 1, 1);
        if (fiscalYearStart > now) {
          fiscalYearStart.setFullYear(fiscalYearStart.getFullYear() - 1);
        }

        await ctx.db.motion.updateMany({
          where: {
            meetingId: null,
            status: { in: ["SUBMITTED", "RECEIVED", "BOARD_RESPONSE"] },
            submittedAt: { gte: fiscalYearStart },
          },
          data: { meetingId: meeting.id },
        });
      }

      return meeting;
    }),

  update: protectedProcedure
    .use(requirePermission("meeting:edit"))
    .input(updateMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, skipNoticePeriodCheck, ...data } = input;

      // Warn about notice period when publishing (DRAFT → SCHEDULED)
      // Returns a warning that the client can show — only blocks if not overridden
      if (data.status === "SCHEDULED" && !skipNoticePeriodCheck) {
        const meeting = await ctx.db.meeting.findUnique({ where: { id } });
        if (meeting && meeting.type !== "BOARD") {
          const rules = await getBrfRules();
          const now = new Date();
          const meetingDate = meeting.scheduledAt;
          const weeksUntilMeeting = Math.floor(
            (meetingDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );

          if (weeksUntilMeeting < rules.noticePeriodMinWeeks) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: `Kallelsen skickas för sent. Mötet är om ${weeksUntilMeeting} veckor men stadgarna kräver minst ${rules.noticePeriodMinWeeks} veckors framförhållning.`,
            });
          }
          if (weeksUntilMeeting > rules.noticePeriodMaxWeeks) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: `Kallelsen skickas för tidigt. Mötet är om ${weeksUntilMeeting} veckor men stadgarna tillåter kallelse tidigast ${rules.noticePeriodMaxWeeks} veckor före.`,
            });
          }
        }
      }

      // Log before state for audit trail
      const before = await ctx.db.meeting.findUnique({ where: { id }, select: { status: true, title: true, scheduledAt: true, meetingChairpersonId: true, meetingSecretaryId: true, adjusters: true } });

      const result = await ctx.db.meeting.update({ where: { id }, data });

      logActivity({
        userId: ctx.user.id as string,
        action: "meeting.update",
        entityType: "Meeting",
        entityId: id,
        description: data.status ? `Status: ${before?.status} → ${data.status}` : "Uppdaterade mötesdata",
        before: before as Record<string, unknown>,
        after: data as Record<string, unknown>,
      });

      return result;
    }),

  getLog: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        include: {
          agendaItems: {
            orderBy: { sortOrder: "asc" },
            include: {
              decisions: {
                orderBy: { decidedAt: "asc" },
                include: {
                  voteRecords: { orderBy: { castAt: "asc" } },
                },
              },
              votes: {
                include: { user: { select: { id: true, firstName: true, lastName: true } } },
              },
            },
          },
          attendances: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            orderBy: { arrivedAt: "asc" },
          },
          decisions: {
            orderBy: { decidedAt: "asc" },
            include: {
              voteRecords: { orderBy: { castAt: "asc" } },
              agendaItem: { select: { sortOrder: true, title: true } },
            },
          },
          motions: {
            select: {
              id: true, title: true, proposal: true, status: true,
              boardResponse: true, boardRecommendation: true, resolution: true,
              author: { select: { firstName: true, lastName: true } },
              voteProposals: { orderBy: { sortOrder: "asc" } },
            },
          },
          proxies: {
            where: { approved: true },
            select: {
              id: true, memberId: true, proxyType: true,
              proxyMemberId: true, externalName: true,
            },
          },
          voterRegistry: {
            include: {
              entries: {
                orderBy: { checkedInAt: "asc" },
              },
            },
          },
        },
      });

      if (!meeting) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mötet hittades inte" });
      }

      // Collect all user IDs we need to resolve names for
      const userIdsToResolve = new Set<string>();
      if (meeting.meetingChairpersonId) userIdsToResolve.add(meeting.meetingChairpersonId);
      if (meeting.meetingSecretaryId) userIdsToResolve.add(meeting.meetingSecretaryId);
      for (const id of meeting.adjusters) userIdsToResolve.add(id);
      for (const p of meeting.proxies) {
        userIdsToResolve.add(p.memberId);
        if (p.proxyMemberId) userIdsToResolve.add(p.proxyMemberId);
      }
      if (meeting.voterRegistry) {
        for (const e of meeting.voterRegistry.entries) userIdsToResolve.add(e.memberId);
      }

      const resolvedUsers = userIdsToResolve.size > 0
        ? await ctx.db.user.findMany({
            where: { id: { in: [...userIdsToResolve] } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];
      const userMap = new Map(resolvedUsers.map((u) => [u.id, u]));
      const userName = (id: string | null) => {
        if (!id) return null;
        const u = userMap.get(id);
        return u ? `${u.firstName} ${u.lastName}` : null;
      };

      // Enrich proxies with names
      const proxiesWithNames = meeting.proxies.map((p) => ({
        ...p,
        memberName: userName(p.memberId) ?? "Okänd",
        proxyMemberName: userName(p.proxyMemberId),
      }));

      // Enrich voter registry entries with names
      const voterRegistryWithNames = meeting.voterRegistry ? {
        ...meeting.voterRegistry,
        entries: meeting.voterRegistry.entries.map((e) => ({
          ...e,
          memberName: userName(e.memberId) ?? "Okänd",
        })),
      } : null;

      return {
        meeting,
        chairpersonName: userName(meeting.meetingChairpersonId),
        secretaryName: userName(meeting.meetingSecretaryId),
        adjusterNames: meeting.adjusters.map((id) => userName(id) ?? "Okänd"),
        proxiesWithNames,
        voterRegistryWithNames,
      };
    }),

  delete: protectedProcedure
    .use(requirePermission("meeting:create"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({ where: { id: input.id } });
      if (!meeting) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (meeting.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kan bara ta bort möten i utkast-status" });
      }
      return ctx.db.meeting.delete({ where: { id: input.id } });
    }),
});
