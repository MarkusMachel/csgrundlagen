import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { PrivacyPolicy, PrivacySettingsButton } from '@/features/privacy';
import { AUTH_TOKEN_KEY } from '@/shared/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

function hasToken() {
  try {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return false;
  }
}

/** Public: readable before signing up and from the consent banner. */
export function PrivacyPage() {
  const { t } = useTranslation();
  // This page sits outside the app shell, which restores the session, so a
  // stored token also counts as signed in.
  const status = useAuthStore((s) => s.status);
  const signedIn = status === 'authenticated' || (status === 'unknown' && hasToken());
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
