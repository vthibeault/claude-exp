// Raw shapes returned by SAP OData V2 Gateway — before any transformation.
// SAP returns numeric values as strings; /Date(ms)/ format for dates.

export interface ODataV2Response<T> {
  d: { results: T[] };
}

export interface ODataV2Single<T> {
  d: T;
}

export type SapDate = string; // "/Date(1704067200000)/"

export interface SapProject {
  ProjectInternalID: string;
  ProjectDescription: string;
  ProjectProfile: string;
  ProjectProcessingStatus: string;
  ResponsibleCostCenter: string;
  ProjectStartDate: SapDate;
  ProjectEndDate: SapDate;
  Currency: string;
  PlannedTotalCost?: string;
  ActualTotalCost?: string;
  to_WBSElement?: { results: SapWBSElement[] };
}

export interface SapWBSElement {
  WBSElementInternalID: string;
  WBSElement: string;
  WBSElementDescription: string;
  ProjectInternalID: string;
  WBSElementIsBillingElement: boolean;
  WBSIsStatisticalWBSElement: boolean;
  PlannedTotalCost: string;
  ActualTotalCost: string;
  PlannedStartDate: SapDate;
  PlannedEndDate: SapDate;
  ForecastedEndDate?: SapDate;
  ResponsiblePersonName: string;
  to_WBSElement?: { results: SapWBSElement[] };
}

export interface SapNetworkHeader {
  NetworkInternalID: string;
  NetworkDescription: string;
  ProjectInternalID: string;
  ActualStartDate: SapDate;
  ActualEndDate: SapDate;
  to_NetworkActivity?: { results: SapActivity[] };
}

export interface SapActivity {
  NetworkInternalID: string;
  NetworkActivity: string;
  NetworkActivityDescription: string;
  WorkCenterName: string;
  PlannedWorkQuantity: string;
  PlannedWorkUnit: string;
  ActualWorkQuantity: string;
  EarliestStartDate: SapDate;
  EarliestEndDate: SapDate;
  LatestStartDate: SapDate;
  LatestEndDate: SapDate;
  PlannedStartDate: SapDate;
  PlannedEndDate: SapDate;
  PercentageOfWorkCompleted: string;
  WBSElementInternalID?: string;
  to_ActivityRelationship?: { results: SapActivityRelationship[] };
  to_Milestone?: { results: SapMilestone[] };
}

export interface SapActivityRelationship {
  NetworkInternalID: string;
  NetworkActivity: string;
  SuccessorNetworkInternalID: string;
  SuccessorActivity: string;
  RelationshipType: string; // "FS", "SS", "FF", "SF"
}

export interface SapMilestone {
  MilestoneInternalID: string;
  MilestoneDescription: string;
  NetworkInternalID: string;
  NetworkActivity: string;
  PlannedDate: SapDate;
  ActualDate: SapDate;
  MilestoneUsage: string;
  IsMilestoneConfirmed: boolean;
}

export interface SapCostItem {
  WBSElementInternalID: string;
  CostElement: string;
  CostElementName: string;
  PlanCurrencyAmount: string;
  ActualCurrencyAmount: string;
  CommitmentAmount: string;
  Currency: string;
  FiscalYear: string;
  FiscalPeriod: string;
}
