import type { ClientInfo } from './types';

/** What the browser can tell about itself, sent once per page load. */
export function collectClientInfo(): ClientInfo {
  const nav = typeof navigator === 'undefined' ? undefined : navigator;
  const info: ClientInfo = {};
  try {
    info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Intl without time zone support
  }
  if (nav) {
    info.language = nav.language;
    info.languages = [...(nav.languages ?? [])].slice(0, 8);
    const uaData = (nav as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
    info.platform = uaData?.platform || nav.platform || undefined;
    info.touch = (nav.maxTouchPoints ?? 0) > 0;
  }
  if (typeof window !== 'undefined') {
    if (window.screen?.width) info.screen = `${window.screen.width}x${window.screen.height}`;
    if (window.innerWidth) info.viewport = `${window.innerWidth}x${window.innerHeight}`;
    if (window.devicePixelRatio) info.pixelRatio = Math.round(window.devicePixelRatio * 100) / 100;
    info.colorScheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return info;
}
