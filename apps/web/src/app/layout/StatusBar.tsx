import { Flame, RefreshCw, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { PrivacySettingsButton } from '@/features/privacy';
import { useOnline, usePendingAnswers } from '@/shared/offline/useOffline';
import { useUIStore } from '@/stores/useUIStore';

const routeFiles: Record<string, string> = {
  '/': 'home.cs',
  '/weak-spots': 'weak_spots.cs',
  '/bookmarks': 'bookmarks.cs',
  '/build': 'build_test.cs',
  '/my-tests': 'my_tests.cs',
  '/materials': 'material.cs',
  '/admin': 'admin.cs',
};

/** VS Code-style status bar: page context left, progress/streak/locale right. */
export function StatusBar() {
  const { t, i18n } = useTranslation();
  const online = useOnline();
  const pending = usePendingAnswers();
  const { pathname } = useLocation();
  const statusText = useUIStore((s) => s.statusText);
  const statusDots = useUIStore((s) => s.statusDots);
  const streak = useUIStore((s) => s.streak);

  const file =
    routeFiles[pathname] ??
    (pathname.startsWith('/tests/')
      ? 'attempt.cs'
      : pathname.startsWith('/questions/')
        ? 'question.cs'
        : '—');

  return (
    <footer className="statusbar" data-testid="status-bar">
      <span>{statusText ?? `~/cs-trainer/${file}`}</span>
      <div className="statusbar__right">
        {statusDots && statusDots.length > 0 && (
          <span className="statusbar__dots" aria-hidden>
            {statusDots.map((filled, i) => (
              <span
                key={i}
                className={filled ? 'statusbar__dot statusbar__dot--filled' : 'statusbar__dot'}
              />
            ))}
          </span>
        )}
        {streak > 0 && (
          <span className="statusbar__streak hstack" style={{ gap: 3 }} data-testid="streak">
            <Flame size={13} aria-hidden /> {streak}
          </span>
        )}
        {(!online || pending > 0) && (
          <span
            className={online ? 'statusbar__sync' : 'statusbar__sync statusbar__sync--offline'}
            role="status"
          >
            {online ? <RefreshCw size={12} aria-hidden /> : <WifiOff size={12} aria-hidden />}
            {!online && t('offline.offline')}
            {!online && pending > 0 && ' · '}
            {pending > 0 && t('offline.pending', { count: pending })}
          </span>
        )}
        <Link to="/privacy" className="statusbar__link">
          {t('privacy.footerLink')}
        </Link>
        <PrivacySettingsButton className="statusbar__link linklike" />
        <span>{i18n.language}</span>
        <span aria-hidden>UTF-8</span>
      </div>
    </footer>
  );
}
