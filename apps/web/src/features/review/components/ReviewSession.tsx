import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CalendarCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { QuestionCard, type SubmitAnswerResult } from '@/features/questions';
import { ErrorState, Spinner } from '@/shared/ui';

import { useReviewQueue } from '../hooks/useReview';

const NEW_PER_SESSION = 10;

/**
 * Works through due reviews one card at a time. Each answer reschedules the
 * question on the server (SM-2); when nothing is due the user can start
 * learning new questions instead.
 */
export function ReviewSession() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newCount, setNewCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<SubmitAnswerResult[]>([]);
  const queue = useReviewQueue(newCount);

  const restart = (withNew: number) => {
    setIndex(0);
    setResults([]);
    setNewCount(withNew);
    void queryClient.invalidateQueries({ queryKey: ['reviewQueue'] });
  };

  if (queue.isPending) return <Spinner center />;
  if (queue.isError) return <ErrorState onRetry={() => void queue.refetch()} />;

  const items = queue.data.items;
  const answered = results.length;
  const current = items[index];

  if (items.length === 0) {
    return (
      <div className="review-empty card">
        <CalendarCheck size={28} aria-hidden className="tok-kw" />
        <h2 style={{ margin: 0 }}>{t('review.allDone')}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {t('review.allDoneHint')}
        </p>
        <button type="button" className="btn btn--primary" onClick={() => restart(NEW_PER_SESSION)}>
          <Sparkles size={15} aria-hidden />
          {t('review.learnNew', { count: NEW_PER_SESSION })}
        </button>
      </div>
    );
  }

  if (!current) {
    const correct = results.filter((r) => r.correct).length;
    return (
      <div className="review-empty card">
        <CalendarCheck size={28} aria-hidden className="tok-kw" />
        <h2 style={{ margin: 0 }}>{t('review.sessionDone')}</h2>
        <p style={{ margin: 0 }}>{t('review.sessionScore', { correct, total: answered })}</p>
        <div className="hstack" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" className="btn btn--primary" onClick={() => restart(0)}>
            {t('review.checkAgain')}
          </button>
          <button type="button" className="btn" onClick={() => restart(NEW_PER_SESSION)}>
            <Sparkles size={15} aria-hidden />
            {t('review.learnNew', { count: NEW_PER_SESSION })}
          </button>
          <Link to="/progress" className="btn btn--ghost">
            {t('review.seeProgress')}
          </Link>
        </div>
      </div>
    );
  }

  const isNew = index >= items.length - queue.data.new;
  const answeredCurrent = answered > index;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="review-progress">
        <span>
          {t('review.position', { n: index + 1, total: items.length })}
          {isNew && <span className="review-badge">{t('review.new')}</span>}
        </span>
        <div
          className="review-progress__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={answered}
          aria-label={t('review.progressLabel')}
        >
          <span style={{ width: `${(answered / items.length) * 100}%` }} />
        </div>
      </div>

      <QuestionCard
        key={current.id}
        question={current}
        mode="feed"
        onAnswered={(r) => setResults((rs) => [...rs, r])}
      />

      {answeredCurrent && (
        <button
          type="button"
          className="btn btn--primary"
          style={{ alignSelf: 'flex-end' }}
          onClick={() => setIndex((i) => i + 1)}
          autoFocus
        >
          {index + 1 < items.length ? t('review.next') : t('review.finish')}
          <ArrowRight size={15} aria-hidden />
        </button>
      )}
    </div>
  );
}
