import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { emptyFilters, hasActiveFilters, type FilterState } from '../components/QuestionFilters';
import { filtersFromParams, filtersToParams } from '../filterUrl';

const storageKey = (scope: string) => `cft.filters.${scope}`;

function loadLast(scope: string): FilterState | null {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    return raw ? { ...emptyFilters, ...(JSON.parse(raw) as Partial<FilterState>) } : null;
  } catch {
    return null;
  }
}

function saveLast(scope: string, f: FilterState) {
  try {
    if (hasActiveFilters(f) || f.sort !== 'oldest') {
      localStorage.setItem(storageKey(scope), JSON.stringify(f));
    } else {
      localStorage.removeItem(storageKey(scope));
    }
  } catch {
    // storage blocked: filters just aren't remembered
  }
}

/**
 * Question filters kept in the URL (so back/forward, bookmarks and shared
 * links work) and remembered in this browser: a visit without filters in the
 * URL starts from the last ones used on that page.
 */
export function useFilterState(
  scope: 'home' | 'build',
): [FilterState, (next: FilterState) => void] {
  const [params, setParams] = useSearchParams();
  const fromUrl = useMemo(() => filtersFromParams(params), [params]);
  // Only the first render falls back to the remembered filters; after that
  // an empty URL means no filters (e.g. after "clear filters").
  const [last] = useState(() => (fromUrl ? null : loadLast(scope)));
  const restored = useRef(false);

  useEffect(() => {
    restored.current = true;
    if (last) setParams(filtersToParams(last, params), { replace: true });
    // once, on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filters = fromUrl ?? (!restored.current && last ? last : emptyFilters);

  // Remember what's shown, however it got there (a click, back/forward, a link).
  const remembered = JSON.stringify(filters);
  useEffect(() => saveLast(scope, JSON.parse(remembered) as FilterState), [scope, remembered]);

  const setFilters = useCallback(
    (next: FilterState) => {
      // Typing a search replaces the history entry instead of adding one per
      // keystroke; any other change (incl. applying a saved filter) adds one.
      const typing =
        next.search !== filters.search &&
        JSON.stringify({ ...next, search: '' }) === JSON.stringify({ ...filters, search: '' });
      setParams((prev) => filtersToParams(next, prev), { replace: typing });
    },
    [setParams, filters],
  );

  return [filters, setFilters];
}
