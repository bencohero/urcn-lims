import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  movementsApi,
  type MovementFilters,
  type CreateMovementRequest,
} from '@/lib/api/movements';

export function useMovements(filters?: MovementFilters) {
  return useQuery({
    queryKey: ['movements', filters],
    queryFn: () => movementsApi.getAll(filters),
    placeholderData: (prev) => prev,
  });
}

export function useMovementById(id: string) {
  return useQuery({
    queryKey: ['movements', id],
    queryFn: () => movementsApi.getById(id),
    enabled: !!id,
  });
}

export function useOverdueMovements() {
  return useQuery({
    queryKey: ['movements', 'overdue'],
    queryFn: () => movementsApi.getOverdue(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMovementRequest) => movementsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
    },
  });
}

export function useRecordReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => movementsApi.recordReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
    },
  });
}
