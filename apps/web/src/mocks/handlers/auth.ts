import { http, HttpResponse } from 'msw';

import { db, nextId } from '../db';
import { currentUser, tokenFor, unauthorized } from './utils';
import type { SeedUser } from '../seed/users';

const publicUser = ({ password: _pw, ...user }: SeedUser) => user;
const invalid = (message: string) => HttpResponse.json({ message }, { status: 400 });
const passwordProblem = (pw: string) =>
  pw.length < 8 ? 'password must be at least 8 characters' : null;

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!user) {
      return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    return HttpResponse.json({ token: tokenFor(user.id), user: publicUser(user) });
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string; password: string };
    const name = body.name?.trim() ?? '';
    const email = body.email?.trim().toLowerCase() ?? '';
    if (!name) return invalid('name is required (at most 100 characters)');
    if (!/^[^@\s]+@[^@\s]+$/.test(email)) return invalid('a valid email is required');
    const problem = passwordProblem(body.password ?? '');
    if (problem) return invalid(problem);
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return HttpResponse.json(
        { message: 'an account with this email already exists' },
        { status: 409 },
      );
    }
    const user: SeedUser = {
      id: nextId('u'),
      name,
      email,
      password: body.password,
      locale: 'en',
      role: 'user',
    };
    db.users.push(user);
    return HttpResponse.json({ token: tokenFor(user.id), user: publicUser(user) }, { status: 201 });
  }),

  // The token is a stateless stub, so logout is client-side (token removal).
  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),

  http.get('/api/auth/me', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    return HttpResponse.json(user);
  }),

  http.post('/api/auth/password', async ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const body = (await request.json()) as { currentPassword: string; newPassword: string };
    const user = db.users.find((u) => u.id === me.id)!;
    if (user.password !== body.currentPassword) return invalid('current password is incorrect');
    const problem = passwordProblem(body.newPassword ?? '');
    if (problem) return invalid(problem);
    user.password = body.newPassword;
    return new HttpResponse(null, { status: 204 });
  }),

  // Same contract as the Go API: always 202. The mock has no mailer, so the
  // reset link is printed to the browser console instead.
  http.post('/api/auth/password-reset', async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    const user = db.users.find((u) => u.email.toLowerCase() === email?.trim().toLowerCase());
    if (user) {
      const token = nextId('reset');
      db.resetTokens[token] = user.id;
      console.info(`[mock mail] reset link for ${user.email}: /reset-password?token=${token}`);
    }
    return HttpResponse.json(
      { message: 'If an account exists for that email, a reset link is on its way.' },
      { status: 202 },
    );
  }),

  http.post('/api/auth/password-reset/confirm', async ({ request }) => {
    const { token, password } = (await request.json()) as { token: string; password: string };
    const userId = db.resetTokens[token];
    if (!userId) return invalid('this reset link is invalid or has expired');
    const problem = passwordProblem(password ?? '');
    if (problem) return invalid(problem);
    delete db.resetTokens[token];
    db.users.find((u) => u.id === userId)!.password = password;
    return new HttpResponse(null, { status: 204 });
  }),
];
