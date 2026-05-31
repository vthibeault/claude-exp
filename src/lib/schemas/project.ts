import { z } from 'zod';

const sapDateSchema = z
  .string()
  .nullable()
  .optional()
  .transform((s): Date => {
    if (!s) return new Date();
    const ms = s.replace(/[^0-9]/g, '');
    return new Date(Number(ms));
  });

const sapDecimalSchema = z
  .string()
  .nullable()
  .optional()
  .transform((s) => (s ? Number(s) : 0));

export const WBSElementSchema = z.object({
  WBSElementInternalID: z.string(),
  WBSElement: z.string(),
  WBSElementDescription: z.string().default(''),
  ProjectInternalID: z.string(),
  WBSElementIsBillingElement: z.boolean().default(false),
  WBSIsStatisticalWBSElement: z.boolean().default(false),
  PlannedTotalCost: sapDecimalSchema,
  ActualTotalCost: sapDecimalSchema,
  PlannedStartDate: sapDateSchema,
  PlannedEndDate: sapDateSchema,
  ForecastedEndDate: sapDateSchema,
  ResponsiblePersonName: z.string().default(''),
});

export const ProjectSchema = z.object({
  ProjectInternalID: z.string(),
  ProjectDescription: z.string().default(''),
  ProjectProfile: z.string().default(''),
  ProjectProcessingStatus: z.string().default(''),
  ResponsibleCostCenter: z.string().default(''),
  ProjectStartDate: sapDateSchema,
  ProjectEndDate: sapDateSchema,
  Currency: z.string().default('CAD'),
  PlannedTotalCost: sapDecimalSchema,
  ActualTotalCost: sapDecimalSchema,
  to_WBSElement: z
    .object({ results: z.array(WBSElementSchema) })
    .optional()
    .transform((v) => v?.results ?? []),
});

export type ValidatedProject = z.output<typeof ProjectSchema>;
export type ValidatedWBSElement = z.output<typeof WBSElementSchema>;
