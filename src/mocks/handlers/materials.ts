import { http, HttpResponse } from 'msw';

import { seedMaterials } from '../seed/materials';

export const materialHandlers = [
  http.get('/api/materials', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const tags = url.searchParams.getAll('tags').filter(Boolean);
    let items = seedMaterials;
    if (type) items = items.filter((m) => m.type === type);
    if (tags.length > 0) items = items.filter((m) => tags.some((t) => m.tags.includes(t)));
    return HttpResponse.json(items);
  }),

  http.get('/api/questions/:id/materials', ({ params }) => {
    const items = seedMaterials.filter((m) => m.relatedQuestionIds?.includes(String(params.id)));
    return HttpResponse.json(items);
  }),
];
