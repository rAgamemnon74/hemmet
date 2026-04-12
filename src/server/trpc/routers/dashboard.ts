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

    const [pendingApplications, pendingExpenses, pendingTransfers, pendingMotions, overdueTransfers, unownedApartments] = await Promise.all([
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
      // Lägenheter utan aktiv ägare
      ctx.db.apartment.count({
        where: {
          type: "APARTMENT",
          ownerships: { none: { active: true } },
        },
      }),
    ]);

    return { pendingApplications, pendingExpenses, pendingTransfers, pendingMotions, overdueTransfers, unownedApartments };
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

  // Samlad ärendevy — alla ärendetyper i en lista
  allCases: protectedProcedure.query(async ({ ctx }) => {
    const userRoles = (ctx.user.roles ?? []) as Role[];
    const isBoard = userRoles.some((r) => r.startsWith("BOARD_") || r === "ADMIN");
    if (!isBoard) return [];

    const [expenses, transfers, damageReports, suggestions, motions, sublets, renovations, disturbances] = await Promise.all([
      ctx.db.expense.findMany({
        where: { status: { in: ["SUBMITTED"] } },
        select: { id: true, description: true, amount: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      ctx.db.transferCase.findMany({
        where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
        select: { id: true, type: true, status: true, createdAt: true, apartment: { select: { number: true, building: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      ctx.db.damageReport.findMany({
        where: { status: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] } },
        select: { id: true, title: true, severity: true, status: true, createdAt: true },
        orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
        take: 20,
      }),
      ctx.db.suggestion.findMany({
        where: { status: { in: ["SUBMITTED", "ACKNOWLEDGED"] } },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.db.motion.findMany({
        where: { status: { in: ["SUBMITTED", "RECEIVED"] } },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.db.subletApplication.findMany({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        select: { id: true, tenantName: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.db.renovationApplication.findMany({
        where: { status: { in: ["SUBMITTED", "TECHNICAL_REVIEW", "BOARD_REVIEW"] } },
        select: { id: true, type: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      ctx.db.disturbanceCase.findMany({
        where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
        select: { id: true, type: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    type CaseItem = { id: string; caseType: string; title: string; status: string; urgency: number; href: string; createdAt: Date };
    const cases: CaseItem[] = [];

    for (const e of expenses) {
      cases.push({ id: e.id, caseType: "Utlägg", title: `${e.description} (${Number(e.amount).toLocaleString("sv-SE")} kr)`, status: e.status, urgency: 2, href: `/ekonomi/utlagg/${e.id}`, createdAt: e.createdAt });
    }
    for (const t of transfers) {
      cases.push({ id: t.id, caseType: "Överlåtelse", title: `${t.apartment.building.name} lgh ${t.apartment.number}`, status: t.status, urgency: 2, href: `/styrelse/overlatelser/${t.id}`, createdAt: t.createdAt });
    }
    for (const d of damageReports) {
      const urg = d.severity === "CRITICAL" ? 4 : d.severity === "HIGH" ? 3 : 1;
      cases.push({ id: d.id, caseType: "Felanmälan", title: d.title, status: d.status, urgency: urg, href: `/boende/skadeanmalan/${d.id}`, createdAt: d.createdAt });
    }
    for (const s of suggestions) {
      cases.push({ id: s.id, caseType: "Förslag", title: s.title, status: s.status, urgency: 0, href: `/boende/forslag/${s.id}`, createdAt: s.createdAt });
    }
    for (const m of motions) {
      cases.push({ id: m.id, caseType: "Motion", title: m.title, status: m.status, urgency: 1, href: `/medlem/motioner/${m.id}`, createdAt: m.createdAt });
    }
    for (const s of sublets) {
      cases.push({ id: s.id, caseType: "Andrahand", title: s.tenantName, status: s.status, urgency: 1, href: `/boende/andrahand`, createdAt: s.createdAt });
    }
    for (const r of renovations) {
      cases.push({ id: r.id, caseType: "Renovering", title: r.type, status: r.status, urgency: 1, href: `/boende/renovering`, createdAt: r.createdAt });
    }
    for (const d of disturbances) {
      const urg = ["FIRST_WARNING", "SECOND_WARNING", "ESCALATED"].includes(d.status) ? 3 : 1;
      cases.push({ id: d.id, caseType: "Störning", title: d.type, status: d.status, urgency: urg, href: `/boende/storningar`, createdAt: d.createdAt });
    }

    return cases.sort((a, b) => b.urgency - a.urgency || a.createdAt.getTime() - b.createdAt.getTime());
  }),

  // Årshjulet: process status + personal items per user
  annualTimeline: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id as string;
    const settings = await ctx.db.brfSettings.findUnique({ where: { id: "default" } });
    const fyEnd = settings?.fiscalYearEnd ?? 12;

    // Determine current and previous fiscal year
    const now = new Date();
    const currentYear = now.getFullYear();
    const fyEndDate = new Date(currentYear, fyEnd - 1 + 1, 0); // Last day of fiscal year end month
    const isBeforeFyEnd = now <= fyEndDate;
    const previousFiscalYear = isBeforeFyEnd ? String(currentYear - 1) : String(currentYear);
    const currentFiscalYear = isBeforeFyEnd ? String(currentYear) : String(currentYear + 1);

    // Previous year processes
    const [annualReport, annualMeeting] = await Promise.all([
      ctx.db.annualReport.findUnique({
        where: { fiscalYear: previousFiscalYear },
        select: { id: true, status: true, allSigned: true, finalPdfUrl: true },
      }),
      ctx.db.meeting.findFirst({
        where: { type: "ANNUAL", scheduledAt: { gt: fyEndDate } },
        orderBy: { scheduledAt: "asc" },
        select: { id: true, status: true, scheduledAt: true, title: true },
      }),
    ]);

    const audit = annualReport
      ? await ctx.db.audit.findFirst({
          where: { annualReportId: annualReport.id },
          select: { status: true, recommendation: true },
        })
      : null;

    const deadlineStamma = new Date(fyEndDate);
    deadlineStamma.setMonth(deadlineStamma.getMonth() + 6);

    type ProcessStatus = "DONE" | "ACTIVE" | "UPCOMING" | "WARNING" | "OVERDUE";
    function calcStatus(done: boolean, active: boolean, deadline?: Date): ProcessStatus {
      if (done) return "DONE";
      if (active) return "ACTIVE";
      if (deadline && now > deadline) return "OVERDUE";
      if (deadline && now > new Date(deadline.getTime() - 30 * 24 * 60 * 60 * 1000)) return "WARNING";
      return "UPCOMING";
    }

    const previousYearProcesses = [
      { key: "bokslut", label: "Bokslut", status: calcStatus(true, false) as ProcessStatus, detail: `Räkenskapsåret ${previousFiscalYear} avslutat` },
      { key: "arsberattelse", label: "Årsberättelse", status: calcStatus(annualReport?.status === "PUBLISHED" || annualReport?.status === "APPROVED" || annualReport?.status === "REVISED" || annualReport?.status === "REVIEW" || annualReport?.status === "SIGNED", annualReport?.status === "DRAFT" || annualReport?.status === "FINAL_UPLOADED", undefined) as ProcessStatus, detail: annualReport ? `Status: ${annualReport.status}` : "Ej påbörjad", link: annualReport ? `/styrelse/arsberattelse/${annualReport.id}` : "/styrelse/arsberattelse/ny" },
      { key: "revision", label: "Revision", status: calcStatus(audit?.status === "COMPLETED", audit?.status === "IN_PROGRESS", undefined) as ProcessStatus, detail: audit?.recommendation ?? "Inväntar", link: annualReport ? `/revision/${annualReport.id}` : undefined },
      { key: "stamma", label: "Stämma", status: calcStatus(annualMeeting?.status === "COMPLETED", annualMeeting?.status === "IN_PROGRESS" || annualMeeting?.status === "SCHEDULED", deadlineStamma) as ProcessStatus, detail: annualMeeting ? annualMeeting.title : "Ej planerad", link: annualMeeting ? `/medlem/arsmote/${annualMeeting.id}` : undefined, date: annualMeeting?.scheduledAt },
      { key: "bolagsverket", label: "Bolagsverket", status: calcStatus(false, false, new Date(deadlineStamma.getTime() + 30 * 24 * 60 * 60 * 1000)) as ProcessStatus, detail: "Digital inlämning" },
    ];

    // Current year: ongoing processes
    const [openTasks, openDamageReports, nextBoardMeeting] = await Promise.all([
      ctx.db.task.count({ where: { assigneeId: userId, status: { not: "DONE" } } }),
      ctx.db.damageReport.count({ where: { status: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
      ctx.db.meeting.findFirst({
        where: { type: "BOARD", status: { in: ["DRAFT", "SCHEDULED"] } },
        orderBy: { scheduledAt: "asc" },
        select: { id: true, title: true, scheduledAt: true },
      }),
    ]);

    // Personal items ("Mitt just nu")
    const [myDamageReports, mySublets, myRenovations, protocolsToSign, myTasks] = await Promise.all([
      ctx.db.damageReport.findMany({
        where: { reporterId: userId, status: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] } },
        select: { id: true, title: true, status: true },
        take: 5,
      }),
      ctx.db.subletApplication.findMany({
        where: { applicantId: userId, status: { in: ["SUBMITTED", "UNDER_REVIEW", "ACTIVE"] } },
        select: { id: true, status: true, tenantName: true },
        take: 3,
      }),
      ctx.db.renovationApplication.findMany({
        where: { applicantId: userId, status: { in: ["SUBMITTED", "TECHNICAL_REVIEW", "BOARD_REVIEW", "IN_PROGRESS"] } },
        select: { id: true, status: true, type: true },
        take: 3,
      }),
      ctx.db.protocol.findMany({
        where: { status: "FINALIZED", NOT: { signedBy: { has: userId } } },
        select: { id: true, meetingId: true, meeting: { select: { title: true } } },
        take: 5,
      }),
      ctx.db.task.findMany({
        where: { assigneeId: userId, status: { not: "DONE" } },
        select: { id: true, title: true, priority: true, dueDate: true },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
      }),
    ]);

    // Annual report: signing needed or work in progress
    const annualReportToSign = annualReport?.status === "FINAL_UPLOADED" && !annualReport.allSigned
      ? { id: annualReport.id, type: "sign" as const }
      : null;

    // Annual report in progress (DRAFT or FINAL_UPLOADED) — relevant for board members
    const annualReportInProgress = annualReport && ["DRAFT", "FINAL_UPLOADED"].includes(annualReport.status)
      ? { id: annualReport.id, status: annualReport.status, fiscalYear: previousFiscalYear }
      : null;

    return {
      previousFiscalYear,
      currentFiscalYear,
      previousYearProcesses,
      currentYear: {
        openTasks,
        openDamageReports,
        nextBoardMeeting,
      },
      personal: {
        damageReports: myDamageReports,
        sublets: mySublets,
        renovations: myRenovations,
        protocolsToSign,
        tasks: myTasks,
        annualReportToSign,
        annualReportInProgress,
      },
    };
  }),
});
