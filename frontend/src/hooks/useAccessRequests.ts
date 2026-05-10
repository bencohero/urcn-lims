import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessRequestsApi } from '@/lib/api/accessRequests';
import type {
  AccessRequestFilters,
  CreateAccessRequestRequest,
  ApproveAccessRequestRequest,
  RejectAccessRequestRequest,
  FulfillAccessRequestRequest,
  ReturnAccessRequestRequest,
  ExtendAccessRequestRequest,
} from '@/types';

/**
 * Fetches a paginated, filterable list of access requests.
 * Includes requests across all workflow states (PENDING, APPROVED, etc.).
 */
export function useAccessRequests(filters?: AccessRequestFilters) {
  return useQuery({
    queryKey: ['access-requests', filters],
    queryFn: () => accessRequestsApi.getAll(filters),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetches a single access request by its ID.
 * Only enabled when a valid ID is provided.
 */
export function useAccessRequestById(id: string) {
  return useQuery({
    queryKey: ['access-requests', id],
    queryFn: () => accessRequestsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Creates a new access request for a stored item.
 * On success, invalidates the access requests list and related notifications.
 */
export function useCreateAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAccessRequestRequest) =>
      accessRequestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Approves a pending access request with duration and optional notes.
 * Transitions the request from PENDING to APPROVED.
 * On success, invalidates the access requests list and the specific request.
 */
export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ApproveAccessRequestRequest;
    }) => accessRequestsApi.approve(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['access-requests', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Rejects a pending access request with a required reason.
 * Transitions the request from PENDING to REJECTED.
 */
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: RejectAccessRequestRequest;
    }) => accessRequestsApi.reject(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['access-requests', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Marks an approved access request as fulfilled (item physically handed over).
 * Transitions the request from APPROVED to FULFILLED.
 */
export function useFulfillRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FulfillAccessRequestRequest;
    }) => accessRequestsApi.fulfill(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['access-requests', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
    },
  });
}

/**
 * Records the return of an item from a fulfilled access request.
 * Transitions the request from FULFILLED to RETURNED.
 */
export function useReturnRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReturnAccessRequestRequest;
    }) => accessRequestsApi.return(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['access-requests', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
    },
  });
}

/**
 * Requests an extension for a fulfilled access request loan period.
 * Only one extension is allowed per access request.
 */
export function useExtendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ExtendAccessRequestRequest;
    }) => accessRequestsApi.extend(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['access-requests', variables.id],
      });
    },
  });
}

/**
 * Cancels a pending access request.
 */
export function useCancelRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accessRequestsApi.cancel(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['access-requests', id] });
    },
  });
}

/**
 * Approves an extension request for a fulfilled access request.
 */
export function useApproveExtension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accessRequestsApi.approveExtension(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['access-requests', id] });
    },
  });
}
