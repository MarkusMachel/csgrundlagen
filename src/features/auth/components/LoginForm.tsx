import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useLogin } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
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
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" component="h1">
        {t('auth.loginTitle')}
      </Typography>
      {login.isError && <Alert severity="error">{t('auth.loginFailed')}</Alert>}
      <TextField
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        error={!!form.formState.errors.email}
        helperText={form.formState.errors.email ? t('auth.emailInvalid') : undefined}
        {...form.register('email')}
      />
      <TextField
        label={t('auth.password')}
        type="password"
        autoComplete="current-password"
        error={!!form.formState.errors.password}
        helperText={form.formState.errors.password ? t('auth.passwordRequired') : undefined}
        {...form.register('password')}
      />
      <Button type="submit" variant="contained" size="large" disabled={login.isPending}>
        {t('auth.login')}
      </Button>
      <Typography variant="caption" color="text.secondary">
        {t('auth.hint')}
      </Typography>
    </Box>
  );
}
