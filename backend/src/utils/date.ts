import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const MANILA_TZ = 'Asia/Manila';

/**
 * Get the current time in UTC.
 */
export function nowUtc(): dayjs.Dayjs {
  return dayjs.utc();
}

/**
 * Convert a UTC date to Manila timezone for display.
 */
export function toManila(date: Date | string | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs.utc(date).tz(MANILA_TZ);
}

/**
 * Convert a Manila local time to UTC for storage.
 */
export function manilaToUtc(date: string | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs.tz(date, MANILA_TZ).utc();
}

/**
 * Format a date for display in Manila timezone.
 */
export function formatDateManila(date: Date | string | dayjs.Dayjs, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return toManila(date).format(format);
}

/**
 * Check if a date is within N days from now (UTC).
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const target = dayjs.utc(date);
  const now = dayjs.utc();
  const diff = target.diff(now, 'day', true);
  return diff >= 0 && diff <= days;
}

/**
 * Check if a date is past (overdue) relative to now (UTC).
 */
export function isPastDue(date: Date | string): boolean {
  return dayjs.utc(date).isBefore(dayjs.utc(), 'day');
}

export { dayjs };
