/**
 * useServices — Controller hook para a entidade Serviço.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

const QUERY_KEY = 'services';

// ── Queries ───────────────────────────────────────────────────────────────────

export function useServices(sort) {
  return useQuery({
    queryKey: [QUERY_KEY, sort],
    queryFn:  () => apiClient.entities.Service.list(sort),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [QUERY_KEY] });
}

export function useCreateService() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data)         => apiClient.entities.Service.create(data),
    onSuccess:  invalidate,
  });
}

export function useUpdateService() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Service.update(id, data),
    onSuccess:  invalidate,
  });
}

export function useDeleteService() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id)           => apiClient.entities.Service.delete(id),
    onSuccess:  invalidate,
  });
}
