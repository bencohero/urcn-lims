import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';
import type { SearchParams } from '@/lib/api/search';

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchApi.search(params),
    enabled: params.q.length >= 2,
    staleTime: 30_000,
  });
}
