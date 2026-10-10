import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';

import { RequireSignIn, useSessionBootstrap } from '@/features/auth';
import { ConsentLayer } from '@/features/privacy';
import { HomePage } from '@/pages/HomePage';
import { Spinner } from '@/shared/ui';

import { AppShell } from './layout/AppShell';

/**
 * Pages load on first visit, so the first screen doesn't download every page
 * (Home, where signed-in users land, stays in the main bundle).
 */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] })));
}

const AccountPage = page(() => import('@/pages/AccountPage'), 'AccountPage');
const AdminPage = page(() => import('@/pages/AdminPage'), 'AdminPage');
const BookmarksPage = page(() => import('@/pages/BookmarksPage'), 'BookmarksPage');
const BuildTestPage = page(() => import('@/pages/BuildTestPage'), 'BuildTestPage');
const ConfirmEmailPage = page(() => import('@/pages/ConfirmEmailPage'), 'ConfirmEmailPage');
const CuratedMaterialPage = page(
  () => import('@/pages/CuratedMaterialPage'),
  'CuratedMaterialPage',
);
const ForgotPasswordPage = page(() => import('@/pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const LoginPage = page(() => import('@/pages/LoginPage'), 'LoginPage');
const MyTestsPage = page(() => import('@/pages/MyTestsPage'), 'MyTestsPage');
const PrivacyPage = page(() => import('@/pages/PrivacyPage'), 'PrivacyPage');
const ProgressPage = page(() => import('@/pages/ProgressPage'), 'ProgressPage');
const QuestionPage = page(() => import('@/pages/QuestionPage'), 'QuestionPage');
const ResetPasswordPage = page(() => import('@/pages/ResetPasswordPage'), 'ResetPasswordPage');
const ReviewPage = page(() => import('@/pages/ReviewPage'), 'ReviewPage');
const SignUpPage = page(() => import('@/pages/SignUpPage'), 'SignUpPage');
const TakeTestPage = page(() => import('@/pages/TakeTestPage'), 'TakeTestPage');
const WeakSpotsPage = page(() => import('@/pages/WeakSpotsPage'), 'WeakSpotsPage');

/** Wraps every page, signed in or not, so the consent banner is everywhere. */
function RootLayout() {
  useSessionBootstrap();
  return (
    <>
      <Suspense fallback={<Spinner center />}>
        <Outlet />
      </Suspense>
      <ConsentLayer />
    </>
  );
}

/** Pages about the user's own data; signed out they ask to sign in. */
const own = (element: ReactNode) => <RequireSignIn>{element}</RequireSignIn>;

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/confirm-email', element: <ConfirmEmailPage /> },
      { path: '/signup', element: <SignUpPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      {
        path: '/',
        element: <AppShell />,
        // Browsing (questions, material) is open to everyone; answering and
        // the rest ask to sign in when tried (see shared/api/client).
        children: [
          { index: true, element: <HomePage /> },
          { path: 'questions/:id', element: <QuestionPage /> },
          { path: 'materials', element: <CuratedMaterialPage /> },
          { path: 'review', element: own(<ReviewPage />) },
          { path: 'progress', element: own(<ProgressPage />) },
          { path: 'weak-spots', element: own(<WeakSpotsPage />) },
          { path: 'bookmarks', element: own(<BookmarksPage />) },
          { path: 'build', element: own(<BuildTestPage />) },
          { path: 'my-tests', element: own(<MyTestsPage />) },
          { path: 'tests/:id/take', element: own(<TakeTestPage />) },
          { path: 'account', element: own(<AccountPage />) },
          // Admin-gated inside the component (redirects non-admins to /).
          { path: 'admin', element: own(<AdminPage />) },
        ],
      },
    ],
  },
]);
