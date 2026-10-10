import { useTranslation } from 'react-i18next';

interface CorrectnessBarProps {
  correct: number;
  incorrect: number;
}

/**
 * A two-segment status bar (good vs. serious — reserved status colors, not
 * categorical slots), with the split spelled out in text since it is only
 * two segments and text is more precise than eyeballing a bar's midpoint.
 */
export function CorrectnessBar({ correct, incorrect }: CorrectnessBarProps) {
  const { t } = useTranslation();
  const total = correct + incorrect;
  const correctPct = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <div className="chart-card">
      <h3>{t('authoring.stats.correctness')}</h3>
      {total === 0 ? (
        <p className="tok-com" style={{ margin: 0 }}>
          {'// '}
          {t('authoring.stats.noAnswersYet')}
        </p>
      ) : (
        <>
          <div
            className="stacked-bar"
            role="img"
            aria-label={t('authoring.stats.correctnessAria', {
              correct,
              incorrect,
              pct: correctPct,
            })}
          >
            <span
              className="stacked-bar__segment stacked-bar__segment--correct"
              style={{ width: `${correctPct}%` }}
            />
            <span
              className="stacked-bar__segment stacked-bar__segment--incorrect"
              style={{ width: `${100 - correctPct}%` }}
            />
          </div>
          <div className="chart-legend">
            <span>
              <span
                className="chart-legend__swatch"
                style={{ background: 'var(--green)' }}
                aria-hidden
              />
              {t('authoring.stats.correct', { count: correct, pct: correctPct })}
            </span>
            <span>
              <span
                className="chart-legend__swatch"
                style={{ background: 'var(--red)' }}
                aria-hidden
              />
              {t('authoring.stats.incorrect', { count: incorrect, pct: 100 - correctPct })}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
