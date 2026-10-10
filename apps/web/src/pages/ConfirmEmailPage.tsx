import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { AuthCard, useConfirmEmailChange } from '@/features/auth';
import { ApiError } from '@/shared/api/client';
import { Spinner } from '@/shared/ui';

/** Opened from the confirmation email; applies the pending email change. */
export function ConfirmEmailPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const confirm = useConfirmEmailChange();
  const sent = useRef(false);

  useEffect(() => {
    // once only, also under React's double effects in development
    if (token && !sent.current) {
      sent.current = true;
      confirm.mutate(token);
    }
  }, [token, confirm]);

  return (
    <AuthCard title={t('account.email.confirmTitle')}>
      {!token || confirm.isError ? (
        <div className="alert alert--error" role="alert">
          {confirm.error instanceof ApiError && confirm.error.status < 500
            ? confirm.error.message
            : t('account.email.invalidLink')}
        </div>
      ) : confirm.isSuccess ? (
        <div className="alert alert--success" role="status">
          {t('account.email.confirmed', { email: confirm.data.email })}
        </div>
      ) : (
        <Spinner center />
      )}
      <p style={{ margin: '14px 0 0', fontSize: 13 }}>
        <Link to="/account">{t('account.email.toAccount')}</Link>
      </p>
    </AuthCard>
  );
}
