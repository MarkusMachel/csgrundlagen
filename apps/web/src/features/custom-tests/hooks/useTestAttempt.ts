import { create } from 'zustand';

import type { AnswerValue } from '@/features/questions';
import { randomSeed } from '@/shared/utils/shuffle';

import type { TestDraft, TestMode } from '../types';

/**
 * In-progress attempt state (§11) — answers, mode, and the per-attempt shuffle
 * seed. Feature-scoped. The seed is drawn once when the attempt starts, so
 * shuffled question/option order stays stable across re-renders (§9.5).
 */
interface TestAttemptState {
  testId: string | null;
  mode: TestMode | null;
  /** Subset override for "Retry Incorrect Only"; null = whole test. */
  questionIds: string[] | null;
  answers: Record<string, AnswerValue>;
  shuffleSeed: number;
  startedAt: string | null;
  start: (testId: string, mode: TestMode, questionIds?: string[]) => void;
  /** Continues a saved draft: same answers, shuffle order and clock. */
  resume: (testId: string, draft: TestDraft) => void;
  setAnswer: (questionId: string, answer: AnswerValue) => void;
  reset: () => void;
}

export const useTestAttemptStore = create<TestAttemptState>()((set) => ({
  testId: null,
  mode: null,
  questionIds: null,
  answers: {},
  shuffleSeed: 0,
  startedAt: null,
  start: (testId, mode, questionIds) =>
    set({
      testId,
      mode,
      questionIds: questionIds ?? null,
      answers: {},
      shuffleSeed: randomSeed(),
      startedAt: new Date().toISOString(),
    }),
  resume: (testId, draft) =>
    set({
      testId,
      mode: draft.mode,
      questionIds: draft.questionIds?.length ? draft.questionIds : null,
      answers: draft.answers ?? {},
      shuffleSeed: draft.shuffleSeed,
      startedAt: draft.startedAt,
    }),
  setAnswer: (questionId, answer) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: answer } })),
  reset: () =>
    set({
      testId: null,
      mode: null,
      questionIds: null,
      answers: {},
      shuffleSeed: 0,
      startedAt: null,
    }),
}));
