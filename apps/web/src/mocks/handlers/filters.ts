import { http, HttpResponse } from 'msw';

import type { SavedFilter } from '@/features/questions/types';

import { db, nextId } from '../db';
import { currentUser, unauthorized } from './utils';

const MAX = 20;
const invalid = (message: string) => HttpResponse.json({ message }, { status: 400 });
const conflict = (message: string) => HttpResponse.json({ message }, { status: 409 });
const notFound = () => HttpResponse.json({ message: 'Not found' }, { status: 404 });

type Spec = SavedFilter['filters'];

/** Mirrors store.FilterSpec.normalize: the problem, or the cleaned filter. */
function normalize(raw: Partial<Spec> | undefined): string | Spec {
  const f = {
    search: (raw?.search ?? '').trim(),
    tags: raw?.tags ?? [],
    difficulties: raw?.difficulties ?? [],
    status: raw?.status ?? '',
    sort: raw?.sort || 'oldest',
    seed: raw?.seed ?? '',
  };
  if (f.search.length > 200 || f.seed.length > 20 || f.tags.length > 30)
    return 'filter is too long';
  if (!f.difficulties.every((d) => ['easy', 'medium', 'hard'].includes(d))) {
    return 'difficulties must be easy, medium or hard';
  }
  if (!['', 'unanswered', 'answered', 'wrong', 'bookmarked'].includes(f.status)) {
    return 'status must be unanswered, answered, wrong or bookmarked';
  }
  if (!['oldest', 'newest', 'random'].includes(f.sort))
    return 'sort must be oldest, newest or random';
  return f as Spec;
}

function cleanName(name: unknown): string | null {
  const n = typeof name === 'string' ? name.trim() : '';
  return n && [...n].length <= 60 ? n : null;
}

const publicFilter = ({ userId: _u, ...f }: (typeof db.savedFilters)[number]) => f;

/** Same contract as the Go API's /api/me/filters. */
export const filterHandlers = [
  http.get('/api/me/filters', ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    return HttpResponse.json(
      db.savedFilters
        .filter((f) => f.userId === me.id)
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        .map(publicFilter),
    );
  }),

  http.post('/api/me/filters', async ({ request }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const body = (await request.json()) as { name?: string; filters?: Partial<Spec> };
    const name = cleanName(body.name);
    if (!name) return invalid('name is required (at most 60 characters)');
    const filters = normalize(body.filters);
    if (typeof filters === 'string') return invalid(filters);
    const mine = db.savedFilters.filter((f) => f.userId === me.id);
    if (mine.length >= MAX)
      return conflict('you can keep up to 20 saved filters; delete one first');
    if (mine.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      return conflict('you already have a filter with this name');
    }
    const saved = {
      id: nextId('sf'),
      userId: me.id,
      name,
      filters,
      createdAt: new Date().toISOString(),
    };
    db.savedFilters.push(saved);
    return HttpResponse.json(publicFilter(saved), { status: 201 });
  }),

  http.patch('/api/me/filters/:id', async ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const body = (await request.json()) as { name?: string; filters?: Partial<Spec> };
    const saved = db.savedFilters.find((f) => f.id === params.id && f.userId === me.id);
    let name: string | undefined;
    if (body.name !== undefined) {
      const n = cleanName(body.name);
      if (!n) return invalid('name is required (at most 60 characters)');
      name = n;
    }
    let filters: Spec | undefined;
    if (body.filters !== undefined) {
      const f = normalize(body.filters);
      if (typeof f === 'string') return invalid(f);
      filters = f;
    }
    if (!saved) return notFound();
    if (
      name &&
      db.savedFilters.some(
        (f) =>
          f.userId === me.id && f.id !== saved.id && f.name.toLowerCase() === name!.toLowerCase(),
      )
    ) {
      return conflict('you already have a filter with this name');
    }
    if (name) saved.name = name;
    if (filters) saved.filters = filters;
    return HttpResponse.json(publicFilter(saved));
  }),

  http.delete('/api/me/filters/:id', ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return unauthorized();
    const before = db.savedFilters.length;
    db.savedFilters = db.savedFilters.filter((f) => !(f.id === params.id && f.userId === me.id));
    return db.savedFilters.length < before ? new HttpResponse(null, { status: 204 }) : notFound();
  }),
];
