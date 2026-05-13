'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const raw = await api.get<{ id: string; name: string; slug: string }[] | string[]>('/prompts/categories');
      // API returns [{id, name, slug}] — extract names and prepend 'All'
      const names = raw.map((c) => (typeof c === 'string' ? c : c.name));
      return ['All', ...names.filter((n) => n !== 'All')];
    },
    staleTime: 5 * 60_000,
  });
}