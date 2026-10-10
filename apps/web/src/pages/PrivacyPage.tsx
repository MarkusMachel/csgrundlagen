import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { PrivacyPolicy, PrivacySettingsButton } from '@/features/privacy';
import { useAuthStore } from '@/stores/useAuthStore';

/** Public: readable before signing up and from the consent banner. */
export function PrivacyPage() {
  const { t } = useTranslation();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  return (
    <div className="policy-screen">
      <div className="policy-card">
        <Link to={signedIn ? '/account' : '/login'} className="btn btn--small btn--ghost">
          <ArrowLeft size={14} aria-hidden />
          {signedIn ? t('privacy.page.backAccount') : t('privacy.page.backLogin')}
        </Link>
        <h1>
          <span className="tok-com">{'// '}</span>
          {t('privacy.page.title')}
        </h1>
        <PrivacyPolicy />
        <PrivacySettingsButton className="btn" />
      </div>
    </div>
  );
}
