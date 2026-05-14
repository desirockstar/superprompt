'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SuggestResponse } from '@/lib/types/suggest';

export function useSuggest(
  query: string,
  types?: string[],
  limit = 10,
) {
  return useQuery<SuggestResponse>({
    queryKey: ['suggest', query, types, limit],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = { q: query, limit };
      if (types?.length) {
        params.types = types.join(',');
      }
      return api.get<SuggestResponse>('/suggest', params);
    },
    enabled: query.trim().length >= 1,
    staleTime: 60_000,
  });
}