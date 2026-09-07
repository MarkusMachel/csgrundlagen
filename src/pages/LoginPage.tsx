import { Box, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import { LoginForm } from '@/features/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
      </Paper>
    </Box>
  );
}
