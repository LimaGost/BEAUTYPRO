/**
 * useClients — Controller hook para a entidade Cliente.
 *
 * Isola toda a lógica de dados das Views (páginas).
 * As páginas importam apenas as funções que precisam e não
 * tocam diretamente no apiClient.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

const QUERY_KEY = 'clients';

// ── Queries ───────────────────────────────────────────────────────────────────

/** Lista todos os clientes. Padrão: ordenados por total gasto (maior primeiro) */
export function useClients(sort = '-total_spent') {
  return useQuery({
    queryKey: [QUERY_KEY, sort],
    queryFn:  () => apiClient.entities.Client.list(sort),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Invalida o cache de clientes após qualquer operação de escrita */
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [QUERY_KEY] });
}

export function useCreateClient() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data)         => apiClient.entities.Client.create(data),
    onSuccess:  invalidate,
  });
}

export function useUpdateClient() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Client.update(id, data),
    onSuccess:  invalidate,
  });
}

export function useDeleteClient() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id)           => apiClient.entities.Client.delete(id),
    onSuccess:  invalidate,
  });
}
