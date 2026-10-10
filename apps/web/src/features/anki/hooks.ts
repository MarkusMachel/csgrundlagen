import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, AUTH_TOKEN_KEY } from '@/shared/api/client';

import type { AnkiCard } from './parseAnki';

export type AnkiSource =
  | { source: 'bookmarks' }
  | { source: 'test'; id: string }
  | {
      source: 'filter';
      tags?: string[];
      difficulties?: string[];
      search?: string;
      status?: string;
    };

function exportUrl(src: AnkiSource) {
  const params = new URLSearchParams();
  if (src.source === 'bookmarks') params.set('source', 'bookmarks');
  else if (src.source === 'test') {
    params.set('source', 'test');
    params.set('id', src.id);
  } else {
    src.tags?.forEach((t) => params.append('tags', t));
    src.difficulties?.forEach((d) => params.append('difficulty', d));
    if (src.search) params.set('search', src.search);
    if (src.status) params.set('status', src.status);
  }
  return `/api/export/anki?${params}`;
}

/** Downloads an Anki import file (the API sets the file name). */
export function useAnkiExport() {
  return useMutation({
    mutationFn: async (src: AnkiSource) => {
      let token = '';
      try {
        token = localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
      } catch {
        // storage unavailable
      }
      const res = await fetch(exportUrl(src), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`export failed (${res.status})`);
      const name =
        res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        'cs-trainer-anki.txt';
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export function useImportFlashcards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { cards: AnkiCard[]; defaultTags: string[] }) =>
      api.post<ImportResult>('/admin/import/flashcards', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['questions'] });
      void queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
