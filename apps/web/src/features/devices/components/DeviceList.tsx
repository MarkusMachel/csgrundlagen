import { useTranslation } from 'react-i18next';

import { formatRelative } from '@/shared/utils/relativeTime';

import type { ClientInfo, DeviceSession } from '../types';
import { DeviceIcon } from './DeviceIcon';

interface DeviceListProps {
  sessions: DeviceSession[];
  /** Shows a sign-out button per session when given. */
  onRevoke?: (session: DeviceSession) => void;
  revokingId?: string;
}

/** Signed-in devices, newest activity first; shared by Account and admin. */
export function DeviceList({ sessions, onRevoke, revokingId }: DeviceListProps) {
  const { t, i18n } = useTranslation();
  const date = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <ul className="admin-list device-list">
      {sessions.map((s) => (
        <li key={s.id} className="admin-list__row admin-list__row--top">
          <span className="device-list__icon">
            <DeviceIcon device={s.device} size={18} />
          </span>
          <div className="admin-list__main">
            <span className="admin-list__title">
              {t('devices.browserOn', { browser: s.browser, os: s.os })}
              {s.current && <span className="chip chip--accent">{t('devices.thisDevice')}</span>}
            </span>
            <span className="admin-list__meta">
              {t('devices.lastActive', { when: formatRelative(s.lastSeenAt, i18n.language) })}
              {s.lastIp && <> · IP {s.lastIp}</>}
              {' · '}
              {t('devices.signedIn', { date: date(s.createdAt) })}
            </span>
            <details className="device-list__details">
              <summary>{t('devices.details')}</summary>
              <dl className="device-facts">
                {facts(s, t).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
          {onRevoke && (
            <div className="admin-list__actions">
              <button
                type="button"
                className="btn btn--small btn--ghost"
                disabled={revokingId === s.id}
                onClick={() => onRevoke(s)}
              >
                {s.current ? t('devices.signOutHere') : t('devices.signOut')}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

type T = (key: string, opts?: Record<string, unknown>) => string;

/** The label/value pairs shown under "Details"; missing values are skipped. */
function facts(s: DeviceSession, t: T): [string, string][] {
  const ci: ClientInfo = s.clientInfo ?? {};
  const rows: [string, string | undefined][] = [
    [t('devices.fact.device'), t(`devices.type.${s.device}`)],
    [t('devices.fact.firstIp'), s.ip],
    [t('devices.fact.lastIp'), s.lastIp],
    [t('devices.fact.timezone'), ci.timezone],
    [t('devices.fact.languages'), ci.languages?.join(', ') || ci.language],
    [t('devices.fact.platform'), ci.platform],
    [
      t('devices.fact.screen'),
      ci.screen && `${ci.screen}${ci.pixelRatio ? ` @${ci.pixelRatio}x` : ''}`,
    ],
    [t('devices.fact.viewport'), ci.viewport],
    [
      t('devices.fact.touch'),
      ci.touch === undefined ? undefined : ci.touch ? t('common.yes') : t('common.no'),
    ],
    [t('devices.fact.colorScheme'), ci.colorScheme],
    [t('devices.fact.expires'), new Date(s.expiresAt).toLocaleDateString()],
    [t('devices.fact.userAgent'), s.userAgent],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]);
}
