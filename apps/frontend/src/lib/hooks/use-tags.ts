'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const raw = await api.get<{ id: string; name: string; slug: string }[] | string[]>('/prompts/tags');
      const names = raw.map((t) => (typeof t === 'string' ? t : t.name));
      return ['All', ...names.filter((n) => n !== 'All')];
    },
    staleTime: 5 * 60_000,
  });
}