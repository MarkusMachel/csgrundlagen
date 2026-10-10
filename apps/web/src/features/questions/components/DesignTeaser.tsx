import { Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { DesignQuestion } from '../types';

/** A design challenge in a list of questions: the brief and a way to the board. */
export function DesignTeaser({ question }: { question: DesignQuestion }) {
  const { t } = useTranslation();
  return (
    <div className="design-teaser">
      <ul className="design-teaser__requirements">
        {question.design.requirements.map((r) => (
          <li key={r.id}>{r.text}</li>
        ))}
      </ul>
      <Link to={`/design/${question.id}`} className="btn btn--primary btn--small">
        <Network size={14} aria-hidden /> {t('design.openBoard')}
      </Link>
    </div>
  );
}
