import {
  differenceInCalendarDays,
  addDays,
  startOfMonth,
  eachMonthOfInterval,
  format,
  eachWeekOfInterval,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export const ROW_HEIGHT = 44;
export const BAR_HEIGHT = 22;
export const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;
export const BASELINE_HEIGHT = 4;
export const HEADER_YEAR_H = 24;
export const HEADER_MONTH_H = 28;
export const HEADER_H = HEADER_YEAR_H + HEADER_MONTH_H;
export const LABEL_WIDTH = 300;
export const MIN_PX_PER_DAY = 3;
export const MAX_PX_PER_DAY = 40;

export interface Viewport {
  startDate: Date;
  pxPerDay: number;
}

export function dateToX(date: Date, vp: Viewport): number {
  return differenceInCalendarDays(date, vp.startDate) * vp.pxPerDay;
}

export function xToDate(x: number, vp: Viewport): Date {
  return addDays(vp.startDate, Math.round(x / vp.pxPerDay));
}

export function snapToDay(x: number, vp: Viewport): number {
  return Math.round(x / vp.pxPerDay) * vp.pxPerDay;
}

export function computeFitViewport(
  rows: { start: Date; end: Date; baselineStart: Date; baselineEnd: Date }[],
  containerWidth: number,
  padding = 14
): Viewport {
  if (!rows.length) {
    return { startDate: new Date(), pxPerDay: 8 };
  }

  const allDates = rows.flatMap((r) => [
    r.start,
    r.end,
    r.baselineStart,
    r.baselineEnd,
  ]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  const totalDays = Math.max(1, differenceInCalendarDays(maxDate, minDate)) + padding * 2;
  const availableWidth = containerWidth - LABEL_WIDTH;
  const pxPerDay = Math.min(
    MAX_PX_PER_DAY,
    Math.max(MIN_PX_PER_DAY, availableWidth / totalDays)
  );

  return {
    startDate: addDays(minDate, -padding),
    pxPerDay,
  };
}

export interface MonthTick {
  x: number;
  label: string;
  width: number;
}

export interface YearTick {
  x: number;
  label: string;
  width: number;
}

export interface WeekTick {
  x: number;
  label: string;
}

export function computeHeaderTicks(
  vp: Viewport,
  totalWidth: number
): { months: MonthTick[]; years: YearTick[]; weeks: WeekTick[] } {
  const endDate = xToDate(totalWidth, vp);

  const months: MonthTick[] = [];
  const monthStarts = eachMonthOfInterval({ start: vp.startDate, end: endDate });
  for (let i = 0; i < monthStarts.length; i++) {
    const x = dateToX(monthStarts[i], vp);
    const nextX = i < monthStarts.length - 1 ? dateToX(monthStarts[i + 1], vp) : totalWidth;
    months.push({
      x: Math.max(0, x),
      label: format(monthStarts[i], 'MMM', { locale: fr }),
      width: nextX - Math.max(0, x),
    });
  }

  const yearStarts = new Map<number, Date>();
  for (const ms of monthStarts) {
    const year = ms.getFullYear();
    if (!yearStarts.has(year)) yearStarts.set(year, ms);
  }

  const years: YearTick[] = [];
  const yearEntries = Array.from(yearStarts.entries()).sort(([a], [b]) => a - b);
  for (let i = 0; i < yearEntries.length; i++) {
    const [year, date] = yearEntries[i];
    const x = Math.max(0, dateToX(date, vp));
    const nextX =
      i < yearEntries.length - 1
        ? Math.max(0, dateToX(yearEntries[i + 1][1], vp))
        : totalWidth;
    years.push({ x, label: String(year), width: nextX - x });
  }

  const weeks: WeekTick[] = [];
  if (vp.pxPerDay >= 16) {
    const weekStarts = eachWeekOfInterval(
      { start: vp.startDate, end: endDate },
      { weekStartsOn: 1 }
    );
    for (const ws of weekStarts) {
      weeks.push({
        x: dateToX(ws, vp),
        label: format(ws, 'w', { locale: fr }),
      });
    }
  }

  return { months, years, weeks };
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function computeWeekendRects(
  vp: Viewport,
  totalDays: number,
  totalHeight: number
): { x: number; width: number }[] {
  const rects: { x: number; width: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(vp.startDate, i);
    if (isWeekend(date)) {
      rects.push({ x: i * vp.pxPerDay, width: vp.pxPerDay });
    }
  }
  return rects;
}
