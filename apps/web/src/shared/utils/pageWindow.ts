export type PageItem = number | 'gap';

/**
 * The page buttons to show for a compact pager: first and last page, the
 * current page with one neighbour on each side, and gaps (…) between them.
 * Always 7 slots once there are more than 7 pages, so the bar doesn't jump
 * around as you page through, e.g. for page 7 of 24: 1 … 6 7 8 … 24.
 */
export function pageWindow(current: number, total: number): PageItem[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (total <= 7) return range(1, total);
  if (current <= 4) return [...range(1, 5), 'gap', total];
  if (current >= total - 3) return [1, 'gap', ...range(total - 4, total)];
  return [1, 'gap', current - 1, current, current + 1, 'gap', total];
}
