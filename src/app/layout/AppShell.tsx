import { Box, CircularProgress, Toolbar } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useSessionBootstrap } from '@/features/auth';

import { SideNav } from './SideNav';
import { TopBar } from './TopBar';

export function AppShell() {
  const status = useSessionBootstrap();
  const location = useLocation();

  if (status === 'unknown') {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <TopBar />
      <SideNav />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
