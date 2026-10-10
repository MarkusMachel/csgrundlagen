import type { ClientInfo, DeviceType, LoginEventKind } from '@/features/devices/types';

/** Mirrors apps/api/internal/useragent (enough of it for the mocks). */
export function parseUserAgent(ua = ''): { browser: string; os: string; device: DeviceType } {
  const browsers: [string, RegExp][] = [
    ['Edge', /Edg(?:e|A|iOS)?\/(\d+)/],
    ['Opera', /(?:OPR|Opera)\/(\d+)/],
    ['Samsung Internet', /SamsungBrowser\/(\d+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/],
    ['Chrome', /(?:Chrome|CriOS)\/(\d+)/],
    ['Safari', /Version\/(\d+(?:\.\d+)?).*Safari\//],
  ];
  let browser = 'Unknown';
  for (const [name, re] of browsers) {
    const m = ua.match(re);
    if (m) {
      browser = `${name} ${m[1]}`;
      break;
    }
  }
  const ver = (re: RegExp) => {
    const m = ua.match(re);
    return m ? ` ${m[1]}.${m[2]}` : '';
  };
  let os = 'Unknown';
  let device: DeviceType = 'desktop';
  if (ua.includes('iPad')) [os, device] = [`iPadOS${ver(/OS (\d+)[_.](\d+)/)}`, 'tablet'];
  else if (ua.includes('iPhone')) [os, device] = [`iOS${ver(/OS (\d+)[_.](\d+)/)}`, 'mobile'];
  else if (ua.includes('Android')) {
    os = `Android${ua.match(/Android (\d+(?:\.\d+)?)/)?.[1] ? ` ${ua.match(/Android (\d+(?:\.\d+)?)/)![1]}` : ''}`;
    device = ua.includes('Mobile') ? 'mobile' : 'tablet';
  } else if (ua.includes('Windows NT'))
    os = ua.includes('Windows NT 10.0') ? 'Windows 10/11' : 'Windows';
  else if (ua.includes('Mac OS X')) os = `macOS${ver(/Mac OS X (\d+)[_.](\d+)/)}`;
  else if (ua.includes('CrOS')) os = 'ChromeOS';
  else if (ua.includes('Linux')) os = 'Linux';
  if (/bot|crawler|spider|headless/i.test(ua)) device = 'bot';
  return { browser, os, device };
}

export interface MockSession {
  id: string;
  userId: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  ip?: string;
  lastIp?: string;
  userAgent?: string;
  clientInfo?: ClientInfo;
}

export interface MockConsent {
  userId: string;
  policyVersion: string;
  preferences: boolean;
  deviceDetails: boolean;
  createdAt: string;
}

export interface MockLoginEvent {
  id: number;
  userId: string;
  kind: LoginEventKind;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
export const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const WINDOWS_FIREFOX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0';

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();
const inDays = (days: number) => new Date(Date.now() + days * 86400_000).toISOString();

/**
 * One session per seed user, named `s-<userId>`: the test helpers' token
 * stubs (`mock-token.u1`) resolve to it. The demo user also has a phone.
 */
export function seedSessions(): MockSession[] {
  return [
    {
      id: 's-u1',
      userId: 'u1',
      createdAt: ago(50),
      lastSeenAt: ago(0),
      expiresAt: inDays(28),
      ip: '203.0.113.7',
      lastIp: '203.0.113.7',
      userAgent: MAC_CHROME,
      clientInfo: {
        timezone: 'Europe/Berlin',
        language: 'en-US',
        languages: ['en-US', 'de'],
        screen: '1728x1117',
        pixelRatio: 2,
        colorScheme: 'dark',
      },
    },
    {
      id: 's-u1-phone',
      userId: 'u1',
      createdAt: ago(200),
      lastSeenAt: ago(20),
      expiresAt: inDays(22),
      ip: '198.51.100.23',
      lastIp: '198.51.100.40',
      userAgent: IPHONE,
      clientInfo: {
        timezone: 'Europe/Berlin',
        language: 'de-DE',
        screen: '393x852',
        pixelRatio: 3,
        touch: true,
      },
    },
    {
      id: 's-u2',
      userId: 'u2',
      createdAt: ago(5),
      lastSeenAt: ago(1),
      expiresAt: inDays(29),
      ip: '192.0.2.10',
      lastIp: '192.0.2.10',
      userAgent: WINDOWS_FIREFOX,
    },
    { id: 's-u3', userId: 'u3', createdAt: ago(400), lastSeenAt: ago(300), expiresAt: inDays(13) },
  ];
}

export function seedLoginEvents(): MockLoginEvent[] {
  return [
    {
      id: 1,
      userId: 'u1',
      kind: 'login',
      ip: '198.51.100.23',
      userAgent: IPHONE,
      createdAt: ago(200),
    },
    {
      id: 2,
      userId: 'u1',
      kind: 'login_failed',
      ip: '203.0.113.7',
      userAgent: MAC_CHROME,
      createdAt: ago(50.1),
    },
    {
      id: 3,
      userId: 'u1',
      kind: 'login',
      ip: '203.0.113.7',
      userAgent: MAC_CHROME,
      createdAt: ago(50),
    },
    {
      id: 4,
      userId: 'u2',
      kind: 'signup',
      ip: '192.0.2.10',
      userAgent: WINDOWS_FIREFOX,
      createdAt: ago(5),
    },
    {
      // a recent wrong password from an unfamiliar network, for the admin badge
      id: 5,
      userId: 'u1',
      kind: 'login_failed',
      ip: '100.64.12.9',
      userAgent: WINDOWS_FIREFOX,
      createdAt: ago(3),
    },
  ];
}
