import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useUIStore } from '@/stores/useUIStore';

import type { Question } from '../types';

export function useBookmarkedQuestions() {
  const locale = useUIStore((s) => s.locale);
  return useQuery({
    queryKey: ['bookmarks', locale],
    queryFn: () => api.get<Question[]>(`/bookmarks?locale=${locale}`),
  });
}

export function useToggleBookmark(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ bookmarked: boolean }>(`/questions/${questionId}/bookmark`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

/** Whether the given question is currently bookmarked, derived from the bookmarks list. */
export function useIsBookmarked(questionId: string): boolean {
  const { data } = useBookmarkedQuestions();
  return data?.some((q) => q.id === questionId) ?? false;
}
