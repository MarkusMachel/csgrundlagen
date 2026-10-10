import { useTranslation } from 'react-i18next';

import { ReviewSession } from '@/features/review';

export function ReviewPage() {
  const { t } = useTranslation();
  return (
    <div className="stack" style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>
          <span className="tok-com">{'// '}</span>
          {t('review.title')}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {t('review.subtitle')}
        </p>
      </div>
      <ReviewSession />
    </div>
  );
}
