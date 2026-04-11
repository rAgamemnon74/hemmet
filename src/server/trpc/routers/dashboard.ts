import { router, protectedProcedure } from "../trpc";
import { Role } from "@prisma/client";
import { getBrfRules } from "@/lib/rules";

export const dashboardRouter = router({
  // Board member: "Inför mötet" + "Sedan sist"
  boardOverview: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id as string;
    const userRoles = (ctx.user.roles ?? []) as Role[];
    const isBoard = userRoles.some((r) => r.startsWith("BOARD_") || r === "ADMIN");
    if (!isBoard) return null;

    // Find next upcoming meeting
    const nextMeeting = await ctx.db.meeting.findFirst({
      where: { status: { in: ["DRAFT", "SCHEDULED"] }, type: "BOARD" },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        status: true,
        agendaItems: { orderBy: { sortOrder: "asc" }, select: { id: true, sortOrder: true, title: true } },
        _count: { select: { agendaItems: true } },
      },
    });

    // Find last completed meeting (for "sedan sist")
    const lastMeeting = await ctx.db.meeting.findFirst({
      where: { status: { in: ["COMPLETED", "FINALIZING"] }, type: "BOARD" },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        protocol: { select: { status: true } },
      },
    });
    const sinceDate = lastMeeting?.scheduledAt ?? new Date(0);

    // Events since last meeting
    const [
      newTasks,
      newMotions,
      newSuggestions,
      newDamageReports,
      newExpenses,
      newTransfers,
      pendingProtocols,
    ] = await Promise.all([
      ctx.db.task.count({ where: { assigneeId: userId, createdAt: { gt: sinceDate }, status: { not: "DONE" } } }),
      ctx.db.motion.count({ where: { createdAt: { gt: sinceDate }, status: { in: ["SUBMITTED", "RECEIVED"] } } }),
      ctx.db.suggestion.count({ where: { createdAt: { gt: sinceDate }, status: { in: ["SUBMITTED", "ACKNOWLEDGED"] } } }),
      ctx.db.damageReport.count({ where: { createdAt: { gt: sinceDate }, status: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
      ctx.db.expense.count({ where: { createdAt: { gt: sinceDate }, status: "SUBMITTED" } }),
      ctx.db.transferCase.count({ where: { createdAt: { gt: sinceDate }, status: { in: ["INITIATED", "MEMBERSHIP_REVIEW"] } } }),
      ctx.db.meeting.count({
        where: {
          status: { in: ["FINALIZING", "COMPLETED"] },
          OR: [{ protocol: null }, { protocol: { status: "DRAFT" } }],
        },
      }),
    ]);

    // My open tasks
    const myTasks = await ctx.db.task.findMany({
      where: { assigneeId: userId, status: { not: "DONE" } },
      select: { id: true, title: true, priority: true, dueDate: true, status: true },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 5,
    });

    return {
      nextMeeting,
      lastMeeting: lastMeeting ? { ...lastMeeting, sinceDate } : null,
      sinceLast: { newTasks, newMotions, newSuggestions, newDamageReports, newExpenses, newTransfers, pendingProtocols },
      myTasks,
    };
  }),

  // Ordförande-specifik dashboard
  chairpersonOverview: protectedProcedure.query(async ({ ctx }) => {
    const userRoles = (ctx.user.roles ?? []) as Role[];
    const isChairperson = userRoles.includes(Role.BOARD_CHAIRPERSON) || userRoles.includes(Role.ADMIN);
    if (!isChairperson) return null;

    const [pendingApplications, pendingExpenses, pendingTransfers, pendingMotions, overdueTransfers] = await Promise.all([
      ctx.db.membershipApplication.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      ctx.db.expense.count({ where: { status: "SUBMITTED" } }),
      ctx.db.transferCase.count({ where: { status: { in: ["INITIATED", "MEMBERSHIP_REVIEW"] } } }),
      ctx.db.motion.count({ where: { status: { in: ["SUBMITTED", "RECEIVED"] } } }),
      ctx.db.transferCase.count({
        where: {
          status: { in: ["INITIATED", "MEMBERSHIP_REVIEW"] },
          createdAt: { lt: new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return { pendingApplications, pendingExpenses, pendingTransfers, pendingMotions, overdueTransfers };
  }),

  // Kassör-specifik dashboard
  treasurerOverview: protectedProcedure.query(async ({ ctx }) => {
    const userRoles = (ctx.user.roles ?? []) as Role[];
    const isTreasurer = userRoles.includes(Role.BOARD_TREASURER) || userRoles.includes(Role.ADMIN);
    if (!isTreasurer) return null;

    const rules = await getBrfRules();
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [pendingExpenses, approvedUnpaid, thisMonthPaid, lastMonthPaid, pendingTransferFees] = await Promise.all([
      ctx.db.expense.count({ where: { status: "SUBMITTED" } }),
      ctx.db.expense.count({ where: { status: "APPROVED" } }),
      ctx.db.expense.aggregate({ where: { status: "PAID", paidAt: { gte: thisMonth } }, _sum: { amount: true } }),
      ctx.db.expense.aggregate({ where: { status: "PAID", paidAt: { gte: lastMonth, lt: thisMonth } }, _sum: { amount: true } }),
      ctx.db.transferCase.count({ where: { status: { in: ["APPROVED", "FINANCIAL_SETTLEMENT"] }, transferFeePaidAt: null } }),
    ]);

    return {
      pendingExpenses,
      approvedUnpaid,
      thisMonthPaid: Number(thisMonthPaid._sum.amount ?? 0),
      lastMonthPaid: Number(lastMonthPaid._sum.amount ?? 0),
      pendingTransferFees,
      prisbasbelopp: rules.prisbasbelopp,
      prisbasbeloppYear: now.getFullYear(),
    };
  }),

  // Fastighetsansvarig-specifik dashboard
  propertyOverview: protectedProcedure.query(async ({ ctx }) => {
    const userRoles = (ctx.user.roles ?? []) as Role[];
    const isPropertyMgr = userRoles.includes(Role.BOARD_PROPERTY_MGR) || userRoles.includes(Role.ADMIN);
    if (!isPropertyMgr) return null;

    const [openReports, criticalReports, recentReports] = await Promise.all([
      ctx.db.damageReport.count({ where: { status: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
      ctx.db.damageReport.count({ where: { status: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] }, severity: "CRITICAL" } }),
      ctx.db.damageReport.findMany({
        where: { status: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] } },
        select: { id: true, title: true, severity: true, status: true, createdAt: true, location: true },
        orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
        take: 10,
      }),
    ]);

    return { openReports, criticalReports, recentReports };
  }),
});
