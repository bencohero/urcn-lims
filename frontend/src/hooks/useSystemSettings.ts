import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingsApi } from '@/lib/api/systemSettings';

export function useSystemSettings(category?: string) {
  return useQuery({
    queryKey: ['system-settings', category],
    queryFn: () => systemSettingsApi.getAll(category),
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: unknown }) =>
      systemSettingsApi.update(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}
