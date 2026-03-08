import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  storageApi,
  type StorageLocationFilters,
  type ContainerFilters,
  type CreateStorageLocationRequest,
  type CreateContainerRequest,
} from '@/lib/api/storage';

export function useStorageLocations(filters?: StorageLocationFilters) {
  return useQuery({
    queryKey: ['storage-locations', filters],
    queryFn: () => storageApi.getLocations(filters),
    placeholderData: (prev) => prev,
  });
}

export function useStorageLocationById(id: string) {
  return useQuery({
    queryKey: ['storage-locations', id],
    queryFn: () => storageApi.getLocationById(id),
    enabled: !!id,
  });
}

export function useCreateStorageLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStorageLocationRequest) => storageApi.createLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
    },
  });
}

export function useUpdateStorageLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateStorageLocationRequest>;
    }) => storageApi.updateLocation(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      queryClient.invalidateQueries({ queryKey: ['storage-locations', variables.id] });
    },
  });
}

export function useContainers(filters?: ContainerFilters) {
  return useQuery({
    queryKey: ['containers', filters],
    queryFn: () => storageApi.getContainers(filters),
    placeholderData: (prev) => prev,
    enabled: !!filters?.location_id || filters?.location_id === undefined,
  });
}

export function useCreateContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContainerRequest) => storageApi.createContainer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    },
  });
}

export function useUpdateContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateContainerRequest>;
    }) => storageApi.updateContainer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    },
  });
}
