import type { AnswerValue, OptionFeedback } from '@/features/questions/types';

export type TestMode = 'practice' | 'exam';

export interface CustomTest {
  id: string;
  ownerId: string;
  name: string;
  questionIds: string[];
  timed: boolean;
  durationMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  createdAt: string;
  /** An unfinished attempt that can be resumed. */
  draft?: { answered: number; total: number; startedAt: string; updatedAt: string };
}

/** An unfinished attempt as saved on the server. */
export interface TestDraft {
  mode: TestMode;
  questionIds?: string[];
  answers: Record<string, AnswerValue>;
  shuffleSeed: number;
  startedAt: string;
  updatedAt?: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  mode: TestMode;
  answers: Record<string, AnswerValue>;
  score: number;
  startedAt: string;
  submittedAt?: string;
}

export interface TestSubmitResultItem {
  questionId: string;
  correct: boolean;
  givenAnswer?: AnswerValue;
  correctAnswer: AnswerValue;
  feedback?: OptionFeedback[];
}

export interface TestSubmitResult {
  attempt: TestAttempt;
  total: number;
  score: number;
  breakdown: TestSubmitResultItem[];
}

export interface CreateTestInput {
  name: string;
  questionIds: string[];
  timed: boolean;
  durationMinutes?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}
