import { ChartColumn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

import { useQuestionStats } from '../../hooks/useQuestionExtras';

interface StatsTabProps {
  questionId: string;
  /** Rows to mark as right: option ids, 'true'/'false', or 'correct'. */
  correctKeys: string[];
}

/**
 * Answer-distribution as a horizontal bar list. Single measure, one hue
 * (--chart-bar, validated for both surfaces); the correct option uses the
 * status green plus a ✓ so identity is never color-alone. Every row carries
 * its % as plain text, which doubles as the table view.
 */
export function StatsTab({ questionId, correctKeys }: StatsTabProps) {
  const { t } = useTranslation();
  const { data: stats, isPending, isError, refetch } = useQuestionStats(questionId);

  if (isPending) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (stats.totalResponses === 0) {
    return <EmptyState title={t('question.stats.empty')} glyph={<ChartColumn size={28} />} />;
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="tok-com">
        {'// '}
        {t('question.stats.total', { count: stats.totalResponses })}
      </span>
      <div className="bar-chart">
        {stats.distribution.map((d) => {
          const correct = correctKeys.includes(d.optionId);
          return (
            <div
              key={d.optionId}
              className={correct ? 'bar-row bar-row--correct' : 'bar-row'}
              title={`${d.count} · ${d.percentage}%`}
            >
              <span className="bar-row__label">{d.label}</span>
              <span className="bar-row__track">
                <span className="bar-row__fill" style={{ width: `${d.percentage}%` }} />
              </span>
              <span className="bar-row__value">
                {correct && '✓ '}
                {d.percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
