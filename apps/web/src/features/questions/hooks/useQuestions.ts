import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useUIStore } from '@/stores/useUIStore';

import type { Question, QuestionsPage } from '../types';

export interface QuestionsFilter {
  page?: number;
  pageSize?: number;
  tags?: string[];
  search?: string;
}

export function useQuestions(filter: QuestionsFilter = {}) {
  const locale = useUIStore((s) => s.locale);
  const { page = 1, pageSize = 10, tags = [], search = '' } = filter;
  return useQuery({
    queryKey: ['questions', { page, pageSize, tags, search, locale }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        locale,
      });
      if (search) params.set('search', search);
      tags.forEach((t) => params.append('tags', t));
      return api.get<QuestionsPage>(`/questions?${params}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useDailyQuestion() {
  const locale = useUIStore((s) => s.locale);
  return useQuery({
    queryKey: ['questions', 'daily', locale],
    queryFn: () => api.get<Question>(`/questions/daily?locale=${locale}`),
  });
}

export function useQuestion(id: string | undefined) {
  const locale = useUIStore((s) => s.locale);
  return useQuery({
    queryKey: ['questions', 'byId', id, locale],
    queryFn: () => api.get<Question>(`/questions/${id}?locale=${locale}`),
    enabled: !!id,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<string[]>('/tags'),
    staleTime: Infinity,
  });
}

export function useWeakQuestions() {
  const locale = useUIStore((s) => s.locale);
  return useQuery({
    queryKey: ['questions', 'weak', locale],
    queryFn: () => api.get<Question[]>(`/questions/weak?locale=${locale}`),
  });
}
