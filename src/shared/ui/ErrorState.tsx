import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div className="state-block" role="alert">
      <div className="state-block__glyph tok-red" aria-hidden>
        <TriangleAlert size={28} />
      </div>
      <h3>{title ?? t('common.errorTitle')}</h3>
      {description && <p>{description}</p>}
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
