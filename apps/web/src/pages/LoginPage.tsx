import { useLocation, useNavigate } from 'react-router-dom';

import { LoginForm } from '@/features/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  return (
    <div className="login-screen">
      <div className="login-card">
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
      </div>
    </div>
  );
}
