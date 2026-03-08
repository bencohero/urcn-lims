import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studiesApi, type CreateStudyRequest, type UpdateStudyRequest } from '@/lib/api/studies';
import type { StudyFilters } from '@/types';

export function useStudies(filters?: StudyFilters) {
  return useQuery({
    queryKey: ['studies', filters],
    queryFn: () => studiesApi.getAll(filters),
    placeholderData: (prev) => prev,
  });
}

export function useStudyById(id: string) {
  return useQuery({
    queryKey: ['studies', id],
    queryFn: () => studiesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudyRequest) => studiesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studies'] });
    },
  });
}

export function useUpdateStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStudyRequest }) =>
      studiesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studies'] });
      queryClient.invalidateQueries({ queryKey: ['studies', variables.id] });
    },
  });
}

export function useDeleteStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studies'] });
    },
  });
}
