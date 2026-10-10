import { createBrowserRouter } from 'react-router-dom';

import { AccountPage } from '@/pages/AccountPage';
import { AdminPage } from '@/pages/AdminPage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { BuildTestPage } from '@/pages/BuildTestPage';
import { CuratedMaterialPage } from '@/pages/CuratedMaterialPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MyTestsPage } from '@/pages/MyTestsPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { QuestionPage } from '@/pages/QuestionPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { TakeTestPage } from '@/pages/TakeTestPage';
import { WeakSpotsPage } from '@/pages/WeakSpotsPage';

import { AppShell } from './layout/AppShell';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignUpPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'questions/:id', element: <QuestionPage /> },
      { path: 'review', element: <ReviewPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'weak-spots', element: <WeakSpotsPage /> },
      { path: 'bookmarks', element: <BookmarksPage /> },
      { path: 'build', element: <BuildTestPage /> },
      { path: 'my-tests', element: <MyTestsPage /> },
      { path: 'tests/:id/take', element: <TakeTestPage /> },
      { path: 'materials', element: <CuratedMaterialPage /> },
      { path: 'account', element: <AccountPage /> },
      // Admin-gated inside the component (redirects non-admins to /).
      { path: 'admin', element: <AdminPage /> },
    ],
  },
]);
