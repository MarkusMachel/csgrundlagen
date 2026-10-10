import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { requestSignIn } from '@/stores/useAuthPrompt';

/** Inline "sign in to use this" for parts of a page that need an account. */
export function SignInPrompt({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <div className="signin-prompt">
      <p className="tok-com" style={{ margin: 0 }}>
        {'// '}
        {message ?? t('auth.prompt.inline')}
      </p>
      <div className="hstack" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn btn--primary btn--small"
          onClick={() => requestSignIn().catch(() => {})}
        >
          <LogIn size={14} aria-hidden /> {t('auth.login')}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => requestSignIn('signup').catch(() => {})}
        >
          {t('auth.createAccount')}
        </button>
      </div>
    </div>
  );
}
