import { describe, it, expect } from 'vitest';
import {
  parseSapDate,
  parseSapDecimal,
  flattenResults,
  buildFilter,
  buildExpand,
} from '@/lib/sap/odata-parser';

describe('parseSapDate', () => {
  it('parses a valid /Date(ms)/ string', () => {
    const ms = new Date('2025-01-15').getTime();
    const result = parseSapDate(`/Date(${ms})/`);
    expect(result.toISOString().startsWith('2025-01-15')).toBe(true);
  });

  it('returns a date for null input', () => {
    expect(parseSapDate(null)).toBeInstanceOf(Date);
    expect(parseSapDate(undefined)).toBeInstanceOf(Date);
    expect(parseSapDate('')).toBeInstanceOf(Date);
  });
});

describe('parseSapDecimal', () => {
  it('converts SAP string number to float', () => {
    expect(parseSapDecimal('1234.56')).toBe(1234.56);
    expect(parseSapDecimal('0')).toBe(0);
  });

  it('returns 0 for null/undefined/empty', () => {
    expect(parseSapDecimal(null)).toBe(0);
    expect(parseSapDecimal(undefined)).toBe(0);
    expect(parseSapDecimal('')).toBe(0);
  });
});

describe('flattenResults', () => {
  it('extracts d.results array', () => {
    const data = { d: { results: [1, 2, 3] } };
    expect(flattenResults(data)).toEqual([1, 2, 3]);
  });
});

describe('buildFilter', () => {
  it('joins conditions with and', () => {
    expect(buildFilter(["ProjectInternalID eq 'X'", "Status eq 'I'"])).toBe(
      "ProjectInternalID eq 'X' and Status eq 'I'"
    );
  });

  it('ignores empty strings', () => {
    expect(buildFilter(['A eq 1', '', 'B eq 2'])).toBe('A eq 1 and B eq 2');
  });
});

describe('buildExpand', () => {
  it('joins nav properties with comma', () => {
    expect(buildExpand(['to_WBSElement', 'to_WBSElement/to_WBSElement'])).toBe(
      'to_WBSElement,to_WBSElement/to_WBSElement'
    );
  });
});
