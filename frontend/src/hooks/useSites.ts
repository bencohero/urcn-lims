import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi, type CreateSiteRequest, type UpdateSiteRequest } from '@/lib/api/sites';
import type { SiteFilters } from '@/types';

export function useSiteMembers(id: string) {
  return useQuery({
    queryKey: ['sites', id, 'members'],
    queryFn: () => sitesApi.getMembers(id),
    enabled: !!id,
  });
}

export function useSites(filters?: SiteFilters) {
  return useQuery({
    queryKey: ['sites', filters],
    queryFn: () => sitesApi.getAll(filters),
    placeholderData: (prev) => prev,
  });
}

export function useSiteById(id: string) {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: () => sitesApi.getById(id),
    enabled: !!id,
  });
}

export function useSiteLocations(id: string) {
  return useQuery({
    queryKey: ['sites', id, 'locations'],
    queryFn: () => sitesApi.getLocations(id),
    enabled: !!id,
  });
}

export function useSiteCapacity(id: string) {
  return useQuery({
    queryKey: ['sites', id, 'capacity'],
    queryFn: () => sitesApi.getCapacity(id),
    enabled: !!id,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSiteRequest) => sitesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSiteRequest }) =>
      sitesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['sites', variables.id] });
    },
  });
}
