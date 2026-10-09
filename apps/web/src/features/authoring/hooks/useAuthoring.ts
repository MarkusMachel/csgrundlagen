import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MaterialItem } from '@/features/materials';
import type { Question } from '@/features/questions';
import { api } from '@/shared/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

import type { AdminStats } from '../statsTypes';
import type { CreateMaterialInput, CreateQuestionInput } from '../types';

/** Whether the current user may author content. The mock API enforces it too (403). */
export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.role === 'admin');
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionInput) => api.post<Question>('/questions', input),
    onSuccess: (_question, input) => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] });
      void queryClient.invalidateQueries({ queryKey: ['tags'] });
      void queryClient.invalidateQueries({ queryKey: ['search'] });
      void queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      if (input.relatedMaterialIds?.length) {
        void queryClient.invalidateQueries({ queryKey: ['questionMaterials'] });
      }
    },
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMaterialInput) => api.post<MaterialItem>('/materials', input),
    onSuccess: (_material, input) => {
      void queryClient.invalidateQueries({ queryKey: ['materials'] });
      void queryClient.invalidateQueries({ queryKey: ['search'] });
      void queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      if (input.relatedQuestionIds?.length) {
        void queryClient.invalidateQueries({ queryKey: ['questionMaterials'] });
      }
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
  });
}
