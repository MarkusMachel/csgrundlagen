import { useQuery } from '@tanstack/react-query';

import { api } from '@/shared/api/client';

import type { Progress } from '../types';

/** The user's time zone, so "today" and streaks follow their calendar. */
function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: () => api.get<Progress>(`/me/progress?tz=${encodeURIComponent(timeZone())}`),
  });
}
