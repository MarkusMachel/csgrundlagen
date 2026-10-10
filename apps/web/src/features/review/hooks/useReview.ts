import { useQuery } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useUIStore } from '@/stores/useUIStore';

import type { ReviewQueue } from '../types';

/**
 * The questions to review now, plus up to `newCount` unseen ones. A session
 * works through a snapshot, so the query doesn't refetch while it runs.
 */
export function useReviewQueue(newCount = 0, enabled = true) {
  const locale = useUIStore((s) => s.locale);
  return useQuery({
    queryKey: ['reviewQueue', newCount, locale],
    queryFn: () => api.get<ReviewQueue>(`/review/queue?limit=50&new=${newCount}&locale=${locale}`),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** How many reviews are due now (for the tab badge). Refreshed after every answer. */
export function useDueCount() {
  return useQuery({
    queryKey: ['reviewSummary'],
    queryFn: () => api.get<ReviewQueue>('/review/queue?limit=1'),
    select: (q) => q.due,
  });
}
