import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consumablesApi } from '@/lib/api/consumables';
import type {
  ConsumableFilters,
  CreateConsumableRequest,
} from '@/types';

/**
 * Fetches a paginated, filterable list of consumable items.
 * Automatically refetches when filters change.
 */
export function useConsumables(filters?: ConsumableFilters) {
  return useQuery({
    queryKey: ['consumables', filters],
    queryFn: () => consumablesApi.getAll(filters),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetches a single consumable item by its ID.
 * Only enabled when a valid ID is provided.
 */
export function useConsumableById(id: string) {
  return useQuery({
    queryKey: ['consumables', id],
    queryFn: () => consumablesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Fetches consumable items that are expiring within 30 days or have low stock.
 * Used by the dashboard and alerts panels to warn about stock issues.
 */
export function useStockAlerts(expiryBefore?: string) {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  const expiryDate = expiryBefore || defaultDate.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['consumables', 'stock-alerts', expiryDate],
    queryFn: () => consumablesApi.getAll({ expiry_before: expiryDate }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Creates a new consumable record.
 * On success, invalidates the consumables list cache.
 */
export function useCreateConsumable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConsumableRequest) =>
      consumablesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
    },
  });
}

/**
 * Updates an existing consumable item.
 * On success, invalidates both the consumables list and the specific item cache.
 */
export function useUpdateConsumable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateConsumableRequest>;
    }) => consumablesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
      queryClient.invalidateQueries({
        queryKey: ['consumables', variables.id],
      });
    },
  });
}

/**
 * Deletes a consumable item by its ID.
 * On success, invalidates the consumables list cache.
 */
export function useDeleteConsumable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => consumablesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
    },
  });
}
