import type { RAGStatus } from '@/lib/types/domain';

interface RAGInput {
  budgetConsumedPct: number;
  scheduleVarianceDays?: number;
  milestones?: { daysAway: number; isComplete: boolean }[];
}

export function computeRAG(input: RAGInput): RAGStatus {
  const { budgetConsumedPct, scheduleVarianceDays = 0, milestones = [] } = input;

  const overdueDays = milestones
    .filter((m) => !m.isComplete && m.daysAway < 0)
    .map((m) => Math.abs(m.daysAway));

  const maxOverdueDays = overdueDays.length > 0 ? Math.max(...overdueDays) : 0;

  // Red conditions
  if (
    budgetConsumedPct > 110 ||
    maxOverdueDays > 14 ||
    scheduleVarianceDays > 30
  ) {
    return 'red';
  }

  // Amber conditions
  if (
    budgetConsumedPct > 90 ||
    maxOverdueDays > 0 ||
    scheduleVarianceDays > 15
  ) {
    return 'amber';
  }

  return 'green';
}

export function ragColor(status: RAGStatus): string {
  switch (status) {
    case 'red':
      return '#ef4444';
    case 'amber':
      return '#f59e0b';
    case 'green':
      return '#22c55e';
    default:
      return '#94a3b8';
  }
}

export function ragLabel(status: RAGStatus): string {
  switch (status) {
    case 'red':
      return 'Critique';
    case 'amber':
      return 'À risque';
    case 'green':
      return 'En bonne voie';
    default:
      return 'Inconnu';
  }
}
