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
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  mode: TestMode;
  answers: Record<string, string | boolean>;
  score: number;
  startedAt: string;
  submittedAt?: string;
}

export interface TestSubmitResultItem {
  questionId: string;
  correct: boolean;
  givenAnswer?: string | boolean;
  correctAnswer: string | boolean;
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
