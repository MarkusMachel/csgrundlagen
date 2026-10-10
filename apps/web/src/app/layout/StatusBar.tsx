import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

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
  const { i18n } = useTranslation();
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
        <span>{i18n.language}</span>
        <span aria-hidden>UTF-8</span>
      </div>
    </footer>
  );
}
