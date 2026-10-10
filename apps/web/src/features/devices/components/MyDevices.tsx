import { useTranslation } from 'react-i18next';

import { useLogout } from '@/features/auth/hooks/useAuth';
import { ErrorState, Spinner } from '@/shared/ui';

import { DeviceList } from './DeviceList';
import { useMySessions, useRevokeMySession } from '../hooks/useDevices';

/** Account page: where you're signed in, with sign-out per device. */
export function MyDevices() {
  const { t } = useTranslation();
  const sessions = useMySessions();
  const revoke = useRevokeMySession();
  const logout = useLogout();

  if (sessions.isPending) return <Spinner center />;
  if (sessions.isError) return <ErrorState onRetry={() => void sessions.refetch()} />;

  const others = sessions.data.filter((s) => !s.current);
  return (
    <div className="stack" style={{ gap: 10 }}>
      <DeviceList
        sessions={sessions.data}
        revokingId={revoke.isPending ? revoke.variables : undefined}
        onRevoke={(s) => (s.current ? logout.mutate() : revoke.mutate(s.id))}
      />
      {others.length > 0 && (
        <div>
          <button
            type="button"
            className="btn btn--small"
            disabled={revoke.isPending}
            onClick={() => others.forEach((s) => revoke.mutate(s.id))}
          >
            {t('devices.signOutOthers', { count: others.length })}
          </button>
        </div>
      )}
    </div>
  );
}
