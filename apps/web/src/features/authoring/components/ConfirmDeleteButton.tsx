import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmDeleteButtonProps {
  /** What is being deleted, for the accessible name ("Delete question …"). */
  label: string;
  onConfirm: () => void;
  pending?: boolean;
}

/** Two-step delete: the first click asks, the second one deletes. */
export function ConfirmDeleteButton({ label, onConfirm, pending }: ConfirmDeleteButtonProps) {
  const { t } = useTranslation();
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button
        type="button"
        className="btn btn--small btn--ghost btn--danger"
        aria-label={t('authoring.deleteLabel', { label })}
        onClick={() => setAsking(true)}
      >
        <Trash2 size={14} aria-hidden />
        {t('authoring.delete')}
      </button>
    );
  }
  return (
    <span className="hstack" style={{ gap: 6 }}>
      <button
        type="button"
        className="btn btn--small btn--danger"
        disabled={pending}
        onClick={onConfirm}
      >
        {t('authoring.confirmDelete')}
      </button>
      <button type="button" className="btn btn--small btn--ghost" onClick={() => setAsking(false)}>
        {t('common.cancel')}
      </button>
    </span>
  );
}
