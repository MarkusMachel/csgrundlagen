import { HttpResponse } from 'msw';

import type { Question } from '@/features/questions/types';
import type { Locale, User } from '@/shared/types';

import { localizeQuestion, seedQuestions } from '../seed/questions';
import { seedUsers } from '../seed/users';

/**
 * The mock token stub encodes the user id (`mock-token.<userId>`), so the
 * session survives page reloads even though the mock "backend" lives in page
 * memory (§2: session persists via /auth/me + local storage token stub).
 */
export function tokenFor(userId: string): string {
  return `mock-token.${userId}`;
}

export function currentUser(request: Request): User | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  if (!token.startsWith('mock-token.')) return null;
  const userId = token.slice('mock-token.'.length);
  const user = seedUsers.find((u) => u.id === userId);
  if (!user) return null;
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

export function unauthorized() {
  return HttpResponse.json({ message: 'Not authenticated' }, { status: 401 });
}

export function localeOf(request: Request): Locale {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale');
  return locale === 'pt-BR' || locale === 'de' ? locale : 'en';
}

export function allQuestions(locale: Locale): Question[] {
  return seedQuestions.map((s) => localizeQuestion(s, locale));
}

export function findQuestion(id: string, locale: Locale): Question | undefined {
  const seed = seedQuestions.find((s) => s.question.id === id);
  return seed ? localizeQuestion(seed, locale) : undefined;
}
