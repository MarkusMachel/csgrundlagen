import { useTranslation } from 'react-i18next';

import { ChangePasswordForm } from '@/features/auth';
import { MyDevices } from '@/features/devices';
import { useAuthStore } from '@/stores/useAuthStore';

export function AccountPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  return (
    <div className="stack" style={{ gap: 24 }}>
      <h1>
        <span className="tok-com">{'// '}</span>
        {t('account.title')}
      </h1>
      {user && (
        <section className="card stack" style={{ gap: 4 }}>
          <span style={{ fontWeight: 600 }}>{user.name}</span>
          <span className="muted">{user.email}</span>
          <span className="tok-com" style={{ fontSize: 12 }}>
            {'// '}
            {t(`account.role.${user.role}`)}
          </span>
        </section>
      )}
      <section className="stack" style={{ gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t('auth.changePassword')}</h2>
        <ChangePasswordForm />
      </section>
      <section className="stack" style={{ gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{t('devices.title')}</h2>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            {t('devices.intro')}
          </p>
        </div>
        <MyDevices />
      </section>
    </div>
  );
}
