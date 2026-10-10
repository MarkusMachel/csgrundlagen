const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60],
  ['hour', 60 * 60],
  ['day', 24 * 60 * 60],
];

/**
 * "in 10 minutes", "in 3 days", "now": a future (or past) time relative to
 * now, in the given locale. Picks the largest unit that keeps the number at
 * about 1 or more; "about" so that a review due in exactly one day still reads
 * "tomorrow" when a few milliseconds have passed by the time it renders.
 */
export function formatRelative(iso: string, locale: string, now = Date.now()): string {
  const seconds = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return rtf.format(0, 'minute');
  let unit: Intl.RelativeTimeFormatUnit = 'minute';
  let size = 60;
  for (const [u, s] of UNITS) {
    if (Math.abs(seconds) >= s * 0.95) [unit, size] = [u, s];
  }
  return rtf.format(Math.round(seconds / size), unit);
}
