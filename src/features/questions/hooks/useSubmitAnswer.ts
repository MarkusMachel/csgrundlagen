import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';

import type { AnswerValue, SubmitAnswerResult } from '../types';

export function useSubmitAnswer(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answer: AnswerValue) =>
      api.post<SubmitAnswerResult>(`/questions/${questionId}/submit`, { answer }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questionStats', questionId] });
      void queryClient.invalidateQueries({ queryKey: ['questions', 'weak'] });
    },
  });
}
