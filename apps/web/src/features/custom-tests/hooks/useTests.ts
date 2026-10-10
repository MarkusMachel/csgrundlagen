import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AnswerValue } from '@/features/questions';
import { api } from '@/shared/api/client';

import type {
  CreateTestInput,
  CustomTest,
  TestAttempt,
  TestDraft,
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
      void queryClient.invalidateQueries({ queryKey: ['tests'] }); // attempts + draft summary
      void queryClient.invalidateQueries({ queryKey: ['questions', 'weak'] });
      void queryClient.invalidateQueries({ queryKey: ['questionStats'] });
    },
  });
}

/** The unfinished attempt for a test, or null. */
export function useTestDraft(testId: string) {
  return useQuery({
    queryKey: ['tests', testId, 'draft'],
    queryFn: () => api.get<TestDraft | null>(`/tests/${testId}/draft`),
    staleTime: 0,
  });
}

export function useSaveDraft(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: TestDraft) => api.put<void>(`/tests/${testId}/draft`, draft),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tests'], exact: true }),
  });
}

export function useDiscardDraft(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>(`/tests/${testId}/draft`),
    onSuccess: () => {
      queryClient.setQueryData(['tests', testId, 'draft'], null);
      void queryClient.invalidateQueries({ queryKey: ['tests'], exact: true });
    },
  });
}
