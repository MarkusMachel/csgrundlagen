import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { QuestionCard, type Question } from '@/features/questions';

import type { TestSubmitResult } from '../types';
import { incorrectQuestionIds } from '../utils/scoring';

interface ResultsScreenProps {
  result: TestSubmitResult;
  /** Questions in attempt order, so the breakdown matches what the user saw. */
  questions: Question[];
  onRetryIncorrect: (questionIds: string[]) => void;
  onBackToTests: () => void;
}

export function ResultsScreen({
  result,
  questions,
  onRetryIncorrect,
  onBackToTests,
}: ResultsScreenProps) {
  const { t } = useTranslation();
  const wrongIds = incorrectQuestionIds(result.breakdown);
  const perfect = wrongIds.length === 0;

  return (
    <div className="stack" data-testid="results-screen">
      <div className="card" style={{ textAlign: 'center', padding: 28 }}>
        <p className="tok-com" style={{ marginBottom: 4 }}>
          {'// '}
          {t('takeTest.results').toLowerCase()}
        </p>
        <h2 className={perfect ? 'tok-green' : undefined} style={{ fontSize: '1.4rem' }}>
          {t('takeTest.yourScore', { score: result.score, total: result.total })}
        </h2>
        <div className="hstack" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
          {wrongIds.length > 0 && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onRetryIncorrect(wrongIds)}
            >
              <RotateCcw size={15} aria-hidden />
              {t('takeTest.retryIncorrect')}
            </button>
          )}
          <button type="button" className="btn" onClick={onBackToTests}>
            {t('takeTest.backToTests')}
          </button>
        </div>
      </div>

      <div className="stack">
        {result.breakdown.map((item, index) => {
          const question = questions.find((q) => q.id === item.questionId);
          if (!question) return null;
          return (
            <QuestionCard
              key={item.questionId}
              question={question}
              mode="review"
              reviewGivenAnswer={item.givenAnswer}
              heading={t('takeTest.questionOf', {
                current: index + 1,
                total: result.breakdown.length,
              })}
            />
          );
        })}
      </div>
    </div>
  );
}
