import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { useUIStore } from '@/stores/useUIStore';

import { authErrorMessage } from './formErrors';
import { PasswordField } from './PasswordField';
import { useSignUp } from '../hooks/useAuth';

const schema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'] });
type Values = z.infer<typeof schema>;

export function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const ids = { name: useId(), email: useId() };
  const locale = useUIStore((s) => s.locale);
  const signUp = useSignUp();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });
  const err = form.formState.errors;

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    try {
      await signUp.mutateAsync({ name, email, password, locale });
      onSuccess?.();
    } catch {
      // rendered from signUp.error
    }
  });

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 14 }} noValidate>
      {signUp.isError && (
        <div className="alert alert--error" role="alert">
          {authErrorMessage(signUp.error, t)}
        </div>
      )}
      <div className={err.name ? 'field field--error' : 'field'}>
        <label htmlFor={ids.name}>{t('auth.name')}</label>
        <input id={ids.name} autoComplete="name" className="input" {...form.register('name')} />
        {err.name && <span className="field-error-text">{t('auth.nameRequired')}</span>}
      </div>
      <div className={err.email ? 'field field--error' : 'field'}>
        <label htmlFor={ids.email}>{t('auth.email')}</label>
        <input
          id={ids.email}
          type="email"
          autoComplete="email"
          className="input"
          {...form.register('email')}
        />
        {err.email && <span className="field-error-text">{t('auth.emailInvalid')}</span>}
      </div>
      <PasswordField
        label={t('auth.password')}
        autoComplete="new-password"
        error={err.password && t('auth.passwordRules')}
        {...form.register('password')}
      />
      <PasswordField
        label={t('auth.confirmPassword')}
        autoComplete="new-password"
        error={err.confirm && t('auth.passwordsDiffer')}
        {...form.register('confirm')}
      />
      <button type="submit" className="btn btn--primary" disabled={signUp.isPending}>
        {t('auth.signUp')}
      </button>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
      </p>
    </form>
  );
}
