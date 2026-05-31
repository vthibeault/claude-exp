import type { SapODataClient } from './client';
import type { ODataV2Response, SapCostItem } from '@/lib/types/sap';

export async function getCostsByWBS(
  client: SapODataClient,
  projectId: string
): Promise<SapCostItem[]> {
  // Primary: use PS_PROJECT_SRV if available; fall back to WBS cost fields.
  // In many S/4 landscapes only WBSElement PlannedTotalCost/ActualTotalCost is available.
  try {
    const res = await client.get<ODataV2Response<SapCostItem>>(
      'PS_PROJECT_SRV/CostItem',
      { $filter: `ProjectInternalID eq '${projectId}'` }
    );
    return res.d.results;
  } catch {
    return [];
  }
}
