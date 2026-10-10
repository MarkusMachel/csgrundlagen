import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { AuthCard, SignUpForm } from '@/features/auth';

export function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <AuthCard title={t('auth.signUpTitle')}>
      <SignUpForm onSuccess={() => navigate('/', { replace: true })} />
    </AuthCard>
  );
}
