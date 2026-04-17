import { z } from "zod";

export const simulateScenarioSchema = z.object({
  newCommercialIncome: z.number().min(0, "Kan inte vara negativt").default(0),
  feeReductionPercent: z.number().min(0).max(100).default(0),
  interestRateChange: z.number().min(-10).max(10).default(0),
});

export type ScenarioInput = z.infer<typeof simulateScenarioSchema>;
