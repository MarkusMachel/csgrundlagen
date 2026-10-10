import { useQuery } from '@tanstack/react-query';

import type { DesignQuestion, QuestionsPage } from '@/features/questions';
import { api } from '@/shared/api/client';
import { useUIStore } from '@/stores/useUIStore';

/** Every system design challenge (they're listed apart from the feed). */
export function useDesignChallenges() {
  const locale = useUIStore((s) => s.locale);
  return useQuery({
    queryKey: ['questions', 'design', locale],
    queryFn: () => api.get<QuestionsPage>(`/questions?type=design&pageSize=50&locale=${locale}`),
    select: (page) => page.items.filter((q): q is DesignQuestion => q.type === 'design'),
  });
}
