import { emptyFilters, type FilterState } from './components/QuestionFilters';
import type { Difficulty, QuestionSort, QuestionStatus } from './hooks/useQuestions';

/**
 * Filters in the address bar: ?q=tcp&tag=Networking&difficulty=hard&status=wrong
 * &sort=random&seed=… Only what differs from the defaults is written, so an
 * unfiltered feed has a clean URL.
 */
const KEYS = ['q', 'tag', 'difficulty', 'status', 'sort', 'seed'];

export function filtersToParams(f: FilterState, keep?: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(keep);
  KEYS.forEach((k) => p.delete(k));
  if (f.search.trim()) p.set('q', f.search);
  f.tags.forEach((t) => p.append('tag', t));
  f.difficulties.forEach((d) => p.append('difficulty', d));
  if (f.status) p.set('status', f.status);
  if (f.sort !== 'oldest') p.set('sort', f.sort);
  if (f.sort === 'random' && f.seed) p.set('seed', f.seed);
  return p;
}

/** The filters in the URL, or null when it has none. */
export function filtersFromParams(p: URLSearchParams): FilterState | null {
  if (!KEYS.some((k) => p.has(k))) return null;
  const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T) =>
    allowed.includes(value as T) ? (value as T) : fallback;
  return {
    search: p.get('q') ?? '',
    tags: p.getAll('tag'),
    difficulties: p
      .getAll('difficulty')
      .filter((d): d is Difficulty => ['easy', 'medium', 'hard'].includes(d)),
    status: pick<QuestionStatus | ''>(
      p.get('status'),
      ['', 'unanswered', 'answered', 'wrong', 'bookmarked'],
      '',
    ),
    sort: pick<QuestionSort>(p.get('sort'), ['oldest', 'newest', 'random'], 'oldest'),
    seed: p.get('seed') ?? '',
  };
}

/** A query string (without "?") for linking to a filtered page. */
export function filtersQuery(f: FilterState): string {
  return filtersToParams(f).toString();
}

/** Same filters, ignoring the order of tags and difficulties. */
export function sameFilters(a: FilterState, b: FilterState): boolean {
  const norm = (f: FilterState) =>
    JSON.stringify({
      ...emptyFilters,
      ...f,
      search: f.search.trim(),
      tags: [...f.tags].sort(),
      difficulties: [...f.difficulties].sort(),
      seed: f.sort === 'random' ? f.seed : '',
    });
  return norm(a) === norm(b);
}
