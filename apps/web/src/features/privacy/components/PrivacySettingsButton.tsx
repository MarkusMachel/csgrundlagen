import { useTranslation } from 'react-i18next';

import { useConsentStore } from '../consent';

/** Reopens the consent dialog, so consent can be withdrawn as easily as given. */
export function PrivacySettingsButton({ className = 'linklike' }: { className?: string }) {
  const { t } = useTranslation();
  const open = useConsentStore((s) => s.openSettings);
  return (
    <button type="button" className={className} onClick={open}>
      {t('privacy.settings.open')}
    </button>
  );
}
