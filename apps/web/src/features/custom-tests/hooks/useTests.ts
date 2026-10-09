import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AnswerValue } from '@/features/questions';
import { api } from '@/shared/api/client';

import type {
  CreateTestInput,
  CustomTest,
  TestAttempt,
  TestMode,
  TestSubmitResult,
} from '../types';

export function useTests() {
  return useQuery({
    queryKey: ['tests'],
    queryFn: () => api.get<CustomTest[]>('/tests'),
  });
}

export function useTest(id: string | undefined) {
  return useQuery({
    queryKey: ['tests', id],
    queryFn: () => api.get<CustomTest>(`/tests/${id}`),
    enabled: !!id,
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTestInput) => api.post<CustomTest>('/tests', input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tests/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useTestAttempts(testId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['tests', testId, 'attempts'],
    queryFn: () => api.get<TestAttempt[]>(`/tests/${testId}/attempts`),
    enabled: enabled && !!testId,
  });
}

export interface SubmitTestInput {
  mode: TestMode;
  answers: Record<string, AnswerValue>;
  questionIds?: string[];
  startedAt?: string;
}

export function useSubmitTest(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitTestInput) =>
      api.post<TestSubmitResult>(`/tests/${testId}/submit`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests', testId, 'attempts'] });
      void queryClient.invalidateQueries({ queryKey: ['questions', 'weak'] });
      void queryClient.invalidateQueries({ queryKey: ['questionStats'] });
    },
  });
}
