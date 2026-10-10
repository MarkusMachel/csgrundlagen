import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useUIStore } from '@/stores/useUIStore';

import type { Question, QuestionsPage } from '../types';

export type Difficulty = NonNullable<Question['difficulty']>;
/** Per-user filters; the API ignores them for anonymous callers. */
export type QuestionStatus = 'unanswered' | 'answered' | 'wrong' | 'bookmarked';
export type QuestionSort = 'oldest' | 'newest' | 'random';

export interface QuestionsFilter {
  page?: number;
  pageSize?: number;
  /** Fetch exactly these questions, in this order (e.g. a test's). */
  ids?: string[];
  /** Match any of these tags. */
  tags?: string[];
  /** Match any of these difficulties. */
  difficulties?: Difficulty[];
  status?: QuestionStatus | '';
  search?: string;
  sort?: QuestionSort;
  /** Keeps the 'random' order stable while paging. */
  seed?: string;
}

export function useQuestions(filter: QuestionsFilter = {}) {
  const locale = useUIStore((s) => s.locale);
  const {
    page = 1,
    pageSize = 10,
    ids,
    tags = [],
    difficulties = [],
    status = '',
    search = '',
    sort = 'oldest',
    seed = '',
  } = filter;
  return useQuery({
    queryKey: [
      'questions',
      { page, pageSize, ids, tags, difficulties, status, search, sort, seed, locale },
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        locale,
      });
      if (ids) params.set('ids', ids.join(','));
      if (search) params.set('search', search);
      tags.forEach((t) => params.append('tags', t));
      difficulties.forEach((d) => params.append('difficulty', d));
      if (status) params.set('status', status);
      if (sort !== 'oldest') params.set('sort', sort);
      if (sort === 'random' && seed) params.set('seed', seed);
      return api.get<QuestionsPage>(`/questions?${params}`);
    },
    placeholderData: keepPreviousData,
    enabled: ids === undefined || ids.length > 0,
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
