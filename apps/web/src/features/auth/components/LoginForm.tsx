import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { useLogin } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  /** In the sign-in modal: no page heading, and sign-up switches the modal. */
  compact?: boolean;
  onSwitchToSignUp?: () => void;
}

export function LoginForm({ onSuccess, compact, onSwitchToSignUp }: LoginFormProps) {
  const { t } = useTranslation();
  const ids = { email: useId(), password: useId() };
  const login = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      onSuccess?.();
    } catch {
      // error state rendered from login.isError
    }
  });

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 14 }}>
      {!compact && (
        <div>
          <p className="tok-com" style={{ margin: 0 }}>
            {'// '}
            {t('common.appName').toLowerCase()}
          </p>
          <h1 style={{ margin: 0 }}>
            <span className="tok-kw">$</span> {t('auth.loginTitle').toLowerCase()}
          </h1>
        </div>
      )}
      {login.isError && (
        <div className="alert alert--error" role="alert">
          {t('auth.loginFailed')}
        </div>
      )}
      <div className={form.formState.errors.email ? 'field field--error' : 'field'}>
        <label htmlFor={ids.email}>{t('auth.email')}</label>
        <input
          id={ids.email}
          type="email"
          autoComplete="email"
          className="input"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <span className="field-error-text">{t('auth.emailInvalid')}</span>
        )}
      </div>
      <div className={form.formState.errors.password ? 'field field--error' : 'field'}>
        <label htmlFor={ids.password}>{t('auth.password')}</label>
        <input
          id={ids.password}
          type="password"
          autoComplete="current-password"
          className="input"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <span className="field-error-text">{t('auth.passwordRequired')}</span>
        )}
      </div>
      <button type="submit" className="btn btn--primary" disabled={login.isPending}>
        {t('auth.login')}
      </button>
      <div className="hstack" style={{ justifyContent: 'space-between', fontSize: 13 }}>
        {onSwitchToSignUp ? (
          <button type="button" className="link-button" onClick={onSwitchToSignUp}>
            {t('auth.createAccount')}
          </button>
        ) : (
          <Link to="/signup">{t('auth.createAccount')}</Link>
        )}
        <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
      </div>
      {!compact && (
        <p className="tok-com" style={{ margin: 0, fontSize: 12 }}>
          {'// '}
          {t('auth.hint')}
        </p>
      )}
    </form>
  );
}
