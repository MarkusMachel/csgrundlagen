/** Mirrors store.Session / store.LoginEvent / store.AdminUser in the Go API. */
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot';

export interface ClientInfo {
  timezone?: string;
  language?: string;
  languages?: string[];
  platform?: string;
  screen?: string;
  viewport?: string;
  pixelRatio?: number;
  touch?: boolean;
  colorScheme?: 'light' | 'dark';
}

interface ParsedAgent {
  browser: string;
  os: string;
  device: DeviceType;
}

export interface DeviceSession extends ParsedAgent {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  ip?: string;
  lastIp?: string;
  userAgent?: string;
  clientInfo?: ClientInfo;
  /** The session making this request. */
  current: boolean;
}

export type LoginEventKind = 'login' | 'signup' | 'login_failed' | 'password_reset';

export interface LoginEvent extends ParsedAgent {
  id: number;
  kind: LoginEventKind;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  locale: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastSeenAt?: string;
  activeSessions: number;
  devices: DeviceType[];
  answers: number;
  failedLogins24h: number;
}

export interface AdminUserDetail {
  user: AdminUser;
  sessions: DeviceSession[];
  events: LoginEvent[];
}
