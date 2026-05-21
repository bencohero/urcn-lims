import { useQuery, useMutation } from '@tanstack/react-query';
import { auditTrailApi } from '@/lib/api/auditTrail';
import type { AuditTrailFilters } from '@/types';

export function useAuditTrail(filters?: AuditTrailFilters) {
  return useQuery({
    queryKey: ['audit-trail', filters],
    queryFn: () => auditTrailApi.getAll(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAuditTrailByRecord(tableName: string, recordId: string) {
  return useQuery({
    queryKey: ['audit-trail', 'record', tableName, recordId],
    queryFn: () => auditTrailApi.getByRecord(tableName, recordId),
    enabled: !!tableName && !!recordId,
  });
}

export function useAuditTrailByEntity(entityType: string, entityId: string) {
  return useAuditTrailByRecord(entityType, entityId);
}

export function useAuditStatistics(params?: { from_timestamp?: string; to_timestamp?: string }) {
  return useQuery({
    queryKey: ['audit-trail', 'statistics', params],
    queryFn: () => auditTrailApi.getStatistics(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVerifyIntegrity() {
  return useMutation({
    mutationFn: (limit?: number) => auditTrailApi.verifyIntegrity(limit),
  });
}
