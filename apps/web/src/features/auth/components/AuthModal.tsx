import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@/shared/ui';
import { useAuthPrompt } from '@/stores/useAuthPrompt';

import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';

/**
 * The sign-in modal that requestSignIn() opens. Signing in (or up) here lets
 * the action that asked for it carry on; closing it cancels that action.
 */
export function AuthModal() {
  const { t } = useTranslation();
  const { open, mode, setMode, signedIn, cancel } = useAuthPrompt();

  // Leaving the page (e.g. to reset a password) cancels what was waiting.
  useEffect(() => () => useAuthPrompt.getState().cancel(), []);

  return (
    <Modal
      open={open}
      size="small"
      title={mode === 'login' ? t('auth.prompt.loginTitle') : t('auth.prompt.signUpTitle')}
      onClose={cancel}
    >
      <p className="muted" style={{ marginTop: 0 }}>
        {t('auth.prompt.why')}
      </p>
      {mode === 'login' ? (
        <LoginForm compact onSuccess={signedIn} onSwitchToSignUp={() => setMode('signup')} />
      ) : (
        <SignUpForm onSuccess={signedIn} onSwitchToLogin={() => setMode('login')} />
      )}
    </Modal>
  );
}
