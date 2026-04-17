import { router, protectedProcedure, requirePermission } from "../trpc";
import { z } from "zod";
import { logActivity } from "@/lib/audit";
import {
  createEgenkontrollSchema, updateEgenkontrollSchema,
  createRiskAssessmentSchema, updateRiskAssessmentSchema,
  createChemicalSchema, updateChemicalSchema,
  createWastePlanSchema, updateWastePlanSchema,
  createIncidentSchema, updateIncidentSchema,
  createGoalSchema, updateGoalSchema,
} from "@/lib/validators/environment";

export const environmentRouter = router({
  // ── Overview (dashboard-data) ─────────────────────────────

  overview: protectedProcedure
    .use(requirePermission("environment:view"))
    .query(async ({ ctx }) => {
      const [
        activeEgenkontroll,
        openIncidents,
        chemicalCount,
        overdueRiskReviews,
        wastePlan,
      ] = await Promise.all([
        ctx.db.egenkontroll.findFirst({
          where: { status: "ACTIVE" },
          select: { id: true, title: true, nextReviewDate: true, version: true },
        }),
        ctx.db.environmentalIncident.count({
          where: { status: { in: ["REPORTED", "INVESTIGATING"] } },
        }),
        ctx.db.chemicalProduct.count({ where: { active: true } }),
        ctx.db.environmentalRiskAssessment.count({
          where: { nextReviewDate: { lt: new Date() }, resolvedAt: null },
        }),
        ctx.db.wasteManagementPlan.findFirst({
          where: { status: "ACTIVE" },
          select: { id: true, title: true, nextAuditDate: true },
        }),
      ]);

      return { activeEgenkontroll, openIncidents, chemicalCount, overdueRiskReviews, wastePlan };
    }),

  // ── Environment gap analysis ──────────────────────────────

  environmentGapAnalysis: protectedProcedure
    .use(requirePermission("environment:view"))
    .query(async ({ ctx }) => {
      type GapItem = { key: string; severity: "critical" | "warning" | "info"; title: string; detail: string };
      const gaps: GapItem[] = [];

      // 1. Egenkontroll — finns aktivt program?
      const activeEgenkontroll = await ctx.db.egenkontroll.findFirst({ where: { status: "ACTIVE" } });
      if (!activeEgenkontroll) {
        gaps.push({ key: "no-egenkontroll", severity: "critical", title: "Inget aktivt egenkontrollprogram", detail: "Lagkrav enligt förordning (1998:901)" });
      } else {
        // Kolla obligatoriska fält
        if (!activeEgenkontroll.responsibilityDescription) {
          gaps.push({ key: "egenkontroll-ansvar", severity: "warning", title: "Ansvarsfördelning saknas i egenkontroll", detail: "§4 — dokumentera vem som ansvarar för vad" });
        }
        if (!activeEgenkontroll.routinesDescription) {
          gaps.push({ key: "egenkontroll-rutiner", severity: "warning", title: "Driftrutiner saknas i egenkontroll", detail: "§5 — dokumenterade rutiner för drift och underhåll" });
        }
        if (!activeEgenkontroll.riskAssessmentDescription) {
          gaps.push({ key: "egenkontroll-risk", severity: "warning", title: "Riskbedömning saknas i egenkontroll", detail: "§6 — riskbedömning för miljö och hälsa" });
        }
        if (activeEgenkontroll.nextReviewDate && activeEgenkontroll.nextReviewDate < new Date()) {
          gaps.push({ key: "egenkontroll-overdue", severity: "warning", title: "Egenkontrollprogram behöver granskas", detail: "Planerad granskning har passerat" });
        }
      }

      // 2. Kemikalieförteckning — §7
      const chemicalCount = await ctx.db.chemicalProduct.count({ where: { active: true } });
      if (chemicalCount === 0) {
        gaps.push({ key: "no-chemicals", severity: "warning", title: "Kemikalieförteckning tom", detail: "§7 — förteckna kemiska produkter i gemensamma utrymmen" });
      } else {
        const staleCount = await ctx.db.chemicalProduct.count({
          where: {
            active: true,
            OR: [
              { lastVerifiedAt: null },
              { lastVerifiedAt: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
            ],
          },
        });
        if (staleCount > 0) {
          gaps.push({ key: "stale-chemicals", severity: "info", title: `${staleCount} kemikalier ej verifierade på 12 mån`, detail: "Verifiera att förteckningen stämmer" });
        }
      }

      // 3. Radon — kolla inspektionsdata
      const buildings = await ctx.db.building.findMany({ select: { id: true, name: true, constructionYear: true } });
      for (const building of buildings) {
        const radonInspection = await ctx.db.inspection.findFirst({
          where: { buildingId: building.id, type: "RADON" },
          orderBy: { completedAt: "desc" },
        });
        if (!radonInspection) {
          gaps.push({ key: `radon-missing-${building.id}`, severity: "warning", title: `Radonmätning saknas: ${building.name}`, detail: "Strålsäkerhetsmyndigheten rekommenderar mätning" });
        }

        // 4. PCB — byggnader 1956-1973
        if (building.constructionYear && building.constructionYear >= 1956 && building.constructionYear <= 1973) {
          const pcbRisk = await ctx.db.environmentalRiskAssessment.findFirst({
            where: { buildingId: building.id, area: "PCB" },
          });
          if (!pcbRisk) {
            gaps.push({ key: `pcb-missing-${building.id}`, severity: "warning", title: `PCB-inventering saknas: ${building.name}`, detail: `Byggnadsår ${building.constructionYear} — PCB kan förekomma i fogmassor` });
          }
        }
      }

      // 5. Energideklaration — kolla Building.energyDeclarationExpiry
      const buildingsWithExpiry = await ctx.db.building.findMany({
        where: { energyDeclarationExpiry: { not: null } },
        select: { id: true, name: true, energyDeclarationExpiry: true },
      });
      for (const b of buildingsWithExpiry) {
        if (b.energyDeclarationExpiry && b.energyDeclarationExpiry < new Date()) {
          gaps.push({ key: `energy-expired-${b.id}`, severity: "critical", title: `Energideklaration utgången: ${b.name}`, detail: "Lagkrav — förnya inom 10 år" });
        }
      }

      // 6. Avfallsplan
      const wastePlan = await ctx.db.wasteManagementPlan.findFirst({ where: { status: "ACTIVE" } });
      if (!wastePlan) {
        gaps.push({ key: "no-waste-plan", severity: "info", title: "Ingen aktiv avfallsplan", detail: "Dokumentera sortering och hämtning" });
      }

      // Summary
      const criticalCount = gaps.filter((g) => g.severity === "critical").length;
      const warningCount = gaps.filter((g) => g.severity === "warning").length;

      return { gaps, summary: { criticalCount, warningCount, total: gaps.length } };
    }),

  // ── Egenkontroll CRUD ─────────────────────────────────────

  listEgenkontroller: protectedProcedure
    .use(requirePermission("environment:view"))
    .query(async ({ ctx }) => {
      return ctx.db.egenkontroll.findMany({
        include: { _count: { select: { riskAssessments: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  getEgenkontroll: protectedProcedure
    .use(requirePermission("environment:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.egenkontroll.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          riskAssessments: { orderBy: [{ riskLevel: "desc" }, { createdAt: "desc" }] },
        },
      });
    }),

  createEgenkontroll: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(createEgenkontrollSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.egenkontroll.create({
        data: { ...input, createdById: ctx.user.id as string },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.egenkontroll.create",
        entityType: "Egenkontroll",
        entityId: result.id,
        description: `Skapade egenkontrollprogram: ${result.title}`,
      });
      return result;
    }),

  updateEgenkontroll: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(updateEgenkontrollSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const before = await ctx.db.egenkontroll.findUniqueOrThrow({ where: { id } });
      const result = await ctx.db.egenkontroll.update({
        where: { id },
        data: {
          ...data,
          ...(data.status === "ACTIVE" && !before.approvedAt ? { approvedAt: new Date(), approvedBy: ctx.user.id as string } : {}),
        },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.egenkontroll.update",
        entityType: "Egenkontroll",
        entityId: id,
        description: data.status ? `Ändrade status till ${data.status}: ${result.title}` : `Uppdaterade egenkontrollprogram: ${result.title}`,
        before: { status: before.status },
        after: { status: result.status },
      });
      return result;
    }),

  // ── Risk assessments ──────────────────────────────────────

  listRiskAssessments: protectedProcedure
    .use(requirePermission("environment:view"))
    .input(z.object({
      buildingId: z.string().optional(),
      area: z.string().optional(),
      riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
      resolved: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.environmentalRiskAssessment.findMany({
        where: {
          ...(input?.buildingId ? { buildingId: input.buildingId } : {}),
          ...(input?.area ? { area: input.area } : {}),
          ...(input?.riskLevel ? { riskLevel: input.riskLevel } : {}),
          ...(input?.resolved === true ? { resolvedAt: { not: null } } : {}),
          ...(input?.resolved === false ? { resolvedAt: null } : {}),
        },
        orderBy: [{ riskLevel: "desc" }, { createdAt: "desc" }],
      });
    }),

  createRiskAssessment: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(createRiskAssessmentSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.environmentalRiskAssessment.create({
        data: { ...input, createdById: ctx.user.id as string },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.risk.create",
        entityType: "EnvironmentalRiskAssessment",
        entityId: result.id,
        description: `Skapade riskbedömning: ${result.title} (${result.riskLevel})`,
      });
      return result;
    }),

  updateRiskAssessment: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(updateRiskAssessmentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const before = await ctx.db.environmentalRiskAssessment.findUniqueOrThrow({ where: { id } });
      const result = await ctx.db.environmentalRiskAssessment.update({ where: { id }, data });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.risk.update",
        entityType: "EnvironmentalRiskAssessment",
        entityId: id,
        description: `Uppdaterade riskbedömning: ${result.title}`,
        before: { riskLevel: before.riskLevel },
        after: { riskLevel: result.riskLevel },
      });
      return result;
    }),

  deleteRiskAssessment: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const risk = await ctx.db.environmentalRiskAssessment.delete({ where: { id: input.id } });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.risk.delete",
        entityType: "EnvironmentalRiskAssessment",
        entityId: input.id,
        description: `Tog bort riskbedömning: ${risk.title}`,
      });
      return risk;
    }),

  // ── Chemicals ─────────────────────────────────────────────

  listChemicals: protectedProcedure
    .use(requirePermission("environment:view"))
    .input(z.object({
      buildingId: z.string().optional(),
      active: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.chemicalProduct.findMany({
        where: {
          ...(input?.buildingId ? { buildingId: input.buildingId } : {}),
          ...(input?.active !== undefined ? { active: input.active } : {}),
        },
        orderBy: { productName: "asc" },
      });
    }),

  createChemical: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(createChemicalSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.chemicalProduct.create({
        data: { ...input, createdById: ctx.user.id as string, lastVerifiedAt: new Date() },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.chemical.create",
        entityType: "ChemicalProduct",
        entityId: result.id,
        description: `Lade till kemikalie: ${result.productName}`,
      });
      return result;
    }),

  updateChemical: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(updateChemicalSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db.chemicalProduct.update({ where: { id }, data });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.chemical.update",
        entityType: "ChemicalProduct",
        entityId: id,
        description: `Uppdaterade kemikalie: ${result.productName}`,
      });
      return result;
    }),

  deleteChemical: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const chem = await ctx.db.chemicalProduct.delete({ where: { id: input.id } });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.chemical.delete",
        entityType: "ChemicalProduct",
        entityId: input.id,
        description: `Tog bort kemikalie: ${chem.productName}`,
      });
      return chem;
    }),

  // ── Waste Management Plan ─────────────────────────────────

  getWasteManagementPlan: protectedProcedure
    .use(requirePermission("environment:view"))
    .query(async ({ ctx }) => {
      return ctx.db.wasteManagementPlan.findFirst({
        where: { status: { in: ["ACTIVE", "DRAFT"] } },
        orderBy: { createdAt: "desc" },
      });
    }),

  createWasteManagementPlan: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(createWastePlanSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.wasteManagementPlan.create({
        data: { ...input, createdById: ctx.user.id as string },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.waste.create",
        entityType: "WasteManagementPlan",
        entityId: result.id,
        description: `Skapade avfallsplan: ${result.title}`,
      });
      return result;
    }),

  updateWasteManagementPlan: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(updateWastePlanSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db.wasteManagementPlan.update({ where: { id }, data });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.waste.update",
        entityType: "WasteManagementPlan",
        entityId: id,
        description: `Uppdaterade avfallsplan: ${result.title}`,
      });
      return result;
    }),

  // ── Incidents ─────────────────────────────────────────────

  listIncidents: protectedProcedure
    .use(requirePermission("environment:view"))
    .input(z.object({
      status: z.string().optional(),
      incidentType: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.environmentalIncident.findMany({
        where: {
          ...(input?.status ? { status: input.status as never } : {}),
          ...(input?.incidentType ? { incidentType: input.incidentType } : {}),
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getIncident: protectedProcedure
    .use(requirePermission("environment:view"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.environmentalIncident.findUniqueOrThrow({ where: { id: input.id } });
    }),

  createIncident: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(createIncidentSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.environmentalIncident.create({
        data: { ...input, reportedById: ctx.user.id as string },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.incident.create",
        entityType: "EnvironmentalIncident",
        entityId: result.id,
        description: `Rapporterade miljöincident: ${result.title} (${result.incidentType})`,
      });
      return result;
    }),

  updateIncident: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(updateIncidentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const before = await ctx.db.environmentalIncident.findUniqueOrThrow({ where: { id } });
      const result = await ctx.db.environmentalIncident.update({ where: { id }, data });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.incident.update",
        entityType: "EnvironmentalIncident",
        entityId: id,
        description: data.status
          ? `Ändrade incidentstatus: ${before.status} → ${data.status}`
          : `Uppdaterade incident: ${result.title}`,
        before: { status: before.status },
        after: { status: result.status },
      });
      return result;
    }),

  // ── Sustainability Goals ──────────────────────────────────

  listSustainabilityGoals: protectedProcedure
    .use(requirePermission("environment:view"))
    .query(async ({ ctx }) => {
      return ctx.db.sustainabilityGoal.findMany({ orderBy: [{ achieved: "asc" }, { targetDate: "asc" }] });
    }),

  createSustainabilityGoal: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(createGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.sustainabilityGoal.create({
        data: { ...input, createdById: ctx.user.id as string },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.goal.create",
        entityType: "SustainabilityGoal",
        entityId: result.id,
        description: `Skapade hållbarhetsmål: ${result.title}`,
      });
      return result;
    }),

  updateSustainabilityGoal: protectedProcedure
    .use(requirePermission("environment:manage"))
    .input(updateGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db.sustainabilityGoal.update({
        where: { id },
        data: {
          ...data,
          ...(data.achieved ? { achievedAt: new Date() } : {}),
        },
      });
      logActivity({
        userId: ctx.user.id as string,
        action: "environment.goal.update",
        entityType: "SustainabilityGoal",
        entityId: id,
        description: data.achieved ? `Markerade mål som uppnått: ${result.title}` : `Uppdaterade hållbarhetsmål: ${result.title}`,
      });
      return result;
    }),
});
