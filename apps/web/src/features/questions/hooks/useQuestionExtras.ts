import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MaterialItem } from '@/features/materials';
import { api } from '@/shared/api/client';

import type { BugReport, QuestionComment, QuestionStats } from '../types';

export function useQuestionComments(questionId: string, enabled = true) {
  return useQuery({
    queryKey: ['questionComments', questionId],
    queryFn: () => api.get<QuestionComment[]>(`/questions/${questionId}/comments`),
    enabled,
  });
}

export function useAddComment(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<QuestionComment>(`/questions/${questionId}/comments`, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questionComments', questionId] });
    },
  });
}

export function useQuestionStats(questionId: string, enabled = true) {
  return useQuery({
    queryKey: ['questionStats', questionId],
    queryFn: () => api.get<QuestionStats>(`/questions/${questionId}/stats`),
    enabled,
  });
}

export function useQuestionMaterials(questionId: string, enabled = true) {
  return useQuery({
    queryKey: ['questionMaterials', questionId],
    queryFn: () => api.get<MaterialItem[]>(`/questions/${questionId}/materials`),
    enabled,
  });
}

export function useReportBug(questionId: string) {
  return useMutation({
    mutationFn: (message: string) =>
      api.post<BugReport>(`/questions/${questionId}/bug-reports`, { message }),
  });
}
