import type { SapODataClient } from './client';
import type { ODataV2Response, SapNetworkHeader, SapMilestone } from '@/lib/types/sap';

const SERVICE = 'API_PROJECT_NETWORK_SRV';

export async function getNetworks(
  client: SapODataClient,
  projectId: string
): Promise<SapNetworkHeader[]> {
  const res = await client.get<ODataV2Response<SapNetworkHeader>>(
    `${SERVICE}/NetworkHeader`,
    {
      $filter: `ProjectInternalID eq '${projectId}'`,
      $expand:
        'to_NetworkActivity,to_NetworkActivity/to_ActivityRelationship,to_NetworkActivity/to_Milestone',
    }
  );
  return res.d.results;
}

export async function getMilestones(
  client: SapODataClient,
  networkId: string
): Promise<SapMilestone[]> {
  const res = await client.get<ODataV2Response<SapMilestone>>(
    `${SERVICE}/Milestone`,
    { $filter: `NetworkInternalID eq '${networkId}'` }
  );
  return res.d.results;
}
