import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '@/lib/api/roles';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
    staleTime: 5 * 60 * 1000, // roles rarely change
  });
}
