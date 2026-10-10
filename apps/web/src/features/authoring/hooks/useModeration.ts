import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CommentReportReason, QuestionComment } from '@/features/questions/types';
import { api } from '@/shared/api/client';

export type ModerationFilter = 'reported' | 'hidden' | 'all';

export interface ModeratedComment extends QuestionComment {
  questionPrompt: string;
  hiddenAt?: string;
  openReports: {
    reason: CommentReportReason;
    note?: string;
    userName: string;
    createdAt: string;
  }[];
}

export function useModerationQueue(filter: ModerationFilter) {
  return useQuery({
    queryKey: ['admin', 'comments', filter],
    queryFn: () =>
      api.get<{ items: ModeratedComment[]; openReports: number }>(
        `/admin/comments?filter=${filter}`,
      ),
  });
}

const invalidate = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
  void queryClient.invalidateQueries({ queryKey: ['questionComments'] });
};

/** Hide/unhide ({ hidden }), or dismiss the open reports (no hidden). */
export function useModerateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden?: boolean }) =>
      api.patch<void>(`/admin/comments/${id}`, hidden === undefined ? {} : { hidden }),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useAdminDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/comments/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
}
