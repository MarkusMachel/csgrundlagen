import { useQuery } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useUIStore } from '@/stores/useUIStore';

import type { SearchResults } from '../types';

export function useSearch(query: string) {
  const locale = useUIStore((s) => s.locale);
  const q = query.trim();
  return useQuery({
    queryKey: ['search', q, locale],
    queryFn: () =>
      api.get<SearchResults>(`/search?q=${encodeURIComponent(q)}&locale=${locale}`),
    enabled: q.length >= 2,
  });
}
