import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useSignedIn } from '@/stores/useAuthStore';

import type { QuestionNote } from '../types';

export function useQuestionNote(questionId: string, enabled = true) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: ['questionNote', questionId],
    queryFn: () => api.get<QuestionNote | null>(`/questions/${questionId}/notes`),
    enabled: enabled && signedIn,
  });
}

export function useSaveQuestionNote(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.put<QuestionNote>(`/questions/${questionId}/notes`, { body }),
    onSuccess: (note) => {
      queryClient.setQueryData(['questionNote', questionId], note);
    },
  });
}
