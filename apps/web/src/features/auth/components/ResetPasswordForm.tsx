import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { authErrorMessage } from './formErrors';
import { PasswordField } from './PasswordField';
import { useConfirmPasswordReset } from '../hooks/useAuth';

const schema = z
  .object({ password: z.string().min(8).max(72), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'] });
type Values = z.infer<typeof schema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useTranslation();
  const confirm = useConfirmPasswordReset();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });
  const err = form.formState.errors;

  if (!token) {
    return (
      <div className="stack" style={{ gap: 14 }}>
        <div className="alert alert--error" role="alert">
          {t('auth.resetLinkInvalid')}
        </div>
        <Link to="/forgot-password">{t('auth.requestNewLink')}</Link>
      </div>
    );
  }

  if (confirm.isSuccess) {
    return (
      <div className="stack" style={{ gap: 14 }}>
        <div className="alert alert--success" role="status">
          {t('auth.resetDone')}
        </div>
        <Link to="/login">{t('auth.login')}</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(({ password }) => confirm.mutate({ token, password }))}
      className="stack"
      style={{ gap: 14 }}
      noValidate
    >
      {confirm.isError && (
        <div className="alert alert--error" role="alert">
          {authErrorMessage(confirm.error, t)}{' '}
          <Link to="/forgot-password">{t('auth.requestNewLink')}</Link>
        </div>
      )}
      <PasswordField
        label={t('auth.newPassword')}
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
      <button type="submit" className="btn btn--primary" disabled={confirm.isPending}>
        {t('auth.setPassword')}
      </button>
    </form>
  );
}
