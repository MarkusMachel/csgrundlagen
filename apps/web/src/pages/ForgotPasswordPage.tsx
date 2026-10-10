import { useTranslation } from 'react-i18next';

import { AuthCard, ForgotPasswordForm } from '@/features/auth';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <AuthCard title={t('auth.forgotTitle')}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
