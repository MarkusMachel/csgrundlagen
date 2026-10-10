import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { enqueueAnswer, isNetworkError } from '@/shared/offline/outbox';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

import { correctAnswerOf, isAnswerCorrect } from '../grading';
import type { AnswerValue, Question, SubmitAnswerResult } from '../types';

/**
 * Submits an answer. Offline (the server can't be reached), it is graded on
 * the device instead (questions carry their answer) and queued, to be sent
 * with its original time once the connection is back.
 */
export function useSubmitAnswer(questionId: string, question?: Question) {
  const queryClient = useQueryClient();
  const recordAnswerResult = useUIStore((s) => s.recordAnswerResult);
  return useMutation({
    mutationFn: async (answer: AnswerValue): Promise<SubmitAnswerResult> => {
      const answeredAt = new Date().toISOString();
      try {
        return await api.post<SubmitAnswerResult>(`/questions/${questionId}/submit`, { answer });
      } catch (err) {
        const userId = useAuthStore.getState().user?.id;
        if (!question || !userId || !isNetworkError(err)) throw err;
        await enqueueAnswer({ userId, questionId, answer, answeredAt });
        return {
          questionId,
          correct: isAnswerCorrect(question, answer),
          correctAnswer: correctAnswerOf(question),
          offline: true,
        };
      }
    },
    onSuccess: (result) => {
      recordAnswerResult(result.correct); // feeds the status-bar streak
      if (result.offline) return; // nothing changed on the server yet
      void queryClient.invalidateQueries({ queryKey: ['questionStats', questionId] });
      void queryClient.invalidateQueries({ queryKey: ['questions', 'weak'] });
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
      void queryClient.invalidateQueries({ queryKey: ['reviewSummary'] });
    },
  });
}
