import { router, protectedProcedure, requirePermission } from "../trpc";
import { simulateScenarioSchema } from "@/lib/validators/scenario";

export const scenarioRouter = router({
  /**
   * Simulera ekonomiska scenarion och beräkna påverkan på
   * äkta/oäkta-status samt medlemmarnas skattesituation.
   *
   * 60/40-regeln: Om externa intäkter (hyror, reklam etc.) överstiger
   * 40% av föreningens totala intäkter klassas föreningen som "oäkta"
   * (privatbostadsföretag → ej privatbostadsföretag).
   */
  simulate: protectedProcedure
    .use(requirePermission("meeting:view"))
    .input(simulateScenarioSchema)
    .query(async ({ ctx, input }) => {
      // ── 1. Hämta nuvarande data ────────────────────────────

      const apartments = await ctx.db.apartment.findMany({
        where: { type: "APARTMENT" },
        select: { id: true, number: true, area: true, monthlyFee: true, share: true, buildingId: true },
      });

      // Lokaler och andra icke-bostadsrätter (kommersiella ytor)
      const commercialUnits = await ctx.db.apartment.findMany({
        where: { type: { not: "APARTMENT" } },
        select: { id: true, number: true, area: true, monthlyFee: true, type: true },
      });

      // ── 2. Beräkna nuläge ──────────────────────────────────

      const currentAnnualFees = apartments.reduce(
        (sum, a) => sum + (a.monthlyFee ?? 0) * 12, 0
      );

      const currentCommercialIncome = commercialUnits.reduce(
        (sum, u) => sum + (u.monthlyFee ?? 0) * 12, 0
      );

      const currentTotalIncome = currentAnnualFees + currentCommercialIncome;
      const currentExternalRatio = currentTotalIncome > 0
        ? currentCommercialIncome / currentTotalIncome
        : 0;
      const currentIsAkta = currentExternalRatio <= 0.4;

      // ── 3. Beräkna simulerat scenario ──────────────────────

      // Nya avgifter efter sänkning
      const feeMultiplier = 1 - (input.feeReductionPercent / 100);
      const simulatedAnnualFees = currentAnnualFees * feeMultiplier;

      // Nya externa intäkter
      const simulatedCommercialIncome = currentCommercialIncome + input.newCommercialIncome;

      // Ränteförändringens påverkan (schablonberäkning)
      // Antar att föreningen har lån motsvarande ~60% av totala intäkter
      // och att ränteförändring appliceras på lånestocken
      const estimatedLoanBase = currentTotalIncome * 3; // Schablon: lån ≈ 3x årsintäkt
      const interestCostChange = estimatedLoanBase * (input.interestRateChange / 100);

      const simulatedTotalIncome = simulatedAnnualFees + simulatedCommercialIncome;
      const simulatedTotalCosts = simulatedTotalIncome + interestCostChange; // Nettopåverkan
      const simulatedExternalRatio = simulatedTotalIncome > 0
        ? simulatedCommercialIncome / simulatedTotalIncome
        : 0;
      const simulatedIsAkta = simulatedExternalRatio <= 0.4;

      // ── 4. Break-even: vid vilken extern intäkt når man 40%? ──

      // externalIncome / (annualFees + externalIncome) = 0.4
      // externalIncome = 0.4 * annualFees / 0.6
      const breakEvenExternalIncome = (0.4 * simulatedAnnualFees) / 0.6;
      const headroomToBreakEven = breakEvenExternalIncome - simulatedCommercialIncome;

      // ── 5. Medlemspåverkan per lägenhet ────────────────────

      // Schablon marknadshyra: ~1 500 kr/kvm/år (Stockholm)
      const MARKET_RENT_PER_SQM_YEAR = 1500;

      const perApartment = apartments.map((apt) => {
        const currentFee = (apt.monthlyFee ?? 0) * 12;
        const simulatedFee = currentFee * feeMultiplier;
        const feeSaving = currentFee - simulatedFee;

        // Bostadsförmånsvärde = marknadshyra - faktisk avgift
        const marketRent = (apt.area ?? 50) * MARKET_RENT_PER_SQM_YEAR;
        const benefitValue = marketRent - simulatedFee;

        // Skattemässig skillnad vid försäljning
        // Äkta: 22/30 av vinsten beskattas med 30% kapitalskatt
        // Oäkta: hela vinsten beskattas som inkomst av kapital (30%)
        // Förenklat: äkta ger 22% effektiv skatt, oäkta 30%
        const exampleProfit = 500000; // Exempelvinst vid försäljning
        const taxAkta = exampleProfit * 22 / 30 * 0.3; // 22/30-kvot → 22% effektiv
        const taxOakta = exampleProfit * 0.3;
        const taxDifference = taxOakta - taxAkta;

        return {
          apartmentId: apt.id,
          number: apt.number,
          area: apt.area,
          share: apt.share,
          currentMonthlyFee: apt.monthlyFee ?? 0,
          simulatedMonthlyFee: (apt.monthlyFee ?? 0) * feeMultiplier,
          monthlySaving: (apt.monthlyFee ?? 0) * (1 - feeMultiplier),
          annualSaving: feeSaving,
          marketRent,
          benefitValue: simulatedIsAkta ? 0 : benefitValue,
          taxDifferenceOnSale: simulatedIsAkta ? 0 : taxDifference,
        };
      });

      // ── 6. Skattekonsekvenser på föreningsnivå ─────────────

      // Äkta förening: schablonintäkt 1% av taxeringsvärde, ej skatt på avgifter
      // Oäkta förening: 20.6% bolagsskatt på överskott
      const taxImplications = {
        aktaDescription: "Schablonbeskattning (1% av taxeringsvärde). Avgifter och räntor ej skattepliktiga.",
        oaktaDescription: "Bolagsskatt 20.6% på överskott. Hyresintäkter fullt skattepliktiga. Medlemmar förlorar 22/30-kvoten vid försäljning.",
        exampleSaleTax500k: {
          akta: Math.round(500000 * 22 / 30 * 0.3),
          oakta: Math.round(500000 * 0.3),
          difference: Math.round(500000 * 0.3 - 500000 * 22 / 30 * 0.3),
        },
      };

      return {
        // Nuläge
        current: {
          isAkta: currentIsAkta,
          annualFees: Math.round(currentAnnualFees),
          commercialIncome: Math.round(currentCommercialIncome),
          totalIncome: Math.round(currentTotalIncome),
          externalRatio: Math.round(currentExternalRatio * 1000) / 10, // Procent med en decimal
          apartmentCount: apartments.length,
          commercialUnitCount: commercialUnits.length,
        },
        // Simulerat
        simulated: {
          isAkta: simulatedIsAkta,
          annualFees: Math.round(simulatedAnnualFees),
          commercialIncome: Math.round(simulatedCommercialIncome),
          totalIncome: Math.round(simulatedTotalIncome),
          externalRatio: Math.round(simulatedExternalRatio * 1000) / 10,
          interestCostChange: Math.round(interestCostChange),
          statusChanged: currentIsAkta !== simulatedIsAkta,
        },
        // Break-even
        breakEven: {
          maxExternalIncome: Math.round(breakEvenExternalIncome),
          headroom: Math.round(headroomToBreakEven),
          headroomPercent: simulatedTotalIncome > 0
            ? Math.round((headroomToBreakEven / simulatedTotalIncome) * 1000) / 10
            : 0,
        },
        // Skattekonsekvenser
        taxImplications,
        // Per lägenhet
        perApartment,
      };
    }),
});
