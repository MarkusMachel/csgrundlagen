import type { PaletteOptions } from '@mui/material';

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: { main: '#3554b3' },
  secondary: { main: '#7c4dff' },
  background: { default: '#f6f7fb', paper: '#ffffff' },
  success: { main: '#2e7d32' },
  error: { main: '#c62828' },
};

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: { main: '#8fa8ff' },
  secondary: { main: '#b79cff' },
  background: { default: '#12141c', paper: '#1b1e2a' },
  success: { main: '#81c784' },
  error: { main: '#ef9a9a' },
};

// Chart palette for the answer-distribution bar chart (§10 Stats tab),
// tuned separately per mode for contrast (§12).
export const chartColors = {
  light: { correct: '#2e7d32', other: '#5c6bc0' },
  dark: { correct: '#81c784', other: '#9fa8da' },
};
