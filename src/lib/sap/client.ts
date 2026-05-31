// Server-side only SAP OData HTTP client.
// Never import this in client components — credentials would leak.

export interface SapClientConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export class SapODataClient {
  private authHeader: string;
  private baseUrl: string;

  constructor(config: SapClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.authHeader = `Basic ${Buffer.from(
      `${config.username}:${config.password}`
    ).toString('base64')}`;
  }

  async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`/sap/opu/odata/sap/${path}`, this.baseUrl);
    url.searchParams.set('$format', 'json');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new SapError(res.status, text);
    }

    return res.json() as Promise<T>;
  }
}

export class SapError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string
  ) {
    super(`SAP OData error ${status}`);
  }
}

export function getSapClient(): SapODataClient | null {
  const baseUrl = process.env.SAP_BASE_URL;
  const username = process.env.SAP_USERNAME;
  const password = process.env.SAP_PASSWORD;

  if (!baseUrl || !username || !password) return null;

  return new SapODataClient({ baseUrl, username, password });
}
