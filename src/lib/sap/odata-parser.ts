// SAP OData V2 utilities: date parsing, query builder helpers.

export function parseSapDate(s: string | null | undefined): Date {
  if (!s) return new Date();
  const ms = s.replace(/[^0-9]/g, '');
  if (!ms) return new Date();
  return new Date(Number(ms));
}

export function toSapDate(d: Date): string {
  return `/Date(${d.getTime()})/`;
}

export function flattenResults<T>(response: { d: { results: T[] } }): T[] {
  return response?.d?.results ?? [];
}

export function buildFilter(conditions: string[]): string {
  return conditions.filter(Boolean).join(' and ');
}

export function buildExpand(navProps: string[]): string {
  return navProps.join(',');
}

export function buildODataUrl(
  baseUrl: string,
  entity: string,
  options: {
    filter?: string;
    expand?: string;
    select?: string;
    top?: number;
    skip?: number;
    orderby?: string;
  } = {}
): string {
  const url = new URL(entity, baseUrl);
  url.searchParams.set('$format', 'json');
  if (options.filter) url.searchParams.set('$filter', options.filter);
  if (options.expand) url.searchParams.set('$expand', options.expand);
  if (options.select) url.searchParams.set('$select', options.select);
  if (options.top !== undefined) url.searchParams.set('$top', String(options.top));
  if (options.skip !== undefined) url.searchParams.set('$skip', String(options.skip));
  if (options.orderby) url.searchParams.set('$orderby', options.orderby);
  return url.toString();
}

export function parseSapDecimal(s: string | null | undefined): number {
  if (!s) return 0;
  return Number(s) || 0;
}

export function parseSapBoolean(v: string | boolean | null | undefined): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 'X') return true;
  return false;
}
