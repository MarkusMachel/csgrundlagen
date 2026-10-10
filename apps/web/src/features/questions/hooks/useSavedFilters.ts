import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useSignedIn } from '@/stores/useAuthStore';

import type { FilterState } from '../components/QuestionFilters';
import type { SavedFilter } from '../types';

const KEY = ['savedFilters'];

export function useSavedFilters() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<SavedFilter[]>('/me/filters'),
    enabled: useSignedIn(),
  });
}

export function useSaveFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; filters: FilterState }) =>
      api.post<SavedFilter>('/me/filters', body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/me/filters/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}
