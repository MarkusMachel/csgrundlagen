import { useTranslation } from 'react-i18next';

export function Spinner({ center = false, label }: { center?: boolean; label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={center ? 'spinner spinner--center' : 'spinner'}
      role="status"
      aria-label={label ?? t('common.loading')}
    />
  );
}
