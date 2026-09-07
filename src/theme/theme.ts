import { createTheme, type Theme } from '@mui/material';

import { darkPalette, lightPalette } from './palette';

export type ThemeMode = 'light' | 'dark';

export function buildTheme(mode: ThemeMode): Theme {
  return createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    typography: {
      // 14px base instead of MUI's 16px default; all variants scale from it.
      fontSize: 14,
      h5: { fontSize: '1.35rem' },
      h6: { fontSize: '1.05rem' },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 14 },
        },
      },
    },
  });
}
