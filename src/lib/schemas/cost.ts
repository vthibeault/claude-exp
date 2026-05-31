import { z } from 'zod';

const sapDecimalSchema = z
  .string()
  .nullable()
  .optional()
  .transform((s) => (s ? Number(s) : 0));

export const CostItemSchema = z.object({
  WBSElementInternalID: z.string(),
  CostElement: z.string(),
  CostElementName: z.string().default(''),
  PlanCurrencyAmount: sapDecimalSchema,
  ActualCurrencyAmount: sapDecimalSchema,
  CommitmentAmount: sapDecimalSchema,
  Currency: z.string().default('CAD'),
  FiscalYear: z.string().transform(Number),
  FiscalPeriod: z.string().transform(Number),
});

export type ValidatedCostItem = z.output<typeof CostItemSchema>;
