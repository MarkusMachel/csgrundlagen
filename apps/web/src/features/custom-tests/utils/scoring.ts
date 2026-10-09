import type { AnswerValue, Question } from '@/features/questions/types';

import type { TestSubmitResultItem } from '../types';

export function correctAnswerOf(question: Question): AnswerValue {
  return question.type === 'multiple-choice' ? question.correctOptionId : question.correctAnswer;
}

export function isAnswerCorrect(question: Question, given: AnswerValue | undefined): boolean {
  if (given === undefined) return false; // unanswered counts as wrong
  return given === correctAnswerOf(question);
}

export interface ScoreResult {
  score: number;
  total: number;
  breakdown: TestSubmitResultItem[];
}

export function scoreAnswers(
  questions: Question[],
  answers: Record<string, AnswerValue>,
): ScoreResult {
  const breakdown = questions.map<TestSubmitResultItem>((q) => {
    const given = answers[q.id];
    return {
      questionId: q.id,
      givenAnswer: given,
      correct: isAnswerCorrect(q, given),
      correctAnswer: correctAnswerOf(q),
    };
  });
  return {
    score: breakdown.filter((b) => b.correct).length,
    total: questions.length,
    breakdown,
  };
}

/** Question ids the user got wrong (or left unanswered) — drives "Retry Incorrect Only". */
export function incorrectQuestionIds(breakdown: TestSubmitResultItem[]): string[] {
  return breakdown.filter((b) => !b.correct).map((b) => b.questionId);
}
