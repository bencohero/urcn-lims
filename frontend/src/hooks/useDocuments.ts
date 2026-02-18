import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import type {
  DocumentFilters,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '@/types';

/**
 * Fetches a paginated, filterable list of documents.
 * Automatically refetches when filters change.
 */
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentsApi.getAll(filters),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetches a single document by its ID.
 * Only enabled when a valid ID is provided.
 */
export function useDocumentById(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Fetches the audit/change history for a specific document.
 * Returns an array of AuditEntry records showing all mutations.
 */
export function useDocumentHistory(id: string) {
  return useQuery({
    queryKey: ['documents', id, 'history'],
    queryFn: () => documentsApi.getHistory(id),
    enabled: !!id,
  });
}

/**
 * Creates a new document record.
 * On success, invalidates the documents list cache to show the new entry.
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDocumentRequest) =>
      documentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/**
 * Updates an existing document.
 * On success, invalidates both the documents list and the specific document cache.
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentRequest }) =>
      documentsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.id] });
    },
  });
}

/**
 * Deletes a document by its ID.
 * On success, invalidates the documents list cache.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
