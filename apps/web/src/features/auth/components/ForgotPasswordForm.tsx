import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { authErrorMessage } from './formErrors';
import { useRequestPasswordReset } from '../hooks/useAuth';

const schema = z.object({ email: z.string().email() });
type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const id = useId();
  const request = useRequestPasswordReset();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  if (request.isSuccess) {
    // Same message whether or not the account exists (no account enumeration).
    return (
      <div className="stack" style={{ gap: 14 }}>
        <div className="alert alert--success" role="status">
          {t('auth.resetSent')}
        </div>
        <Link to="/login">{t('auth.backToLogin')}</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(({ email }) => request.mutate(email))}
      className="stack"
      style={{ gap: 14 }}
      noValidate
    >
      <p className="muted" style={{ margin: 0 }}>
        {t('auth.forgotIntro')}
      </p>
      {request.isError && (
        <div className="alert alert--error" role="alert">
          {authErrorMessage(request.error, t)}
        </div>
      )}
      <div className={form.formState.errors.email ? 'field field--error' : 'field'}>
        <label htmlFor={id}>{t('auth.email')}</label>
        <input
          id={id}
          type="email"
          autoComplete="email"
          className="input"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <span className="field-error-text">{t('auth.emailInvalid')}</span>
        )}
      </div>
      <button type="submit" className="btn btn--primary" disabled={request.isPending}>
        {t('auth.sendResetLink')}
      </button>
      <Link to="/login" style={{ fontSize: 13 }}>
        {t('auth.backToLogin')}
      </Link>
    </form>
  );
}
