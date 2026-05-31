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

export const ActivityRelationshipSchema = z.object({
  NetworkInternalID: z.string(),
  NetworkActivity: z.string(),
  SuccessorNetworkInternalID: z.string(),
  SuccessorActivity: z.string(),
  RelationshipType: z.string().default('FS'),
});

export const MilestoneSchema = z.object({
  MilestoneInternalID: z.string(),
  MilestoneDescription: z.string().default(''),
  NetworkInternalID: z.string(),
  NetworkActivity: z.string(),
  PlannedDate: sapDateSchema,
  ActualDate: sapDateSchema,
  IsMilestoneConfirmed: z.boolean().default(false),
});

export const ActivitySchema = z.object({
  NetworkInternalID: z.string(),
  NetworkActivity: z.string(),
  NetworkActivityDescription: z.string().default(''),
  WorkCenterName: z.string().default(''),
  PlannedWorkQuantity: sapDecimalSchema,
  PlannedWorkUnit: z.string().default('H'),
  ActualWorkQuantity: sapDecimalSchema,
  EarliestStartDate: sapDateSchema,
  EarliestEndDate: sapDateSchema,
  LatestStartDate: sapDateSchema,
  LatestEndDate: sapDateSchema,
  PlannedStartDate: sapDateSchema,
  PlannedEndDate: sapDateSchema,
  PercentageOfWorkCompleted: sapDecimalSchema,
  WBSElementInternalID: z.string().nullable().optional(),
  to_ActivityRelationship: z
    .object({ results: z.array(ActivityRelationshipSchema) })
    .optional()
    .transform((v) => v?.results ?? []),
  to_Milestone: z
    .object({ results: z.array(MilestoneSchema) })
    .optional()
    .transform((v) => v?.results ?? []),
});

export const NetworkHeaderSchema = z.object({
  NetworkInternalID: z.string(),
  NetworkDescription: z.string().default(''),
  ProjectInternalID: z.string(),
  ActualStartDate: sapDateSchema,
  ActualEndDate: sapDateSchema,
  to_NetworkActivity: z
    .object({ results: z.array(ActivitySchema) })
    .optional()
    .transform((v) => v?.results ?? []),
});

export type ValidatedActivity = z.output<typeof ActivitySchema>;
export type ValidatedMilestone = z.output<typeof MilestoneSchema>;
export type ValidatedNetworkHeader = z.output<typeof NetworkHeaderSchema>;
