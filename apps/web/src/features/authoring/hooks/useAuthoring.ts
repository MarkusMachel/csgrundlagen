import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MaterialItem } from '@/features/materials';
import type { Question } from '@/features/questions';
import { api } from '@/shared/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

import type { AdminStats } from '../statsTypes';
import type { AdminBugReport, BugStatus, CreateMaterialInput, CreateQuestionInput } from '../types';

/** Whether the current user may author content. The mock API enforces it too (403). */
export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.role === 'admin');
}

/** Everything that shows question or material content; refetched after any edit. */
const CONTENT_KEYS = [
  'questions',
  'tags',
  'search',
  'adminStats',
  'materials',
  'questionMaterials',
  'bugReports',
  'tests',
];

function useInvalidateContent() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of CONTENT_KEYS) void queryClient.invalidateQueries({ queryKey: [key] });
  };
}

export function useCreateQuestion() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (input: CreateQuestionInput) => api.post<Question>('/questions', input),
    onSuccess: invalidate,
  });
}

export function useUpdateQuestion() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateQuestionInput }) =>
      api.put<Question>(`/questions/${id}`, input),
    onSuccess: invalidate,
  });
}

/** Deletes a question with everything attached to it (answers, notes, reports). */
export function useDeleteQuestion() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/questions/${id}`),
    onSuccess: invalidate,
  });
}

export function useCreateMaterial() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (input: CreateMaterialInput) => api.post<MaterialItem>('/materials', input),
    onSuccess: invalidate,
  });
}

export function useUpdateMaterial() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateMaterialInput }) =>
      api.put<MaterialItem>(`/materials/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMaterial() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/materials/${id}`),
    onSuccess: invalidate,
  });
}

/** Admin bug-report queue; status '' lists every report. */
export function useBugReports(status: BugStatus | '') {
  return useQuery({
    queryKey: ['bugReports', status],
    queryFn: () =>
      api.get<AdminBugReport[]>(`/admin/bug-reports${status ? `?status=${status}` : ''}`),
  });
}

export function useSetBugReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BugStatus }) =>
      api.patch<AdminBugReport>(`/admin/bug-reports/${id}`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bugReports'] });
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
  });
}
