import { ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useSessionBootstrap } from '@/features/auth';
import { Spinner } from '@/shared/ui';

import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';

export function AppShell() {
  const { t } = useTranslation();
  const status = useSessionBootstrap();
  const location = useLocation();

  if (status === 'unknown') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      <TopBar />
      <main className="app-main">
        <Outlet />
      </main>
      <button
        type="button"
        className="scroll-fab"
        aria-label={t('nav.scrollDown')}
        onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
      >
        <ArrowDown size={18} aria-hidden style={{ margin: 'auto' }} />
      </button>
      <StatusBar />
    </>
  );
}
