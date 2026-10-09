import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';

import type { QuestionNote } from '../types';

export function useQuestionNote(questionId: string, enabled = true) {
  return useQuery({
    queryKey: ['questionNote', questionId],
    queryFn: () => api.get<QuestionNote | null>(`/questions/${questionId}/notes`),
    enabled,
  });
}

export function useSaveQuestionNote(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.put<QuestionNote>(`/questions/${questionId}/notes`, { body }),
    onSuccess: (note) => {
      queryClient.setQueryData(['questionNote', questionId], note);
    },
  });
}
