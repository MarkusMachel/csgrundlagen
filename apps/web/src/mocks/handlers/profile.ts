import { http, HttpResponse } from 'msw';

import type { Locale } from '@/shared/types';

import { db, nextId } from '../db';
import { currentUser, unauthorized } from './utils';
import type { SeedUser } from '../seed/users';

/** Mirrors apps/api/internal/httpapi/profile.go. */
const publicUser = ({ password: _pw, createdAt: _c, ...user }: SeedUser) => user;
const invalid = (message: string) => HttpResponse.json({ message }, { status: 400 });

export const profileHandlers = [
  http.patch('/api/me', async ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const body = (await request.json()) as { name?: string; locale?: string };
    const user = db.users.find((u) => u.id === me.id)!;
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name || name.length > 100) return invalid('name is required (at most 100 characters)');
      user.name = name;
    }
    if (body.locale !== undefined) {
      user.locale = (['pt-BR', 'de'].includes(body.locale) ? body.locale : 'en') as Locale;
    }
    return HttpResponse.json(publicUser(user));
  }),

  http.post('/api/me/email', async ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const body = (await request.json()) as { email: string; password: string };
    const user = db.users.find((u) => u.id === me.id)!;
    const email = body.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+$/.test(email)) return invalid('a valid email is required');
    if (user.password !== body.password) return invalid('password is incorrect');
    if (email === user.email) return invalid('that is already your email');
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return HttpResponse.json(
        { message: 'an account with this email already exists' },
        { status: 409 },
      );
    }
    const token = nextId('email');
    db.emailTokens[token] = { userId: user.id, email };
    console.info(`[mock mail] confirm link for ${email}: /confirm-email?token=${token}`);
    return HttpResponse.json({ email }, { status: 202 });
  }),

  http.post('/api/me/email/confirm', async ({ request }) => {
    const { token } = (await request.json()) as { token: string };
    const pending = db.emailTokens[token];
    if (!pending) return invalid('this confirmation link is invalid or has expired');
    delete db.emailTokens[token];
    const user = db.users.find((u) => u.id === pending.userId)!;
    user.email = pending.email;
    return HttpResponse.json(publicUser(user));
  }),
];
