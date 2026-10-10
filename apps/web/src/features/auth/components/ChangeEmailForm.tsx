import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/stores/useAuthStore';

import { authErrorMessage } from './formErrors';
import { PasswordField } from './PasswordField';
import { useRequestEmailChange } from '../hooks/useAuth';

/** Asks for the new address and the password; the change waits for the emailed link. */
export function ChangeEmailForm() {
  const { t } = useTranslation();
  const emailId = useId();
  const current = useAuthStore((s) => s.user?.email);
  const request = useRequestEmailChange();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (request.isSuccess) {
    return (
      <div className="stack" style={{ gap: 10, maxWidth: 420 }}>
        <div className="alert alert--info" role="status">
          {t('account.email.sent', { email: request.data.email })}
        </div>
        <div>
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() => request.reset()}
          >
            {t('account.email.again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="stack"
      style={{ gap: 14, maxWidth: 420 }}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        request.mutate(
          { email, password },
          {
            onSuccess: () => {
              setEmail('');
              setPassword('');
            },
          },
        );
      }}
    >
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {t('account.email.current', { email: current })}
      </p>
      {request.isError && (
        <div className="alert alert--error" role="alert">
          {authErrorMessage(request.error, t)}
        </div>
      )}
      <div className="field">
        <label htmlFor={emailId}>{t('account.email.new')}</label>
        <input
          id={emailId}
          type="email"
          className="input"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <PasswordField
        label={t('account.email.password')}
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div>
        <button
          type="submit"
          className="btn"
          disabled={!email.includes('@') || !password || request.isPending}
        >
          {t('account.email.send')}
        </button>
      </div>
    </form>
  );
}
