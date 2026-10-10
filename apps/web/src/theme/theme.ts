export type ThemeMode = 'light' | 'dark';

/**
 * The theme is pure CSS custom properties (src/styles/tokens.css).
 * Switching means stamping data-theme on <html>; light is the bare
 * :root fallback, dark overrides under [data-theme='dark'].
 */
export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}
