import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Users, TrendingUp, Award } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const periods = [
  { value: 'today', label: 'Hoje' },
  { value: 'week',  label: 'Esta Semana' },
  { value: 'month', label: 'Este Mês' },
  { value: 'year',  label: 'Este Ano' },
];

const fmtBRL = (v) =>
  `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function ReportsPage() {
  const [viewType, setViewType] = useState('company');
  const [period,   setPeriod]   = useState('month');

  const { data: transactions  = [] } = useQuery({
    queryKey: ['transactions-all'],
    queryFn: () => apiClient.entities.Transaction.list(),
  });
  const { data: appointments  = [] } = useQuery({
    queryKey: ['appointments-all'],
    queryFn: () => apiClient.entities.Appointment.list(),
  });
  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => apiClient.entities.Professional.list(),
  });

  // ── Period date range ─────────────────────────────────────────────────────
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = endDate = format(now, 'yyyy-MM-dd');
      break;
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = format(weekAgo, 'yyyy-MM-dd');
      endDate   = format(now,     'yyyy-MM-dd');
      break;
    }
    case 'month':
      startDate = format(startOfMonth(now), 'yyyy-MM-dd');
      endDate   = format(endOfMonth(now),   'yyyy-MM-dd');
      break;
    case 'year':
      startDate = `${now.getFullYear()}-01-01`;
      endDate   = `${now.getFullYear()}-12-31`;
      break;
    default:
      startDate = format(startOfMonth(now), 'yyyy-MM-dd');
      endDate   = format(endOfMonth(now),   'yyyy-MM-dd');
  }

  // ── Filtered data ─────────────────────────────────────────────────────────
  const periodTransactions = transactions.filter(
    (t) => t.date >= startDate && t.date <= endDate,
  );
  const periodAppointments = appointments.filter(
    (a) => a.date >= startDate && a.date <= endDate && a.type !== 'block',
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const income   = periodTransactions.filter((t) => t.type === 'income') .reduce((s, t) => s + (t.amount || 0), 0);
  const expenses = periodTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const profit   = income - expenses;

  const workDays      = new Set(periodAppointments.map((a) => a.date)).size;
  const clientsServed = new Set(periodAppointments.map((a) => a.client_id).filter(Boolean)).size;
  const avgTicket     = periodAppointments.length > 0 ? income / periodAppointments.length : 0;

  const totalMinutes = periodAppointments.reduce((sum, apt) => {
    if (!apt.start_time || !apt.end_time) return sum;
    const [sh, sm] = apt.start_time.split(':').map(Number);
    const [eh, em] = apt.end_time.split(':').map(Number);
    return sum + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);
  const hoursWorked = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;

  // ── Top clients in period ─────────────────────────────────────────────────
  const clientTotals = periodTransactions
    .filter((t) => t.type === 'income' && t.client_id)
    .reduce((acc, t) => {
      const name = t.client_name || 'Cliente';
      acc[name] = (acc[name] || 0) + (t.amount || 0);
      return acc;
    }, {});
  const topClients = Object.entries(clientTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // ── 12-month evolution ────────────────────────────────────────────────────
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const d  = subMonths(now, i);
    const ms = format(startOfMonth(d), 'yyyy-MM-dd');
    const me = format(endOfMonth(d),   'yyyy-MM-dd');
    const mi = transactions.filter((t) => t.type === 'income'  && t.date >= ms && t.date <= me).reduce((s, t) => s + (t.amount || 0), 0);
    const mx = transactions.filter((t) => t.type === 'expense' && t.date >= ms && t.date <= me).reduce((s, t) => s + (t.amount || 0), 0);
    monthlyData.push({ month: format(d, 'MMM', { locale: ptBR }), receita: mi, despesa: mx, lucro: mi - mx });
  }

  // ── 3-year comparison ─────────────────────────────────────────────────────
  const yearlyData = [];
  for (let i = 2; i >= 0; i--) {
    const y  = now.getFullYear() - i;
    const ys = `${y}-01-01`, ye = `${y}-12-31`;
    const yi = transactions.filter((t) => t.type === 'income'  && t.date >= ys && t.date <= ye).reduce((s, t) => s + (t.amount || 0), 0);
    const yx = transactions.filter((t) => t.type === 'expense' && t.date >= ys && t.date <= ye).reduce((s, t) => s + (t.amount || 0), 0);
    yearlyData.push({ year: String(y), receita: yi, despesa: yx, lucro: yi - yx });
  }

  // ── Professional performance (string-compare IDs to avoid int/str mismatch)
  const profPerformance = professionals.map((prof) => {
    const profId   = String(prof.id);
    const profApts = periodAppointments.filter((a) => String(a.professional_id) === profId);
    const profIncome = periodTransactions
      .filter((t) => t.type === 'income' && String(t.professional_id) === profId)
      .reduce((s, t) => s + (t.amount || 0), 0);
    return { name: prof.name, color: prof.color, appointments: profApts.length, income: profIncome };
  }).filter((p) => p.appointments > 0);

  const tooltipStyle = { borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12 };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen page-bg pb-6">
      {/* View Toggle */}
      <div className="bg-white border-b border-gray-100">
        <Tabs value={viewType} onValueChange={setViewType} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent h-12">
            <TabsTrigger
              value="company"
              className="data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none"
            >
              Empresa
            </TabsTrigger>
            <TabsTrigger
              value="professionals"
              className="data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none"
            >
              Profissionais
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Period Selector */}
      <div className="bg-white p-3 border-b border-gray-100">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full h-10 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewType === 'company' ? (
        <>
          {/* Financial balance */}
          <div className="p-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Balanço do período</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                  <p className="text-base font-bold text-emerald-600 leading-tight">{fmtBRL(income)}</p>
                  <p className="text-xs text-emerald-500 mt-1">Receita</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-base font-bold text-red-500 leading-tight">{fmtBRL(expenses)}</p>
                  <p className="text-xs text-red-400 mt-1">Despesa</p>
                </div>
                <div className={`text-center p-3 rounded-xl ${profit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className={`text-base font-bold leading-tight ${profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                    {fmtBRL(profit)}
                  </p>
                  <p className={`text-xs mt-1 ${profit >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>Lucro</p>
                </div>
              </div>
            </div>
          </div>

          {/* Work summary */}
          <div className="px-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Resumo do período</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">{workDays}</p>
                    <p className="text-xs text-gray-500">Dias trabalhados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">{periodAppointments.length}</p>
                    <p className="text-xs text-gray-500">Atendimentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">{clientsServed}</p>
                    <p className="text-xs text-gray-500">Clientes atendidos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">
                      {hoursWorked}h{minutesLeft.toString().padStart(2, '0')}m
                    </p>
                    <p className="text-xs text-gray-500">Horas atendidas</p>
                  </div>
                </div>
              </div>

              {avgTicket > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <span className="text-sm text-gray-600">Ticket médio</span>
                  </div>
                  <span className="font-bold gold-text">{fmtBRL(avgTicket)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Monthly evolution */}
          <div className="px-4 pt-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Evolução mensal (12 meses)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={fmtBRL} contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita" dot={false} />
                  <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} name="Despesa" dot={false} />
                  <Line type="monotone" dataKey="lucro"   stroke="#3b82f6" strokeWidth={2} name="Lucro"   dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yearly comparison */}
          <div className="px-4 pt-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Comparativo anual</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={fmtBRL} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="receita" fill="#10b981" name="Receita" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" fill="#ef4444" name="Despesa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lucro"   fill="#3b82f6" name="Lucro"   radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top clients */}
          {topClients.length > 0 ? (
            <div className="px-4 pt-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Top clientes no período</h3>
                <div className="space-y-3">
                  {topClients.map(([name, total], i) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400 w-6">{i + 1}º</span>
                        <span className="font-medium text-gray-700">{name}</span>
                      </div>
                      <span className="font-bold gold-text">{fmtBRL(total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 pt-4">
              <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum dado no período</p>
                <p className="text-gray-400 text-sm mt-1">Selecione outro intervalo de tempo</p>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Professional view */
        <div className="p-4 space-y-4">
          {profPerformance.length > 0 ? (
            profPerformance.map((prof, i) => (
              <motion.div
                key={prof.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  {prof.color && (
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: prof.color }} />
                  )}
                  <h3 className="font-semibold text-gray-900">{prof.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">{prof.appointments}</p>
                    <p className="text-xs text-gray-500">Atendimentos</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="text-base font-bold gold-text">{fmtBRL(prof.income)}</p>
                    <p className="text-xs text-gray-500">Receita</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Nenhum dado de performance no período</p>
              <p className="text-gray-400 text-sm mt-1">Selecione outro intervalo de tempo</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
