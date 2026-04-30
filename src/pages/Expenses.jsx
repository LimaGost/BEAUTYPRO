import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight as ChevronRightIcon, Plus, Receipt, Trash2, Check, Search } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EXPENSE_CATEGORIES, EXPENSE_TYPE_LABELS, EXPENSE_FORM_DEFAULT } from '@/models/schemas';
import { useTransactionsByMonth, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';

export default function ExpensesPage() {
  const now = new Date();
  const [year,           setYear]           = useState(now.getFullYear());
  const [month,          setMonth]          = useState(now.getMonth());
  const [searchQuery,    setSearchQuery]    = useState('');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [selectedExpense,setSelectedExpense]= useState(null);
  const [formData,       setFormData]       = useState({ ...EXPENSE_FORM_DEFAULT, date: format(now, 'yyyy-MM-dd') });

  const { data: transactions = [], isLoading } = useTransactionsByMonth('expense', year, month);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  // Month navigation
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const monthLabel = format(new Date(year, month, 1), 'MMMM yyyy', { locale: ptBR });
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const resetForm  = () => { setSelectedExpense(null); setFormData({ ...EXPENSE_FORM_DEFAULT, date: format(now, 'yyyy-MM-dd') }); };
  const closeModal = () => { setModalOpen(false); resetForm(); };

  const openEdit = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      type:         'expense',
      expense_type: expense.expense_type || 'regular',
      amount:       expense.amount       || 0,
      date:         expense.date         || format(now, 'yyyy-MM-dd'),
      description:  expense.description  || '',
      category:     expense.category     || '',
      paid:         expense.paid         ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const mutation = selectedExpense
      ? updateTransaction.mutateAsync({ id: selectedExpense.id, data: formData })
      : createTransaction.mutateAsync(formData);
    mutation.then(closeModal).catch(() => {});
  };

  const set = (field) => (value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const filtered = transactions.filter(
    (t) =>
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const grouped = filtered.reduce((acc, expense) => {
    const cat = expense.category || 'Sem categoria';
    if (!acc[cat]) acc[cat] = { items: [], total: 0 };
    acc[cat].items.push(expense);
    acc[cat].total += expense.amount || 0;
    return acc;
  }, {});

  const total   = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const paid    = filtered.filter((e) => e.paid).reduce((s, e) => s + (e.amount || 0), 0);
  const pending = total - paid;

  return (
    <div className="min-h-screen page-bg">
      {/* Month navigator */}
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-base font-semibold capitalize">{monthLabel}</p>
          {isCurrentMonth && (
            <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide mt-0.5">Mês atual</p>
          )}
        </div>

        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white border-b border-black/[0.07] px-4 py-3 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-lg font-bold text-red-500">R$ {fmtMoney(total)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Total</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <p className="text-lg font-bold text-emerald-600">R$ {fmtMoney(paid)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Pago</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-600">R$ {fmtMoney(pending)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Pendente</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white px-4 py-3 border-b border-black/[0.07]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar despesa..."
            className="pl-9 h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="pb-28">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-28" />
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {searchQuery ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa neste mês'}
            </h3>
            <p className="text-sm text-gray-400 text-center">
              {searchQuery ? 'Tente outro termo' : 'Toque em + para registrar uma despesa'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, data]) => (
            <div key={category}>
              {/* Category header */}
              <div className="cat-divider">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-red-400" />
                  <span className="cat-divider-label">{category}</span>
                </div>
                <span className="text-[11px] font-semibold text-red-400">R$ {fmtMoney(data.total)}</span>
              </div>

              {/* Expense rows */}
              {data.items.map((expense, idx) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => openEdit(expense)}
                  className="list-row"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="font-medium text-gray-900 text-sm">{expense.description}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(expense.date), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-500">R$ {fmtMoney(expense.amount)}</p>
                      {expense.paid ? (
                        <span className="badge-green">Pago</span>
                      ) : (
                        <span className="badge-amber">Pendente</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => { resetForm(); setModalOpen(true); }}
        className="fixed right-5 gold-gradient shadow-xl flex items-center justify-center z-30 rounded-full w-14 h-14"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus className="w-6 h-6 text-black" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button onClick={closeModal} className="text-amber-600 font-semibold text-sm">Fechar</button>
                <h2 className="font-bold text-gray-900">
                  {selectedExpense ? 'Editar Despesa' : 'Nova Despesa'}
                </h2>
                <div className="w-14" />
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                {/* Tipo */}
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de despesa</Label>
                  <div className="flex gap-2 mt-2">
                    {Object.entries(EXPENSE_TYPE_LABELS).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => set('expense_type')(type)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          formData.expense_type === type
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pago */}
                <div className="flex items-center justify-between py-1 px-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Status de pagamento</p>
                    <p className="text-xs text-gray-400">Despesa já foi paga?</p>
                  </div>
                  <Switch checked={formData.paid} onCheckedChange={set('paid')} />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</Label>
                  <Input value={formData.description} onChange={(e) => set('description')(e.target.value)} placeholder="Descrição da despesa" className="mt-1.5 h-11 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</Label>
                    <Input type="number" step="0.01" value={formData.amount} onChange={(e) => set('amount')(parseFloat(e.target.value) || 0)} className="mt-1.5 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</Label>
                    <Input type="date" value={formData.date} onChange={(e) => set('date')(e.target.value)} className="mt-1.5 h-11 rounded-xl" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</Label>
                  <Select value={formData.category} onValueChange={set('category')}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                      <SelectValue placeholder="Selecionar categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-2">
                <Button onClick={handleSave} className="w-full gold-gradient text-black font-bold h-12 rounded-xl">
                  Salvar
                </Button>
                {selectedExpense && (
                  <Button
                    variant="outline"
                    onClick={() => deleteTransaction.mutate(selectedExpense.id, { onSuccess: closeModal })}
                    className="w-full text-red-500 border-red-200 h-11 rounded-xl text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir despesa
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
