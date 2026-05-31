// Transform validated SAP data → domain types used by UI components.

import {
  differenceInCalendarDays,
  differenceInDays,
  startOfDay,
} from 'date-fns';
import type {
  Project,
  WBSElement,
  Activity,
  ActivityLink,
  Milestone,
  CostLine,
} from '@/lib/types/domain';
import type {
  ValidatedProject,
  ValidatedWBSElement,
} from '@/lib/schemas/project';
import type {
  ValidatedActivity,
  ValidatedMilestone,
  ValidatedNetworkHeader,
} from '@/lib/schemas/network';
import type { ValidatedCostItem } from '@/lib/schemas/cost';
import { computeRAG } from '@/lib/utils/rag';

// ── WBS helpers ───────────────────────────────────────────────────────────────

function getParentCode(code: string): string | null {
  const parts = code.split('.');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('.');
}

function flattenWBS(
  elements: ValidatedWBSElement[],
  depth = 0
): ValidatedWBSElement[] {
  const result: ValidatedWBSElement[] = [];
  for (const el of elements) {
    result.push(el);
    const children = (el as { to_WBSElement?: { results: ValidatedWBSElement[] } })
      .to_WBSElement?.results ?? [];
    result.push(...flattenWBS(children, depth + 1));
  }
  return result;
}

function mapWBSElement(el: ValidatedWBSElement, level: number): WBSElement {
  const forecast = el.ActualTotalCost ?? 0;
  const planned = el.PlannedTotalCost ?? 0;
  const variancePct =
    planned > 0 ? ((forecast - planned) / planned) * 100 : 0;

  return {
    id: el.WBSElementInternalID,
    code: el.WBSElement,
    description: el.WBSElementDescription,
    projectId: el.ProjectInternalID,
    parentId: getParentCode(el.WBSElement),
    level,
    plannedCost: planned,
    actualCost: el.ActualTotalCost ?? 0,
    forecastCost: forecast,
    variancePct,
    plannedStart: el.PlannedStartDate,
    plannedEnd: el.PlannedEndDate,
    forecastEnd: el.ForecastedEndDate ?? null,
    isBillingElement: el.WBSElementIsBillingElement,
    isStatistical: el.WBSIsStatisticalWBSElement,
    responsiblePerson: el.ResponsiblePersonName,
    children: [],
  };
}

function buildWBSTree(flat: WBSElement[]): WBSElement[] {
  const byCode = new Map(flat.map((el) => [el.code, el]));
  const roots: WBSElement[] = [];
  for (const el of flat) {
    if (el.parentId && byCode.has(el.parentId)) {
      byCode.get(el.parentId)!.children.push(el);
    } else if (!el.parentId || !byCode.has(el.parentId)) {
      roots.push(el);
    }
  }
  return roots;
}

// ── Project mapper ────────────────────────────────────────────────────────────

export function mapProject(
  raw: ValidatedProject,
  networks: ValidatedNetworkHeader[] = []
): Project {
  const flatElements = flattenWBS(raw.to_WBSElement ?? []);
  const wbsFlat = flatElements.map((el, i) =>
    mapWBSElement(el, el.WBSElement.split('.').length - 1)
  );
  const wbsTree = buildWBSTree(wbsFlat);

  const allMilestones = networks.flatMap((n) =>
    n.to_NetworkActivity.flatMap((a) =>
      a.to_Milestone.map((m) => mapMilestone(m))
    )
  );

  const today = startOfDay(new Date());
  const upcomingMilestones = allMilestones
    .filter((m) => !m.isComplete)
    .sort((a, b) => a.daysAway - b.daysAway);

  const nextMilestone = upcomingMilestones[0] ?? null;

  const planned = raw.PlannedTotalCost ?? 0;
  const actual = raw.ActualTotalCost ?? 0;
  const budgetConsumedPct = planned > 0 ? (actual / planned) * 100 : 0;

  const projectEnd = raw.ProjectEndDate;
  const scheduleVarianceDays =
    differenceInCalendarDays(today, projectEnd) > 0 && budgetConsumedPct < 95
      ? differenceInCalendarDays(today, projectEnd)
      : 0;

  const ragStatus = computeRAG({
    budgetConsumedPct,
    scheduleVarianceDays,
    milestones: allMilestones,
  });

  return {
    id: raw.ProjectInternalID,
    code: raw.ProjectInternalID,
    description: raw.ProjectDescription,
    status: raw.ProjectProcessingStatus,
    startDate: raw.ProjectStartDate,
    endDate: raw.ProjectEndDate,
    currency: raw.Currency,
    responsibleCostCenter: raw.ResponsibleCostCenter,
    plannedCost: planned,
    actualCost: actual,
    budgetConsumedPct,
    ragStatus,
    nextMilestoneDaysAway: nextMilestone?.daysAway ?? null,
    nextMilestoneDescription: nextMilestone?.description ?? null,
    wbsElements: wbsTree,
  };
}

// ── Activity mapper ───────────────────────────────────────────────────────────

export function mapActivity(raw: ValidatedActivity): Activity {
  const duration = Math.max(
    1,
    differenceInCalendarDays(raw.EarliestEndDate, raw.EarliestStartDate)
  );

  const predecessors: ActivityLink[] = raw.to_ActivityRelationship.map((rel) => ({
    sourceId: `${rel.NetworkInternalID}-${rel.NetworkActivity}`,
    targetId: `${rel.SuccessorNetworkInternalID}-${rel.SuccessorActivity}`,
    type: (rel.RelationshipType as ActivityLink['type']) || 'FS',
  }));

  return {
    id: `${raw.NetworkInternalID}-${raw.NetworkActivity}`,
    networkId: raw.NetworkInternalID,
    activityNumber: raw.NetworkActivity,
    description: raw.NetworkActivityDescription,
    workCenter: raw.WorkCenterName,
    plannedHours: raw.PlannedWorkQuantity ?? 0,
    actualHours: raw.ActualWorkQuantity ?? 0,
    completionPct: raw.PercentageOfWorkCompleted ?? 0,
    earliestStart: raw.EarliestStartDate,
    earliestEnd: raw.EarliestEndDate,
    latestStart: raw.LatestStartDate,
    latestEnd: raw.LatestEndDate,
    plannedStart: raw.PlannedStartDate,
    plannedEnd: raw.PlannedEndDate,
    duration,
    wbsElementId: raw.WBSElementInternalID ?? null,
    predecessors,
  };
}

// ── Milestone mapper ──────────────────────────────────────────────────────────

export function mapMilestone(raw: ValidatedMilestone): Milestone {
  const today = startOfDay(new Date());
  const plannedDate = raw.PlannedDate;
  const daysAway = differenceInDays(plannedDate, today);

  const hasActual =
    raw.ActualDate && raw.ActualDate.getFullYear() > 1970;

  return {
    id: raw.MilestoneInternalID,
    description: raw.MilestoneDescription,
    networkId: raw.NetworkInternalID,
    activityId: raw.NetworkActivity,
    plannedDate,
    actualDate: hasActual ? raw.ActualDate : null,
    isComplete: raw.IsMilestoneConfirmed,
    daysAway,
  };
}

// ── Cost mapper ───────────────────────────────────────────────────────────────

export function mapCostLine(raw: ValidatedCostItem): CostLine {
  const planned = raw.PlanCurrencyAmount ?? 0;
  const actual = raw.ActualCurrencyAmount ?? 0;
  const commitment = raw.CommitmentAmount ?? 0;
  const forecast = actual + commitment;
  const variance = planned - forecast;
  const variancePct = planned > 0 ? (variance / planned) * 100 : 0;

  return {
    wbsElementId: raw.WBSElementInternalID,
    costElement: raw.CostElement,
    costElementName: raw.CostElementName,
    planned,
    actual,
    commitment,
    forecast,
    variance,
    variancePct,
    currency: raw.Currency,
    fiscalYear: raw.FiscalYear,
    fiscalPeriod: raw.FiscalPeriod,
  };
}
