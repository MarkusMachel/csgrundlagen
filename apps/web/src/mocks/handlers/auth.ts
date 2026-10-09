import { http, HttpResponse } from 'msw';

import { currentUser, tokenFor, unauthorized } from './utils';
import { seedUsers } from '../seed/users';



export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const user = seedUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!user) {
      return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    const { password: _pw, ...publicUser } = user;
    return HttpResponse.json({ token: tokenFor(user.id), user: publicUser });
  }),

  // The token is a stateless stub, so logout is client-side (token removal).
  http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),

  http.get('/api/auth/me', ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    return HttpResponse.json(user);
  }),
];
