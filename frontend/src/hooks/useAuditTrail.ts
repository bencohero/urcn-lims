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

export function useAuditTrailByEntity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['audit-trail', 'entity', entityType, entityId],
    queryFn: () => auditTrailApi.getByEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useVerifyIntegrity() {
  return useMutation({
    mutationFn: () => auditTrailApi.verifyIntegrity(),
  });
}
