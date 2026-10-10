import { http, HttpResponse } from 'msw';

import type { MaterialItem, MaterialType } from '@/features/materials/types';

import { db, nextId } from '../db';
import { currentUser, forbidden, unauthorized } from './utils';

interface CreateMaterialBody {
  type: MaterialType;
  title: string;
  url: string;
  author?: string;
  description?: string;
  tags: string[];
  relatedQuestionIds?: string[];
}

export const materialHandlers = [
  http.get('/api/materials', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const tags = url.searchParams.getAll('tags').filter(Boolean);
    let items = db.materials;
    if (type) items = items.filter((m) => m.type === type);
    if (tags.length > 0) items = items.filter((m) => tags.some((t) => m.tags.includes(t)));
    return HttpResponse.json(items);
  }),

  // Admin-only content authoring: the mock enforces the role the way a real
  // backend would, so gating is already in place when a backend replaces MSW.
  http.post('/api/materials', async ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    const body = (await request.json()) as CreateMaterialBody;
    const material: MaterialItem = {
      id: nextId('m'),
      type: body.type,
      title: body.title,
      url: body.url,
      author: body.author || undefined,
      description: body.description || undefined,
      tags: body.tags,
      relatedQuestionIds:
        body.relatedQuestionIds && body.relatedQuestionIds.length > 0
          ? [...body.relatedQuestionIds]
          : undefined,
    };
    db.materials.push(material);
    return HttpResponse.json(material, { status: 201 });
  }),

  http.put('/api/materials/:id', async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    const index = db.materials.findIndex((m) => m.id === params.id);
    if (index < 0) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    const body = (await request.json()) as CreateMaterialBody;
    const material: MaterialItem = {
      id: db.materials[index].id,
      type: body.type,
      title: body.title,
      url: body.url,
      author: body.author || undefined,
      description: body.description || undefined,
      tags: body.tags,
      relatedQuestionIds:
        body.relatedQuestionIds && body.relatedQuestionIds.length > 0
          ? [...body.relatedQuestionIds]
          : undefined,
    };
    db.materials[index] = material;
    return HttpResponse.json(material);
  }),

  http.delete('/api/materials/:id', ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();
    if (!db.materials.some((m) => m.id === params.id)) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    db.materials = db.materials.filter((m) => m.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/questions/:id/materials', ({ params }) => {
    const items = db.materials.filter((m) => m.relatedQuestionIds?.includes(String(params.id)));
    return HttpResponse.json(items);
  }),
];
