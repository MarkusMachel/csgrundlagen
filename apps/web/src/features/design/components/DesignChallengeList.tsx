import { ChevronRight, Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, Spinner } from '@/shared/ui';

import { useDesignChallenges } from '../hooks';

/** The challenges to pick from. */
export function DesignChallengeList() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useDesignChallenges();

  return (
    <section className="design-list">
      <h1 style={{ margin: 0 }}>
        <span className="tok-com">{'// '}</span>
        {t('design.title')}
      </h1>
      <p className="muted" style={{ marginTop: 4 }}>
        {t('design.intro')}
      </p>
      {isPending ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title={t('design.none')} />
      ) : (
        <ul className="design-list__items">
          {data.map((q) => (
            <li key={q.id}>
              <Link to={`/design/${q.id}`} className="design-card">
                <Network size={20} aria-hidden className="design-card__icon" />
                <div className="design-card__body">
                  <span className="design-card__title">{q.prompt}</span>
                  <span className="design-card__meta">
                    {q.difficulty && t(`question.difficulty.${q.difficulty}`)}
                    {' · '}
                    {t('design.requirementCount', { count: q.design.requirements.length })}
                  </span>
                </div>
                <ChevronRight size={18} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
