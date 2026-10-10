import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Question } from '@/features/questions';
import { api } from '@/shared/api/client';

import type { CreateQuestionInput } from '../types';

export interface Revision {
  id: number;
  kind: 'created' | 'edited' | 'restored' | 'original';
  editorName?: string;
  snapshot: CreateQuestionInput;
  createdAt: string;
  restoredFrom?: number;
}

/** A question in the form's shape, with the wrong-option feedback (admins only). */
export function useQuestionAuthoring(questionId: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'authoring', questionId],
    queryFn: () => api.get<CreateQuestionInput>(`/questions/${questionId}/authoring`),
    enabled,
  });
}

export function useRevisions(questionId: string) {
  return useQuery({
    queryKey: ['admin', 'revisions', questionId],
    queryFn: () => api.get<Revision[]>(`/questions/${questionId}/revisions`),
  });
}

export function useRestoreRevision(questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: number) =>
      api.post<Question>(`/questions/${questionId}/revisions/${revisionId}/restore`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'revisions', questionId] });
      void queryClient.invalidateQueries({ queryKey: ['questions'] });
      void queryClient.invalidateQueries({ queryKey: ['question', questionId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'quality'] });
    },
  });
}

export type QualityFlag =
  'too_easy' | 'too_hard' | 'wrong_key' | 'dead_distractor' | 'open_bug_reports';

export interface QualityItem {
  questionId: string;
  prompt: string;
  type: Question['type'];
  tags: string[];
  answers: number;
  correctRate: number;
  flags: QualityFlag[];
  options?: { id: string; label: string; correct: boolean; picks: number; share: number }[];
  openBugs: number;
}

export interface QualityReport {
  minAnswers: number;
  analysed: number;
  tooFew: number;
  items: QualityItem[];
  flagCounts: Partial<Record<QualityFlag, number>>;
}

export function useQualityReport() {
  return useQuery({
    queryKey: ['admin', 'quality'],
    queryFn: () => api.get<QualityReport>('/admin/quality'),
  });
}

/** Which parts of a question differ between two versions. */
export function changedFields(a: CreateQuestionInput, b: CreateQuestionInput): string[] {
  const same = (x: unknown, y: unknown) => JSON.stringify(x ?? null) === JSON.stringify(y ?? null);
  const answer = (q: CreateQuestionInput) => [
    q.correctOptionId,
    q.correctOptionIds,
    q.correctAnswer,
    q.type === 'ordering' ? q.options?.map((o) => o.id) : undefined,
    q.expectedOutput,
  ];
  const fields: [string, boolean][] = [
    ['type', !same(a.type, b.type)],
    ['prompt', !same(a.prompt, b.prompt)],
    [
      'options',
      !same(
        a.options?.map((o) => o.label),
        b.options?.map((o) => o.label),
      ),
    ],
    ['answer', !same(answer(a), answer(b))],
    ['explanation', !same(a.explanation, b.explanation)],
    ['code', !same([a.code, a.codeLanguage], [b.code, b.codeLanguage])],
    ['tags', !same([...(a.tags ?? [])].sort(), [...(b.tags ?? [])].sort())],
    ['difficulty', !same(a.difficulty, b.difficulty)],
    ['materials', !same(a.relatedMaterialIds ?? [], b.relatedMaterialIds ?? [])],
  ];
  return fields.filter(([, changed]) => changed).map(([name]) => name);
}
