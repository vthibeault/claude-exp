import { describe, it, expect } from 'vitest';
import { computeRAG } from '@/lib/utils/rag';

describe('computeRAG', () => {
  it('returns green when all metrics are healthy', () => {
    expect(computeRAG({ budgetConsumedPct: 50 })).toBe('green');
  });

  it('returns red when budget exceeds 110%', () => {
    expect(computeRAG({ budgetConsumedPct: 115 })).toBe('red');
  });

  it('returns amber when budget is between 90% and 110%', () => {
    expect(computeRAG({ budgetConsumedPct: 95 })).toBe('amber');
    expect(computeRAG({ budgetConsumedPct: 109 })).toBe('amber');
  });

  it('returns red when a milestone is overdue by more than 14 days', () => {
    expect(
      computeRAG({
        budgetConsumedPct: 50,
        milestones: [{ daysAway: -15, isComplete: false }],
      })
    ).toBe('red');
  });

  it('returns amber when a milestone is overdue by 1–14 days', () => {
    expect(
      computeRAG({
        budgetConsumedPct: 50,
        milestones: [{ daysAway: -7, isComplete: false }],
      })
    ).toBe('amber');
  });

  it('ignores completed milestones', () => {
    expect(
      computeRAG({
        budgetConsumedPct: 50,
        milestones: [{ daysAway: -30, isComplete: true }],
      })
    ).toBe('green');
  });

  it('returns red when schedule variance > 30 days', () => {
    expect(
      computeRAG({ budgetConsumedPct: 50, scheduleVarianceDays: 31 })
    ).toBe('red');
  });

  it('returns amber when schedule variance is 15–30 days', () => {
    expect(
      computeRAG({ budgetConsumedPct: 50, scheduleVarianceDays: 20 })
    ).toBe('amber');
  });
});
