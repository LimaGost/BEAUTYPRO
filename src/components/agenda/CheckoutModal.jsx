import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, CheckCircle, CreditCard, Banknote, Smartphone, DollarSign } from 'lucide-react';
import { fmtMoney, toNum } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro', icon: Banknote, color: 'text-green-600' },
  { value: 'pix', label: 'PIX / Transferência', icon: Smartphone, color: 'text-blue-600' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard, color: 'text-purple-600' },
  { value: 'debit_card', label: 'Cartão de Débito', icon: CreditCard, color: 'text-amber-600' },
  { value: 'courtesy', label: 'Cortesia', icon: DollarSign, color: 'text-gray-500' },
];

export default function CheckoutModal({ isOpen, onClose, appointment, onComplete }) {
  const [payments, setPayments] = useState([
    { method: 'cash', amount: appointment?.total_amount || 0 }
  ]);

  const totalAmount = appointment?.total_amount || 0;
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = totalAmount - totalPaid;

  useEffect(() => {
    if (appointment) {
      setPayments([{ method: 'cash', amount: appointment.total_amount || 0 }]);
    }
  }, [appointment]);

  const addPayment = () => {
    setPayments([...payments, { method: 'cash', amount: remaining > 0 ? remaining : 0 }]);
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setPayments(newPayments);
  };

  const handleComplete = () => {
    if (remaining !== 0) {
      alert('O valor total dos pagamentos deve ser igual ao valor do atendimento');
      return;
    }
    onComplete(payments);
  };

  if (!isOpen || !appointment) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl">Efetivar Pagamento</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-90 mb-1">Cliente</p>
              <p className="font-semibold text-lg">{appointment.client_name}</p>
              
              <div className="mt-3 pt-3 border-t border-white/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-90">Total do Atendimento</span>
                  <span className="text-2xl font-bold">R$ {fmtMoney(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-700 font-medium">Formas de Pagamento</Label>
                <button
                  onClick={addPayment}
                  className="text-amber-600 text-sm font-medium flex items-center gap-1 hover:text-amber-700"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              {payments.map((payment, index) => {
                const methodInfo = paymentMethods.find(m => m.value === payment.method);
                const Icon = methodInfo?.icon || Banknote;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-white ${methodInfo?.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <Select
                          value={payment.method}
                          onValueChange={(value) => updatePayment(index, 'method', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map(method => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            R$
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            value={payment.amount}
                            onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                            className="pl-10 font-semibold text-lg"
                          />
                        </div>
                      </div>

                      {payments.length > 1 && (
                        <button
                          onClick={() => removePayment(index)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total a receber:</span>
                <span className="font-semibold">R$ {fmtMoney(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total recebido:</span>
                <span className="font-semibold">R$ {fmtMoney(totalPaid)}</span>
              </div>
              <div className="h-px bg-gray-300 my-2" />
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Restante:</span>
                <span className={`text-xl font-bold ${
                  remaining === 0 ? 'text-green-600' : remaining > 0 ? 'text-red-500' : 'text-blue-600'
                }`}>
                  R$ {fmtMoney(Math.abs(remaining))}
                  {remaining < 0 && ' (Troco)'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <Button
              onClick={handleComplete}
              disabled={remaining !== 0}
              className="w-full h-14 text-lg font-semibold gold-gradient text-black rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {remaining === 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Confirmar Pagamento
                </span>
              ) : (
                `Faltam R$ ${fmtMoney(remaining)}`
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}