/**
 * useProducts — Controller hook para a entidade Produto.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

const QUERY_KEY = 'products';

// ── Queries ───────────────────────────────────────────────────────────────────

export function useProducts(sort) {
  return useQuery({
    queryKey: [QUERY_KEY, sort],
    queryFn:  () => apiClient.entities.Product.list(sort),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [QUERY_KEY] });
}

export function useCreateProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data)         => apiClient.entities.Product.create(data),
    onSuccess:  invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Product.update(id, data),
    onSuccess:  invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id)           => apiClient.entities.Product.delete(id),
    onSuccess:  invalidate,
  });
}
