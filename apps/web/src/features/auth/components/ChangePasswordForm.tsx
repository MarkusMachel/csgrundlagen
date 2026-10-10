import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { authErrorMessage } from './formErrors';
import { PasswordField } from './PasswordField';
import { useChangePassword } from '../hooks/useAuth';

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'] });
type Values = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const change = useChangePassword();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });
  const err = form.formState.errors;

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await change.mutateAsync({ currentPassword, newPassword });
      form.reset();
    } catch {
      // rendered from change.error
    }
  });

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 14, maxWidth: 420 }} noValidate>
      {change.isSuccess && (
        <div className="alert alert--success" role="status">
          {t('auth.passwordChanged')}
        </div>
      )}
      {change.isError && (
        <div className="alert alert--error" role="alert">
          {authErrorMessage(change.error, t)}
        </div>
      )}
      <PasswordField
        label={t('auth.currentPassword')}
        autoComplete="current-password"
        error={err.currentPassword && t('auth.passwordRequired')}
        {...form.register('currentPassword')}
      />
      <PasswordField
        label={t('auth.newPassword')}
        autoComplete="new-password"
        error={err.newPassword && t('auth.passwordRules')}
        {...form.register('newPassword')}
      />
      <PasswordField
        label={t('auth.confirmPassword')}
        autoComplete="new-password"
        error={err.confirm && t('auth.passwordsDiffer')}
        {...form.register('confirm')}
      />
      <button
        type="submit"
        className="btn btn--primary"
        style={{ alignSelf: 'flex-start' }}
        disabled={change.isPending}
      >
        {t('auth.changePassword')}
      </button>
    </form>
  );
}
