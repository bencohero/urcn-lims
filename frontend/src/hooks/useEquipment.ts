import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentApi } from '@/lib/api/equipment';
import type {
  EquipmentFilters,
  CreateEquipmentRequest,
} from '@/types';

/**
 * Fetches a paginated, filterable list of equipment items.
 * Automatically refetches when filters change.
 */
export function useEquipment(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: ['equipment', filters],
    queryFn: () => equipmentApi.getAll(filters),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetches a single equipment item by its ID.
 * Only enabled when a valid ID is provided.
 */
export function useEquipmentById(id: string) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Fetches equipment items that have calibration due before a given date.
 * Defaults to items due within the next 30 days.
 * Useful for the dashboard alerts panel.
 */
export function useCalibrationDue(dueBefore?: string) {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  const calibrationDate = dueBefore || defaultDate.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['equipment', 'calibration-due', calibrationDate],
    queryFn: () =>
      equipmentApi.getAll({ calibration_due_before: calibrationDate }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Creates a new equipment record.
 * On success, invalidates the equipment list cache.
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEquipmentRequest) =>
      equipmentApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}

/**
 * Updates an existing equipment item.
 * On success, invalidates both the equipment list and the specific item cache.
 */
export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateEquipmentRequest>;
    }) => equipmentApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
    },
  });
}

/**
 * Deletes an equipment item by its ID.
 * On success, invalidates the equipment list cache.
 */
export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}
