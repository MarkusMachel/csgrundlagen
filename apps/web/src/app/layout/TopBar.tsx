import {
  Bookmark,
  BookOpen,
  ClipboardList,
  Home,
  ListChecks,
  Moon,
  ShieldCheck,
  Sun,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';

import { useLogout } from '@/features/auth';
import { useIsAdmin } from '@/features/authoring';
import { GlobalSearch } from '@/features/search';
import { SUPPORTED_LOCALES } from '@/i18n/config';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

interface FileTab {
  to: string;
  file: string;
  icon: LucideIcon;
  key: string;
  end?: boolean;
  adminOnly?: boolean;
}

/** The nav is a strip of open "files" — one per section (mockup design). */
const fileTabs: FileTab[] = [
  { to: '/', file: 'home.cs', icon: Home, key: 'nav.home', end: true },
  { to: '/weak-spots', file: 'weak_spots.cs', icon: TrendingDown, key: 'nav.weakSpots' },
  { to: '/bookmarks', file: 'bookmarks.cs', icon: Bookmark, key: 'nav.bookmarks' },
  { to: '/build', file: 'build_test.cs', icon: ListChecks, key: 'nav.buildTest' },
  { to: '/my-tests', file: 'my_tests.cs', icon: ClipboardList, key: 'nav.myTests' },
  { to: '/materials', file: 'material.cs', icon: BookOpen, key: 'nav.materials' },
  { to: '/admin', file: 'admin.cs', icon: ShieldCheck, key: 'nav.admin', adminOnly: true },
];

export function TopBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const themeMode = useUIStore((s) => s.themeMode);
  const toggleThemeMode = useUIStore((s) => s.toggleThemeMode);
  const locale = useUIStore((s) => s.locale);
  const setLocale = useUIStore((s) => s.setLocale);

  const user = useAuthStore((s) => s.user);
  const isAdmin = useIsAdmin();
  const logout = useLogout();

  const visibleTabs = useMemo(
    () => fileTabs.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin],
  );

  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const localeMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(localeMenuRef, () => setLocaleMenuOpen(false), localeMenuOpen);
  useClickOutside(userMenuRef, () => setUserMenuOpen(false), userMenuOpen);

  return (
    <header className="titlebar" style={{ paddingRight: 8 }}>
      <nav
        className="tabstrip"
        aria-label={t('common.appName')}
        style={{ flex: 1, minWidth: 0 }}
      >
        {visibleTabs.map(({ to, file, icon: Icon, key, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-label={t(key)}
            className={({ isActive }) => (isActive ? 'file-tab file-tab--active' : 'file-tab')}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className="file-tab__icon" aria-hidden />
                {file}
                {isActive && <span className="file-tab__dot" aria-hidden />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="titlebar__actions">
        <GlobalSearch />

        <button
          type="button"
          className="btn btn--icon"
          aria-label={t('nav.toggleTheme')}
          onClick={toggleThemeMode}
          data-testid="theme-toggle"
        >
          {themeMode === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
        </button>

        <div className="menu-wrap" ref={localeMenuRef}>
          <button
            type="button"
            className="btn btn--icon"
            aria-label={t('common.language')}
            aria-expanded={localeMenuOpen}
            onClick={() => setLocaleMenuOpen((o) => !o)}
            data-testid="locale-switcher"
          >
            {locale === 'pt-BR' ? 'PT' : locale.toUpperCase()}
          </button>
          {localeMenuOpen && (
            <ul className="menu" role="menu">
              {SUPPORTED_LOCALES.map(({ code, label }) => (
                <li key={code} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={code === locale ? 'menu-item menu-item--selected' : 'menu-item'}
                    onClick={() => {
                      setLocale(code);
                      setLocaleMenuOpen(false);
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {user && (
          <div className="menu-wrap" ref={userMenuRef}>
            <button
              type="button"
              className="btn btn--icon"
              aria-label={t('nav.userMenu')}
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((o) => !o)}
            >
              <span className="comment-avatar" aria-hidden>
                {user.name.charAt(0)}
              </span>
            </button>
            {userMenuOpen && (
              <ul className="menu" role="menu">
                <li role="none" className="menu-item menu-item--static">
                  {user.name}
                  <span className="search-result__sub">{user.email}</span>
                </li>
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout.mutate(undefined, { onSettled: () => navigate('/login') });
                    }}
                  >
                    {t('nav.logout')}
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
