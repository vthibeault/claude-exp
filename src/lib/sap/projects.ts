import type { SapODataClient } from './client';
import type { ODataV2Response, SapProject, SapWBSElement } from '@/lib/types/sap';

const SERVICE = 'API_PROJECT_V2';

export async function getProjectList(client: SapODataClient): Promise<SapProject[]> {
  const res = await client.get<ODataV2Response<SapProject>>(`${SERVICE}/Project`, {
    $expand: 'to_WBSElement',
  });
  return res.d.results;
}

export async function getProjectById(
  client: SapODataClient,
  id: string
): Promise<SapProject> {
  const res = await client.get<{ d: SapProject }>(
    `${SERVICE}/Project('${encodeURIComponent(id)}')`,
    { $expand: 'to_WBSElement,to_WBSElement/to_WBSElement' }
  );
  return res.d;
}

export async function getWBSElements(
  client: SapODataClient,
  projectId: string
): Promise<SapWBSElement[]> {
  const res = await client.get<ODataV2Response<SapWBSElement>>(
    `${SERVICE}/WBSElement`,
    { $filter: `ProjectInternalID eq '${projectId}'` }
  );
  return res.d.results;
}
