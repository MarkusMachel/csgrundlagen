import { createBrowserRouter } from 'react-router-dom';

import { AdminPage } from '@/pages/AdminPage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { BuildTestPage } from '@/pages/BuildTestPage';
import { CuratedMaterialPage } from '@/pages/CuratedMaterialPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MyTestsPage } from '@/pages/MyTestsPage';
import { QuestionPage } from '@/pages/QuestionPage';
import { TakeTestPage } from '@/pages/TakeTestPage';
import { WeakSpotsPage } from '@/pages/WeakSpotsPage';

import { AppShell } from './layout/AppShell';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'questions/:id', element: <QuestionPage /> },
      { path: 'weak-spots', element: <WeakSpotsPage /> },
      { path: 'bookmarks', element: <BookmarksPage /> },
      { path: 'build', element: <BuildTestPage /> },
      { path: 'my-tests', element: <MyTestsPage /> },
      { path: 'tests/:id/take', element: <TakeTestPage /> },
      { path: 'materials', element: <CuratedMaterialPage /> },
      // Admin-gated inside the component (redirects non-admins to /).
      { path: 'admin', element: <AdminPage /> },
    ],
  },
]);
