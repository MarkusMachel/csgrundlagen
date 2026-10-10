import { http, HttpResponse } from 'msw';

import type { AdminUser, ClientInfo, DeviceSession, LoginEvent } from '@/features/devices/types';

import { db } from '../db';
import { currentSession, currentUser, forbidden, revokeSessions, unauthorized } from './utils';
import { parseUserAgent, type MockSession } from '../seed/devices';

export const latestConsent = (userId: string) =>
  db.consents.filter((c) => c.userId === userId).at(-1);

const lastAdmin = () =>
  HttpResponse.json(
    { message: 'this is the only admin; make someone else an admin first' },
    { status: 409 },
  );

const notFound = () => HttpResponse.json({ message: 'Not found' }, { status: 404 });

const live = (userId: string) =>
  db.sessions
    .filter((s) => s.userId === userId && new Date(s.expiresAt).getTime() > Date.now())
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));

const toSession = (s: MockSession, currentId?: string): DeviceSession => {
  const { userId: _userId, ...rest } = s;
  return { ...rest, ...parseUserAgent(s.userAgent), current: s.id === currentId };
};

function adminUser(userId: string): AdminUser | undefined {
  const u = db.users.find((x) => x.id === userId);
  if (!u) return undefined;
  const sessions = live(u.id);
  const dayAgo = Date.now() - 86400_000;
  const devices = new Set(sessions.map((s) => parseUserAgent(s.userAgent).device));
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    locale: u.locale,
    role: u.role,
    createdAt: u.createdAt ?? '2026-01-05T10:00:00Z',
    lastSeenAt: sessions[0]?.lastSeenAt,
    activeSessions: sessions.length,
    devices: (['desktop', 'mobile', 'tablet', 'bot'] as const).filter((d) => devices.has(d)),
    answers: db.answerLog.filter((a) => a.userId === u.id).length,
    privacyVersion: u.privacyVersion,
    blockedAt: u.blockedAt,
    failedLogins24h: db.loginEvents.filter(
      (e) =>
        e.userId === u.id && e.kind === 'login_failed' && new Date(e.createdAt).getTime() > dayAgo,
    ).length,
  };
}

export const deviceHandlers = [
  http.get('/api/me/sessions', ({ request }) => {
    const session = currentSession(request);
    if (!session) return unauthorized();
    return HttpResponse.json(live(session.userId).map((s) => toSession(s, session.id)));
  }),

  http.delete('/api/me/sessions/:id', ({ request, params }) => {
    const session = currentSession(request);
    if (!session) return unauthorized();
    const target = db.sessions.find((s) => s.id === params.id && s.userId === session.userId);
    if (!target) return notFound();
    revokeSessions((s) => s === target);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/me/device', async ({ request }) => {
    const session = currentSession(request);
    if (!session) return unauthorized();
    // like the API: only with device-details consent
    if (!latestConsent(session.userId)?.deviceDetails) {
      return HttpResponse.json({ message: 'device details need consent' }, { status: 409 });
    }
    session.clientInfo = (await request.json()) as ClientInfo;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/admin/users', ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    const users = db.users.map((u) => adminUser(u.id)!);
    users.sort((a, b) => (b.lastSeenAt ?? '').localeCompare(a.lastSeenAt ?? ''));
    return HttpResponse.json(users);
  }),

  http.get('/api/admin/users/:id', ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    const user = adminUser(String(params.id));
    if (!user) return notFound();
    const events: LoginEvent[] = db.loginEvents
      .filter((e) => e.userId === user.id)
      .reverse()
      .slice(0, 50)
      .map(({ userId: _userId, ...e }) => ({ ...e, ...parseUserAgent(e.userAgent) }));
    const consent = latestConsent(user.id);
    return HttpResponse.json({
      user,
      sessions: live(user.id).map((s) => toSession(s)),
      events,
      consent: consent ? { ...consent, userId: undefined } : null,
      // the mocks don't track when; signing up is when it happened
      privacyAcceptedAt: user.privacyVersion ? user.createdAt : undefined,
    });
  }),

  http.patch('/api/admin/users/:id', async ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    if (params.id === me.id) {
      return HttpResponse.json(
        { message: "you can't change your own role or block yourself" },
        { status: 400 },
      );
    }
    const target = db.users.find((u) => u.id === params.id);
    if (!target) return notFound();
    const change = (await request.json()) as { role?: 'admin' | 'user'; blocked?: boolean };
    const losesAdmin =
      target.role === 'admin' && (change.role === 'user' || change.blocked === true);
    if (losesAdmin && db.users.filter((u) => u.role === 'admin').length <= 1) return lastAdmin();
    if (change.role) target.role = change.role;
    if (change.blocked === true) {
      target.blockedAt ??= new Date().toISOString();
      revokeSessions((s) => s.userId === target.id);
    } else if (change.blocked === false) {
      target.blockedAt = undefined;
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('/api/admin/users/:id', ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    if (params.id === me.id) {
      return HttpResponse.json(
        { message: 'delete your own account from the Account page' },
        { status: 400 },
      );
    }
    const target = db.users.find((u) => u.id === params.id);
    if (!target) return notFound();
    if (target.role === 'admin' && db.users.filter((u) => u.role === 'admin').length <= 1)
      return lastAdmin();
    db.users = db.users.filter((u) => u !== target);
    revokeSessions((s) => s.userId === target.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('/api/admin/users/:id/sessions', ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    return HttpResponse.json({ revoked: revokeSessions((s) => s.userId === params.id) });
  }),

  http.delete('/api/admin/users/:id/sessions/:sid', ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    if (me.role !== 'admin') return forbidden();
    const target = db.sessions.find((s) => s.id === params.sid && s.userId === params.id);
    if (!target) return notFound();
    revokeSessions((s) => s === target);
    return new HttpResponse(null, { status: 204 });
  }),
];
