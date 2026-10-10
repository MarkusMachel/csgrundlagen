import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { AuthCard, ResetPasswordForm } from '@/features/auth';

/** Landing page for the emailed link: /reset-password?token=… */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  return (
    <AuthCard title={t('auth.resetTitle')}>
      <ResetPasswordForm token={params.get('token') ?? ''} />
    </AuthCard>
  );
}
