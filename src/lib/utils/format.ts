// Number and currency formatters used throughout the UI.

export function formatCurrency(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency = 'CAD'): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ${currency}`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K ${currency}`;
  }
  return formatCurrency(amount, currency);
}

export function formatPct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatHours(hours: number): string {
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}K h`;
  return `${Math.round(hours)} h`;
}

export function formatDays(days: number): string {
  if (days === 1) return '1 jour';
  return `${Math.round(days)} jours`;
}

export function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}
