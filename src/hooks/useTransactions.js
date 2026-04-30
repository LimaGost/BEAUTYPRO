/**
 * useTransactions — Controller hook para a entidade Transação.
 *
 * Cobre tanto receitas (type='income') quanto despesas (type='expense').
 * O filtro de data é feito no cliente porque o backend não suporta
 * queries de range (gte/lte) — apenas igualdade exata.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { format, endOfMonth } from 'date-fns';

const QUERY_KEY = 'transactions';

// ── Queries ───────────────────────────────────────────────────────────────────

/** Lista todas as transações de um dado tipo (income | expense) */
export function useTransactions(type) {
  return useQuery({
    queryKey: [QUERY_KEY, type],
    queryFn:  () => apiClient.entities.Transaction.filter({ type }),
  });
}

/**
 * Lista transações de um tipo filtradas por mês/ano.
 * O filtro de intervalo de datas é aplicado localmente após o fetch.
 */
export function useTransactionsByMonth(type, year, month) {
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
  const endDate   = format(endOfMonth(new Date(year, month, 1)), 'yyyy-MM-dd');

  return useQuery({
    queryKey: [QUERY_KEY, type, year, month],
    queryFn: async () => {
      const all = await apiClient.entities.Transaction.filter({ type });
      return all.filter(t => t.date >= startDate && t.date <= endDate);
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    // Invalida também 'expenses' caso alguém use a query key legada
    qc.invalidateQueries({ queryKey: ['expenses'] });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data)         => apiClient.entities.Transaction.create(data),
    onSuccess:  invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Transaction.update(id, data),
    onSuccess:  invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id)           => apiClient.entities.Transaction.delete(id),
    onSuccess:  invalidate,
  });
}
