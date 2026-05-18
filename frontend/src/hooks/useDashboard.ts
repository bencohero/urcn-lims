import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';

export function useDashboardStatistics(params?: {
  study_id?: string;
  site_id?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}) {
  return useQuery({
    queryKey: ['dashboard', 'statistics', params],
    queryFn: () => reportsApi.getStatistics(params),
    staleTime: 2 * 60 * 1000,
  });
}
