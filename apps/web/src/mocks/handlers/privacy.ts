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
    const profile = db.users.find((u) => u.id === me.id)!;
    // Same layout as the API's export (store.ExportUserData): table rows
    // with their column names.
    return HttpResponse.json({
      exportedAt: new Date().toISOString(),
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      profile: {
        id: me.id,
        name: me.name,
        email: me.email,
        avatarUrl: me.avatarUrl ?? null,
        locale: me.locale,
        role: me.role,
        createdAt: profile.createdAt ?? null,
        privacyVersion: me.privacyVersion ?? null,
        privacyAcceptedAt: me.privacyVersion ? (profile.createdAt ?? null) : null,
      },
      sessions: mine(db.sessions).map((s) => ({
        id: s.id,
        created_at: s.createdAt,
        last_seen_at: s.lastSeenAt,
        expires_at: s.expiresAt,
        ip: s.ip ?? null,
        last_ip: s.lastIp ?? null,
        user_agent: s.userAgent ?? null,
        client_info: s.clientInfo ?? null,
      })),
      signInHistory: mine(db.loginEvents).map((e) => ({
        kind: e.kind,
        ip: e.ip ?? null,
        user_agent: e.userAgent ?? null,
        created_at: e.createdAt,
      })),
      consents: mine(db.consents).map((c) => ({
        policy_version: c.policyVersion,
        preferences: c.preferences,
        device_details: c.deviceDetails,
        ip: null,
        user_agent: null,
        created_at: c.createdAt,
      })),
      answers: mine(db.answerLog).map((a) => ({
        question_id: a.questionId,
        answer_value: null,
        is_correct: a.correct,
        test_attempt_id: null,
        answered_at: a.at,
      })),
      reviewSchedule: Object.entries(db.reviews)
        .filter(([key]) => key.startsWith(`${me.id}:`))
        .map(([key, r]) => ({
          question_id: key.slice(me.id.length + 1),
          repetitions: r.repetitions,
          interval_days: r.intervalDays,
          ease: r.ease,
          due_at: r.dueAt,
          last_reviewed_at: null,
        })),
      bookmarks: mine(db.bookmarks).map((b) => ({
        question_id: b.questionId,
        created_at: b.createdAt,
      })),
      notes: mine(db.notes).map((n) => ({
        question_id: n.questionId,
        body: n.body,
        updated_at: n.updatedAt,
      })),
      comments: mine(db.comments).map((c) => ({
        id: c.id,
        question_id: c.questionId,
        body: c.body,
        created_at: c.createdAt,
      })),
      commentReports: mine(db.commentReports).map((r) => ({
        comment_id: r.commentId,
        reason: r.reason,
        note: r.note ?? null,
        created_at: r.createdAt,
      })),
      bugReports: mine(db.bugReports).map((r) => ({
        id: r.id,
        question_id: r.questionId,
        message: r.message,
        status: r.status,
        created_at: r.createdAt,
      })),
      tests: db.tests
        .filter((t) => t.ownerId === me.id)
        .map((t) => ({
          id: t.id,
          name: t.name,
          timed: t.timed,
          duration_minutes: t.durationMinutes ?? null,
          shuffle_questions: t.shuffleQuestions,
          shuffle_options: t.shuffleOptions,
          created_at: t.createdAt,
          question_ids: t.questionIds,
        })),
      testAttempts: mine(db.attempts).map((a) => ({
        id: a.id,
        test_id: a.testId,
        mode: a.mode,
        answers: a.answers,
        score: a.score,
        started_at: a.startedAt,
        submitted_at: a.submittedAt ?? null,
      })),
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
