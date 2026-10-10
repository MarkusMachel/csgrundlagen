import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useUIStore } from '@/stores/useUIStore';

import type { AnswerValue, SubmitAnswerResult } from '../types';

export function useSubmitAnswer(questionId: string) {
  const queryClient = useQueryClient();
  const recordAnswerResult = useUIStore((s) => s.recordAnswerResult);
  return useMutation({
    mutationFn: (answer: AnswerValue) =>
      api.post<SubmitAnswerResult>(`/questions/${questionId}/submit`, { answer }),
    onSuccess: (result) => {
      recordAnswerResult(result.correct); // feeds the status-bar streak
      void queryClient.invalidateQueries({ queryKey: ['questionStats', questionId] });
      void queryClient.invalidateQueries({ queryKey: ['questions', 'weak'] });
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
      void queryClient.invalidateQueries({ queryKey: ['reviewSummary'] });
    },
  });
}
