/**
 * useProfessionals — Controller hook para a entidade Profissional.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

const QUERY_KEY = 'professionals';

// ── Queries ───────────────────────────────────────────────────────────────────

export function useProfessionals(sort) {
  return useQuery({
    queryKey: [QUERY_KEY, sort],
    queryFn:  () => apiClient.entities.Professional.list(sort),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [QUERY_KEY] });
}

export function useCreateProfessional() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data)         => apiClient.entities.Professional.create(data),
    onSuccess:  invalidate,
  });
}

export function useUpdateProfessional() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Professional.update(id, data),
    onSuccess:  invalidate,
  });
}

export function useDeleteProfessional() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id)           => apiClient.entities.Professional.delete(id),
    onSuccess:  invalidate,
  });
}
