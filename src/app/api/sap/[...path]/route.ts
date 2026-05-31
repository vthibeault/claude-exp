import { NextRequest, NextResponse } from 'next/server';
import {
  MOCK_PROJECTS,
  MOCK_NETWORKS,
  MOCK_COSTS,
} from '@/lib/mocks/data';

const ALLOWED_SERVICES = new Set([
  'API_PROJECT_V2',
  'API_PROJECT_NETWORK_SRV',
  'PS_PROJECT_SRV',
]);

const ALLOWED_PARAMS = new Set([
  '$filter',
  '$expand',
  '$select',
  '$top',
  '$skip',
  '$orderby',
  '$format',
]);

function isDemoMode(): boolean {
  return (
    process.env.DEMO_MODE === 'true' ||
    !process.env.SAP_BASE_URL ||
    !process.env.SAP_USERNAME ||
    !process.env.SAP_PASSWORD
  );
}

function handleDemo(
  service: string,
  entity: string,
  searchParams: URLSearchParams
): NextResponse {
  const filterParam = searchParams.get('$filter') ?? '';

  if (service === 'API_PROJECT_V2') {
    if (entity === 'Project') {
      const projectId = filterParam.match(/ProjectInternalID eq '([^']+)'/)?.[1];
      if (projectId) {
        const project = MOCK_PROJECTS.find((p) => p.ProjectInternalID === projectId);
        if (!project) return NextResponse.json({ d: { results: [] } });
        return NextResponse.json({ d: { results: [project] } });
      }
      return NextResponse.json({ d: { results: MOCK_PROJECTS } });
    }
    if (entity === 'WBSElement') {
      const projectId = filterParam.match(/ProjectInternalID eq '([^']+)'/)?.[1];
      const wbs =
        MOCK_PROJECTS.find((p) => p.ProjectInternalID === projectId)
          ?.to_WBSElement?.results ?? [];
      return NextResponse.json({ d: { results: wbs } });
    }
  }

  if (service === 'API_PROJECT_NETWORK_SRV') {
    if (entity === 'NetworkHeader') {
      const projectId = filterParam.match(/ProjectInternalID eq '([^']+)'/)?.[1];
      const networks = projectId ? (MOCK_NETWORKS[projectId] ?? []) : [];
      return NextResponse.json({ d: { results: networks } });
    }
  }

  if (service === 'PS_PROJECT_SRV') {
    if (entity === 'CostItem') {
      const projectId = filterParam.match(/ProjectInternalID eq '([^']+)'/)?.[1];
      const costs = projectId ? (MOCK_COSTS[projectId] ?? []) : [];
      return NextResponse.json({ d: { results: costs } });
    }
  }

  return NextResponse.json({ d: { results: [] } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const [service, ...rest] = params.path;
  const entity = rest[0] ?? '';

  if (!ALLOWED_SERVICES.has(service)) {
    return NextResponse.json({ error: 'Service not allowed' }, { status: 403 });
  }

  if (isDemoMode()) {
    return handleDemo(service, entity, req.nextUrl.searchParams);
  }

  const sapUrl = new URL(
    `/sap/opu/odata/sap/${service}/${rest.join('/')}`,
    process.env.SAP_BASE_URL
  );

  req.nextUrl.searchParams.forEach((v, k) => {
    if (ALLOWED_PARAMS.has(k)) sapUrl.searchParams.set(k, v);
  });
  sapUrl.searchParams.set('$format', 'json');

  const credentials = Buffer.from(
    `${process.env.SAP_USERNAME}:${process.env.SAP_PASSWORD}`
  ).toString('base64');

  try {
    const sapRes = await fetch(sapUrl.toString(), {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(30_000),
    });

    const data = await sapRes.json();
    return NextResponse.json(data, { status: sapRes.status });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'SAP Gateway timeout' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'SAP Gateway error' }, { status: 502 });
  }
}
