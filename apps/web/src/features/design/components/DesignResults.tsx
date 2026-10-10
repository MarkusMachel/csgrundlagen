import { BookOpen, CircleCheck, CircleX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { MaterialItem } from '@/features/materials';
import type { DesignQuestion, DesignResult, DesignRule } from '@/features/questions';

/** How a checked design did: requirement by requirement, then good practice. */
export function DesignResults({
  question,
  result,
  materials,
}: {
  question: DesignQuestion;
  result: DesignResult;
  materials: MaterialItem[];
}) {
  const { t } = useTranslation();
  const passed = (r: DesignRule) => result.rules.find((x) => x.id === r.id)?.passed ?? false;
  const { requirements, rules } = question.design;
  const groups = [
    ...requirements.map((req) => ({
      key: req.id,
      title: req.text,
      rules: rules.filter((r) => r.requirement === req.id),
    })),
    {
      key: '_practice',
      title: t('design.results.practice'),
      rules: rules.filter((r) => !r.requirement),
    },
  ].filter((g) => g.rules.length > 0);
  const allPassed = result.score === result.total;

  return (
    <section
      className="design-results"
      aria-labelledby="design-results-title"
      data-testid="design-results"
    >
      <h2 id="design-results-title" className="design-results__title">
        <span className="tok-com">{'// '}</span>
        {t('design.results.title')}
      </h2>
      <p className={allPassed ? 'alert alert--success' : 'alert alert--info'} role="status">
        {allPassed
          ? t('design.results.allPassed')
          : t('design.results.score', { score: result.score, total: result.total })}
      </p>
      {groups.map((g) => (
        <div key={g.key} className="design-results__group">
          <h3 className="design-results__requirement">{g.title}</h3>
          <ul className="design-results__rules">
            {g.rules.map((r) => {
              const ok = passed(r);
              const material = r.materialId && materials.find((m) => m.id === r.materialId);
              return (
                <li
                  key={r.id}
                  className={
                    ok ? 'design-rule design-rule--passed' : 'design-rule design-rule--failed'
                  }
                >
                  {ok ? (
                    <CircleCheck size={17} aria-hidden className="design-rule__icon" />
                  ) : (
                    <CircleX size={17} aria-hidden className="design-rule__icon" />
                  )}
                  <div className="design-rule__body">
                    <span className="design-rule__text">
                      <span className="sr-only">
                        {ok ? t('design.results.passed') : t('design.results.failed')}:{' '}
                      </span>
                      {r.text}
                      {r.optional && (
                        <span className="design-rule__optional">
                          {t('design.results.optional')}
                        </span>
                      )}
                    </span>
                    <span className="design-rule__why">{r.explanation}</span>
                    {!ok && material && (
                      <a
                        className="design-rule__read"
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <BookOpen size={13} aria-hidden /> {material.title}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
