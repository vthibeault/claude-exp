import { describe, it, expect } from 'vitest';
import { addDays } from 'date-fns';
import {
  dateToX,
  xToDate,
  snapToDay,
  computeFitViewport,
  type Viewport,
} from '@/components/project/gantt/gantt-utils';

const startDate = new Date('2025-01-01');
const vp: Viewport = { startDate, pxPerDay: 8 };

describe('dateToX', () => {
  it('returns 0 for the start date', () => {
    expect(dateToX(startDate, vp)).toBe(0);
  });

  it('returns pxPerDay * n for n days after startDate', () => {
    expect(dateToX(addDays(startDate, 10), vp)).toBe(80);
    expect(dateToX(addDays(startDate, 30), vp)).toBe(240);
  });

  it('returns negative for dates before start', () => {
    expect(dateToX(addDays(startDate, -5), vp)).toBe(-40);
  });
});

describe('xToDate', () => {
  it('round-trips from date to x and back', () => {
    const original = addDays(startDate, 15);
    const x = dateToX(original, vp);
    const result = xToDate(x, vp);
    expect(result.toDateString()).toBe(original.toDateString());
  });
});

describe('snapToDay', () => {
  it('snaps to nearest full day boundary', () => {
    // 13 px with pxPerDay=8 → nearest is 16 (2 days)
    expect(snapToDay(13, vp)).toBe(16);
    // 11 px → nearest is 8 (1 day)
    expect(snapToDay(11, vp)).toBe(8);
  });
});

describe('computeFitViewport', () => {
  it('returns a viewport with pxPerDay > 0 for non-empty rows', () => {
    const rows = [
      {
        start: new Date('2025-01-01'),
        end: new Date('2025-06-30'),
        baselineStart: new Date('2025-01-01'),
        baselineEnd: new Date('2025-06-30'),
      },
    ];
    const vp = computeFitViewport(rows, 1200);
    expect(vp.pxPerDay).toBeGreaterThan(0);
  });

  it('handles empty rows gracefully', () => {
    const vp = computeFitViewport([], 1200);
    expect(vp.pxPerDay).toBe(8);
  });
});
