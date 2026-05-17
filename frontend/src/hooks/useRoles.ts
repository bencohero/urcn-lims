import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, type RoleUpdateRequest } from '@/lib/api/roles';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoleUpdateRequest }) =>
      rolesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
