// Parsed domain types used throughout the UI.
// All dates are JS Date objects; all numbers are actual numbers (not SAP strings).

export type RAGStatus = 'red' | 'amber' | 'green' | 'unknown';

export interface Project {
  id: string;
  code: string;
  description: string;
  status: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  responsibleCostCenter: string;
  plannedCost: number;
  actualCost: number;
  budgetConsumedPct: number;
  ragStatus: RAGStatus;
  nextMilestoneDaysAway: number | null;
  nextMilestoneDescription: string | null;
  wbsElements: WBSElement[];
}

export interface WBSElement {
  id: string;
  code: string;
  description: string;
  projectId: string;
  parentId: string | null;
  level: number;
  plannedCost: number;
  actualCost: number;
  forecastCost: number;
  variancePct: number;
  plannedStart: Date;
  plannedEnd: Date;
  forecastEnd: Date | null;
  isBillingElement: boolean;
  isStatistical: boolean;
  responsiblePerson: string;
  children: WBSElement[];
}

export interface Activity {
  id: string;
  networkId: string;
  activityNumber: string;
  description: string;
  workCenter: string;
  plannedHours: number;
  actualHours: number;
  completionPct: number;
  earliestStart: Date;
  earliestEnd: Date;
  latestStart: Date;
  latestEnd: Date;
  plannedStart: Date;
  plannedEnd: Date;
  duration: number; // calendar days (earliestEnd - earliestStart)
  wbsElementId: string | null;
  predecessors: ActivityLink[];
}

export interface ActivityLink {
  sourceId: string;
  targetId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
}

export interface Milestone {
  id: string;
  description: string;
  networkId: string;
  activityId: string;
  plannedDate: Date;
  actualDate: Date | null;
  isComplete: boolean;
  daysAway: number; // negative = overdue
}

export interface CostLine {
  wbsElementId: string;
  costElement: string;
  costElementName: string;
  planned: number;
  actual: number;
  commitment: number;
  forecast: number;
  variance: number;
  variancePct: number;
  currency: string;
  fiscalYear: number;
  fiscalPeriod: number;
}

// ── Gantt types ──────────────────────────────────────────────────────────────

export interface GanttRow {
  id: string;
  label: string;
  type: 'wbs' | 'activity' | 'milestone';
  start: Date;
  end: Date;
  baselineStart: Date;
  baselineEnd: Date;
  progress: number; // 0.0–1.0
  parentId: string | null;
  level: number;
  isExpanded: boolean;
  links: GanttLink[];
}

export interface GanttLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
}

// ── Network graph types ───────────────────────────────────────────────────────

export interface NetworkNode {
  id: string;
  activityNumber: string;
  description: string;
  workCenter: string;
  duration: number;
  earliestStart: Date;
  earliestEnd: Date;
  latestStart: Date;
  latestEnd: Date;
  completionPct: number;
  float: number; // total float in days; 0 = critical
}

export interface NetworkEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
}

export interface NetworkLayout {
  nodes: Map<string, { x: number; y: number; width: number; height: number }>;
  totalWidth: number;
  totalHeight: number;
}
