import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { Modal, Spinner } from '@/shared/ui';
import { useAuthStore } from '@/stores/useAuthStore';

import { PRIVACY_POLICY_VERSION } from '../consent';
// The policy text (three languages) loads only when someone opens it.
const PrivacyPolicy = lazy(() =>
  import('./PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })),
);
import { useAcceptPolicy } from '../hooks/usePrivacy';

/**
 * Shown once to signed-in users who haven't read the current privacy policy
 * (accounts created by an admin, or after the policy changed).
 */
export function PolicyUpdateModal() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  const accept = useAcceptPolicy();
  const [reading, setReading] = useState(false);

  const needed =
    !!user && user.privacyVersion !== PRIVACY_POLICY_VERSION && pathname !== '/privacy';
  return (
    <Modal
      open={needed}
      title={user?.privacyVersion ? t('privacy.update.titleChanged') : t('privacy.update.titleNew')}
      footer={
        <>
          {!reading && (
            <button type="button" className="btn btn--ghost" onClick={() => setReading(true)}>
              {t('privacy.update.read')}
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary"
            disabled={accept.isPending}
            onClick={() => accept.mutate()}
          >
            {t('privacy.update.ok')}
          </button>
        </>
      }
    >
      <p style={{ marginTop: 0 }}>{t('privacy.update.text')}</p>
      {accept.isError && (
        <div className="alert alert--error" role="alert">
          {t('common.errorTitle')}
        </div>
      )}
      {reading && (
        <div className="modal__scroll">
          <Suspense fallback={<Spinner />}>
            <PrivacyPolicy />
          </Suspense>
        </div>
      )}
    </Modal>
  );
}
