import { BarChart3, ListChecks, Repeat, Sparkles, X } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useProgress } from '@/features/progress';
import { useUIStore } from '@/stores/useUIStore';

/**
 * Getting started, for users who haven't answered anything yet. Whether to
 * show it is decided when Home loads, so answering the first question
 * doesn't make the page jump; it's gone on the next visit.
 */
export function WelcomePanel({ onPickTopic }: { onPickTopic: (tag: string) => void }) {
  const { t } = useTranslation();
  const progress = useProgress();
  const hidden = useUIStore((s) => s.welcomeHidden);
  const hide = useUIStore((s) => s.hideWelcome);

  const decided = useRef<boolean | null>(null);
  if (decided.current === null && progress.data)
    decided.current = progress.data.totals.answers === 0;
  if (!decided.current || hidden || !progress.data) return null;

  const topics = [...progress.data.byTag].sort((a, b) => b.questions - a.questions).slice(0, 8);

  return (
    <section className="welcome card" aria-labelledby="welcome-title" data-testid="welcome-panel">
      <div className="welcome__head">
        <h2 id="welcome-title" className="welcome__title">
          <Sparkles size={18} aria-hidden />
          {t('onboarding.title')}
        </h2>
        <button
          type="button"
          className="btn btn--icon"
          aria-label={t('onboarding.hide')}
          title={t('onboarding.hide')}
          onClick={hide}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
      <p className="muted welcome__intro">
        {t('onboarding.intro', { count: progress.data.totals.questions })}
      </p>
      <ol className="welcome__steps">
        <li>
          <span className="welcome__step-title">{t('onboarding.step1.title')}</span>
          <span className="muted">{t('onboarding.step1.text')}</span>
          <div className="filters__group" style={{ marginTop: 6 }}>
            {topics.map((topic) => (
              <button
                key={topic.tag}
                type="button"
                className="toggle-chip"
                aria-pressed={false}
                onClick={() => onPickTopic(topic.tag)}
              >
                {topic.tag} <span className="muted">· {topic.questions}</span>
              </button>
            ))}
          </div>
        </li>
        <li>
          <span className="welcome__step-title">
            <Repeat size={14} aria-hidden /> {t('onboarding.step2.title')}
          </span>
          <span className="muted">
            {t('onboarding.step2.text')} <Link to="/review">review.cs</Link>
          </span>
        </li>
        <li>
          <span className="welcome__step-title">
            <BarChart3 size={14} aria-hidden /> {t('onboarding.step3.title')}
          </span>
          <span className="muted">
            {t('onboarding.step3.text')} <Link to="/progress">progress.cs</Link> ·{' '}
            <Link to="/build">
              <ListChecks size={13} aria-hidden style={{ verticalAlign: '-2px' }} /> build_test.cs
            </Link>
          </span>
        </li>
      </ol>
    </section>
  );
}
