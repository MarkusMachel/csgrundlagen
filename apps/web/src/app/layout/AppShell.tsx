import { ArrowDown } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useSessionBootstrap } from '@/features/auth';
import { PolicyUpdateModal, usePrivacySync } from '@/features/privacy';
import { Spinner } from '@/shared/ui';
import { scrollBehavior } from '@/shared/utils/motion';

import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';

/** True when the page is scrolled to (or near) the bottom, or can't scroll at all. */
function useNearBottom(threshold = 120) {
  const [nearBottom, setNearBottom] = useState(false);
  useEffect(() => {
    const update = () => {
      const { scrollHeight } = document.documentElement;
      setNearBottom(window.innerHeight + window.scrollY >= scrollHeight - threshold);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Content height changes (e.g. a page of questions loading) don't fire scroll.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [threshold]);
  return nearBottom;
}

export function AppShell() {
  const { t } = useTranslation();
  const status = useSessionBootstrap();
  usePrivacySync();
  const location = useLocation();
  // Hidden at the bottom so it never covers the last controls, like the pagination.
  const nearBottom = useNearBottom();

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
        <Suspense fallback={<Spinner center />}>
          <Outlet />
        </Suspense>
      </main>
      {!nearBottom && (
        <button
          type="button"
          className="scroll-fab"
          aria-label={t('nav.scrollDown')}
          onClick={() =>
            window.scrollBy({ top: window.innerHeight * 0.8, behavior: scrollBehavior() })
          }
        >
          <ArrowDown size={18} aria-hidden style={{ margin: 'auto' }} />
        </button>
      )}
      <StatusBar />
      <PolicyUpdateModal />
    </>
  );
}
