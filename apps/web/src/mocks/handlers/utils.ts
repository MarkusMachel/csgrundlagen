import { HttpResponse } from 'msw';

import type { LoginEventKind } from '@/features/devices/types';
import type { Question } from '@/features/questions/types';
import type { Locale, User } from '@/shared/types';

import { db, nextId } from '../db';
import type { MockSession } from '../seed/devices';
import { localizeQuestion } from '../seed/questions';

/**
 * The mock token stub encodes the user and session (`mock-token.<userId>.<sessionId>`),
 * so the session survives page reloads even though the mock "backend" lives in page
 * memory (§2: session persists via /auth/me + local storage token stub). A stub
 * without a session part means the user's seeded session `s-<userId>`.
 */
export function tokenFor(userId: string, sessionId: string): string {
  return `mock-token.${userId}.${sessionId}`;
}

/** The session behind the request's token, or null if signed out or revoked. */
export function currentSession(request: Request): MockSession | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer mock-token.')) return null;
  const [userId, sessionId = `s-${userId}`] = auth.slice('Bearer mock-token.'.length).split('.');
  let session = db.sessions.find((s) => s.id === sessionId && s.userId === userId);
  if (!session) {
    // A page reload resets the mock database, so a token from an earlier page
    // load names a session that's gone. Bring it back, unless it was revoked.
    if (db.revokedSessions.includes(sessionId) || !db.users.some((u) => u.id === userId)) {
      return null;
    }
    const now = new Date();
    session = {
      id: sessionId,
      userId,
      createdAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 86400_000).toISOString(),
      userAgent: userAgentOf(request),
    };
    db.sessions.push(session);
  }
  session.lastSeenAt = new Date().toISOString();
  return session;
}

/** Signs out the matching sessions for good; returns how many there were. */
export function revokeSessions(match: (s: MockSession) => boolean): number {
  const gone = db.sessions.filter(match);
  db.revokedSessions.push(...gone.map((s) => s.id));
  db.sessions = db.sessions.filter((s) => !match(s));
  return gone.length;
}

export function currentUser(request: Request): User | null {
  const session = currentSession(request);
  const user = session && db.users.find((u) => u.id === session.userId);
  if (!user) return null;
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

/** The browser doesn't let fetch set User-Agent, so fall back to the page's. */
function userAgentOf(request: Request) {
  return request.headers.get('User-Agent') || globalThis.navigator?.userAgent || undefined;
}

/** Opens a session for a sign-in and returns its token stub. */
export function openSession(request: Request, userId: string): string {
  const now = new Date();
  const session: MockSession = {
    id: nextId('s'),
    userId,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 86400_000).toISOString(),
    ip: '127.0.0.1',
    lastIp: '127.0.0.1',
    userAgent: userAgentOf(request),
  };
  db.sessions.push(session);
  return tokenFor(userId, session.id);
}

export function recordLoginEvent(request: Request, userId: string, kind: LoginEventKind) {
  db.loginEvents.push({
    id: db.loginEvents.length + 1,
    userId,
    kind,
    ip: '127.0.0.1',
    userAgent: userAgentOf(request),
    createdAt: new Date().toISOString(),
  });
}

export function unauthorized() {
  return HttpResponse.json({ message: 'Not authenticated' }, { status: 401 });
}

export function forbidden() {
  return HttpResponse.json({ message: 'Admin access required' }, { status: 403 });
}

export function localeOf(request: Request): Locale {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale');
  return locale === 'pt-BR' || locale === 'de' ? locale : 'en';
}

export function allQuestions(locale: Locale): Question[] {
  return db.questions.map((s) => localizeQuestion(s, locale));
}

export function findQuestion(id: string, locale: Locale): Question | undefined {
  const seed = db.questions.find((s) => s.question.id === id);
  return seed ? localizeQuestion(seed, locale) : undefined;
}
