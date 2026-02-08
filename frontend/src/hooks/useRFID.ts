import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rfidApi } from '@/lib/api/rfid';
import type { RFIDFilters, EncodeTagRequest, ReadTagRequest, BulkReadRequest } from '@/types';

export function useRFIDTags(filters?: RFIDFilters) {
  return useQuery({
    queryKey: ['rfid-tags', filters],
    queryFn: () => rfidApi.getTags(filters),
    placeholderData: (prev) => prev,
  });
}

export function useRFIDTagById(id: string) {
  return useQuery({
    queryKey: ['rfid-tags', id],
    queryFn: () => rfidApi.getTagById(id),
    enabled: !!id,
  });
}

export function useEncodeTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EncodeTagRequest) => rfidApi.encodeTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid-tags'] });
    },
  });
}

export function useReadTag() {
  return useMutation({
    mutationFn: (payload: ReadTagRequest) => rfidApi.readTag(payload),
  });
}

export function useBulkRead() {
  return useMutation({
    mutationFn: (payload: BulkReadRequest) => rfidApi.bulkRead(payload),
  });
}

export function useInventoryReport(locationId: string, siteId?: string) {
  return useQuery({
    queryKey: ['rfid', 'inventory-report', locationId, siteId],
    queryFn: () => rfidApi.getInventoryReport({ location_id: locationId, site_id: siteId }),
    enabled: !!locationId,
  });
}
