import { AlertTriangle, ArrowLeft, Eye } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, Spinner } from '@/shared/ui';
import { formatRelative } from '@/shared/utils/relativeTime';

import { DeviceIcon } from './DeviceIcon';
import { DeviceList } from './DeviceList';
import { useAdminRevokeSession, useAdminUserDetail, useAdminUsers } from '../hooks/useDevices';

/** Admin: every account with its devices, activity and sign-in history. */
export function AdminUsersTab() {
  const { t, i18n } = useTranslation();
  const users = useAdminUsers();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId) return <UserDetail id={openId} onBack={() => setOpenId(null)} />;
  if (users.isPending) return <Spinner center />;
  if (users.isError) return <ErrorState onRetry={() => void users.refetch()} />;

  const q = query.trim().toLowerCase();
  const shown = users.data.filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );

  return (
    <div className="stack" style={{ gap: 12 }}>
      <input
        type="search"
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('devices.admin.search')}
        aria-label={t('devices.admin.search')}
      />
      {shown.length === 0 ? (
        <EmptyState title={t('devices.admin.empty')} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('devices.admin.col.user')}</th>
                <th>{t('devices.admin.col.role')}</th>
                <th>{t('devices.admin.col.lastSeen')}</th>
                <th>{t('devices.admin.col.devices')}</th>
                <th className="num">{t('devices.admin.col.answers')}</th>
                <th>{t('devices.admin.col.joined')}</th>
                <th>
                  <span className="sr-only">{t('devices.admin.col.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div className="muted">{u.email}</div>
                  </td>
                  <td>
                    <span className={u.role === 'admin' ? 'chip chip--accent' : 'chip'}>
                      {t(`account.role.${u.role}`)}
                    </span>
                  </td>
                  <td>
                    {u.lastSeenAt
                      ? formatRelative(u.lastSeenAt, i18n.language)
                      : t('devices.admin.never')}
                  </td>
                  <td>
                    <span className="hstack" style={{ gap: 6 }}>
                      {u.devices.map((d) => (
                        <span key={d} title={t(`devices.type.${d}`)}>
                          <DeviceIcon device={d} size={15} />
                        </span>
                      ))}
                      <span className="muted">
                        {t('devices.admin.sessions', { count: u.activeSessions })}
                      </span>
                      {u.failedLogins24h > 0 && (
                        <span className="chip chip--warn" title={t('devices.admin.failedHint')}>
                          <AlertTriangle size={12} aria-hidden />
                          {t('devices.admin.failed', { count: u.failedLogins24h })}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="num">{u.answers}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString(i18n.language)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      aria-label={t('devices.admin.viewLabel', { name: u.name })}
                      onClick={() => setOpenId(u.id)}
                    >
                      <Eye size={14} aria-hidden />
                      {t('devices.admin.view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const detail = useAdminUserDetail(id);
  const revoke = useAdminRevokeSession(id);

  const back = (
    <button type="button" className="btn btn--small btn--ghost" onClick={onBack}>
      <ArrowLeft size={14} aria-hidden />
      {t('devices.admin.back')}
    </button>
  );
  if (detail.isPending) return <Spinner center />;
  if (detail.isError)
    return (
      <div className="stack">
        {back}
        <ErrorState />
      </div>
    );

  const { user, sessions, events, consent, privacyAcceptedAt } = detail.data;
  const day = (iso: string) => new Date(iso).toLocaleDateString(i18n.language);
  const onOff = (v: boolean) => t(v ? 'privacy.admin.on' : 'privacy.admin.off');
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>{back}</div>
      <div
        className="hstack"
        style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{user.name}</h2>
          <span className="muted">
            {user.email} · {t(`account.role.${user.role}`)} · {user.locale} ·{' '}
            {t('devices.admin.joinedOn', {
              date: new Date(user.createdAt).toLocaleDateString(i18n.language),
            })}
          </span>
        </div>
        {sessions.length > 0 && (
          <button
            type="button"
            className="btn btn--small btn--danger"
            disabled={revoke.isPending}
            onClick={() => revoke.mutate('all')}
          >
            {t('devices.admin.signOutEverywhere')}
          </button>
        )}
      </div>

      <section className="stack" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>{t('privacy.admin.consent')}</h3>
        <dl className="device-facts" style={{ margin: 0 }}>
          <div>
            <dt>{t('privacy.admin.policy')}</dt>
            <dd>
              {privacyAcceptedAt && user.privacyVersion
                ? t('privacy.admin.acceptedOn', {
                    date: day(privacyAcceptedAt),
                    version: user.privacyVersion,
                  })
                : t('privacy.admin.notAccepted')}
            </dd>
          </div>
          <div>
            <dt>{t('privacy.admin.choice')}</dt>
            <dd>
              {consent
                ? t('privacy.admin.choiceValue', {
                    preferences: onOff(consent.preferences),
                    deviceDetails: onOff(consent.deviceDetails),
                    date: day(consent.createdAt),
                  })
                : t('privacy.admin.noChoice')}
            </dd>
          </div>
        </dl>
      </section>

      <section className="stack" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>
          {t('devices.admin.activeDevices', { count: sessions.length })}
        </h3>
        {sessions.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('devices.admin.noSessions')}
          </p>
        ) : (
          <DeviceList
            sessions={sessions}
            revokingId={revoke.isPending ? revoke.variables : undefined}
            onRevoke={(s) => revoke.mutate(s.id)}
          />
        )}
      </section>

      <section className="stack" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>{t('devices.admin.history')}</h3>
        <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
          {t('devices.admin.historyHint')}
        </p>
        {events.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            {t('devices.admin.noHistory')}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('devices.admin.col.when')}</th>
                  <th>{t('devices.admin.col.event')}</th>
                  <th>{t('devices.admin.col.device')}</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {new Date(e.createdAt).toLocaleString(i18n.language, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td>
                      <span className={`login-event login-event--${e.kind}`}>
                        {t(`devices.event.${e.kind}`)}
                      </span>
                    </td>
                    <td>
                      <span className="hstack" style={{ gap: 6 }}>
                        <DeviceIcon device={e.device} size={14} />
                        {t('devices.browserOn', { browser: e.browser, os: e.os })}
                      </span>
                    </td>
                    <td className="mono">{e.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
