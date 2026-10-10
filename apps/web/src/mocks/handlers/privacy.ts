import { http, HttpResponse } from 'msw';

import { PRIVACY_POLICY_VERSION } from '@/features/privacy/consent';

import { db } from '../db';
import { latestConsent } from './devices';
import { currentSession, currentUser, revokeSessions, unauthorized } from './utils';

/** Mirrors apps/api/internal/httpapi/privacy.go. */
export const privacyHandlers = [
  http.post('/api/me/consent', async ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const body = (await request.json()) as {
      policyVersion?: string;
      preferences: boolean;
      deviceDetails: boolean;
    };
    const next = {
      policyVersion: body.policyVersion || PRIVACY_POLICY_VERSION,
      preferences: !!body.preferences,
      deviceDetails: !!body.deviceDetails,
    };
    const last = latestConsent(me.id);
    const same =
      last &&
      last.policyVersion === next.policyVersion &&
      last.preferences === next.preferences &&
      last.deviceDetails === next.deviceDetails;
    if (!same) db.consents.push({ userId: me.id, ...next, createdAt: new Date().toISOString() });
    if (!next.deviceDetails) {
      db.sessions.filter((s) => s.userId === me.id).forEach((s) => delete s.clientInfo);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/me/privacy', async ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const { version } = (await request.json()) as { version: string };
    if (version !== PRIVACY_POLICY_VERSION) {
      return HttpResponse.json(
        { message: 'that is not the current privacy policy' },
        { status: 400 },
      );
    }
    db.users.find((u) => u.id === me.id)!.privacyVersion = version;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/me/export', ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const mine = <T extends { userId: string }>(rows: T[]) =>
      rows.filter((r) => r.userId === me.id);
    return HttpResponse.json({
      exportedAt: new Date().toISOString(),
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      profile: me,
      sessions: mine(db.sessions),
      signInHistory: mine(db.loginEvents),
      consents: mine(db.consents),
      answers: mine(db.answerLog),
      bookmarks: mine(db.bookmarks),
      notes: mine(db.notes),
      bugReports: mine(db.bugReports),
    });
  }),

  http.delete('/api/me', async ({ request }) => {
    const session = currentSession(request);
    if (!session) return unauthorized();
    const { password } = (await request.json()) as { password: string };
    const user = db.users.find((u) => u.id === session.userId)!;
    if (user.password !== password) {
      return HttpResponse.json({ message: 'password is incorrect' }, { status: 400 });
    }
    if (user.role === 'admin' && db.users.filter((u) => u.role === 'admin').length <= 1) {
      return HttpResponse.json(
        { message: 'you are the only admin; make someone else an admin first' },
        { status: 409 },
      );
    }
    db.users = db.users.filter((u) => u.id !== user.id);
    revokeSessions((s) => s.userId === user.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
