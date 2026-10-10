import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/** Centered card used by the signed-out screens (sign-up, password reset). */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="login-screen">
      <div className="login-card stack" style={{ gap: 14 }}>
        <div>
          <p className="tok-com" style={{ margin: 0 }}>
            {'// '}
            {t('common.appName').toLowerCase()}
          </p>
          <h1 style={{ margin: 0 }}>
            <span className="tok-kw">$</span> {title.toLowerCase()}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
