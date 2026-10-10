import { useLocation, useNavigate } from 'react-router-dom';

import { AuthLayout, LoginForm } from '@/features/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  return (
    <AuthLayout>
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </AuthLayout>
  );
}
