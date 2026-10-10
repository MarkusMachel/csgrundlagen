import { Lock } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { requestSignIn } from '@/stores/useAuthPrompt';
import { useAuthStore } from '@/stores/useAuthStore';

import { SignInPrompt } from './SignInPrompt';

/**
 * Wraps pages that are about the user's own data (progress, tests, ...).
 * Signed out, it shows why and opens the sign-in modal; once signed in the
 * page appears in place.
 */
export function RequireSignIn({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'anonymous') requestSignIn().catch(() => {});
  }, [status]);

  if (status !== 'anonymous') return <>{children}</>;
  return (
    <section className="signin-gate">
      <Lock size={28} aria-hidden className="signin-gate__icon" />
      <h1 style={{ margin: 0 }}>
        <span className="tok-com">{'// '}</span>
        {t('auth.prompt.gateTitle')}
      </h1>
      <p className="muted" style={{ margin: 0 }}>
        {t('auth.prompt.gateBody')}
      </p>
      <SignInPrompt message={t('auth.prompt.gateHint')} />
    </section>
  );
}
