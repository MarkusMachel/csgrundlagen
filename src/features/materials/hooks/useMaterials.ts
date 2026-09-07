import { useQuery } from '@tanstack/react-query';

import { api } from '@/shared/api/client';

import type { MaterialItem, MaterialType } from '../types';

export interface MaterialsFilter {
  type?: MaterialType | '';
  tags?: string[];
}

export function useMaterials(filter: MaterialsFilter = {}) {
  const { type = '', tags = [] } = filter;
  return useQuery({
    queryKey: ['materials', { type, tags }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      tags.forEach((t) => params.append('tags', t));
      const qs = params.toString();
      return api.get<MaterialItem[]>(`/materials${qs ? `?${qs}` : ''}`);
    },
  });
}
