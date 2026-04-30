// @ts-nocheck
import React, { useState } from 'react';
import { fmtMoney } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { financialApi } from '@/services/financialApi';
import { motion, AnimatePresence } from 'framer-motion';
import { format, endOfMonth, parseISO, subMonths, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard,
  Banknote, Smartphone, Gift, List, ChevronLeft, ChevronRight,
  ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const PAYMENT_ICONS  = { cash: Banknote, pix: Smartphone, credit_card: CreditCard, debit_card: CreditCard, courtesy: Gift };
const PAYMENT_LABELS = { cash: 'Dinheiro', pix: 'PIX', credit_card: 'Crédito', debit_card: 'Débito', courtesy: 'Cortesia' };
const COLORS = ['#C9A861','#22C55E','#3B82F6','#8B5CF6','#F97316','#EC4899','#10B981','#6366F1'];

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export default function FinancialPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  const [tab,   setTab]   = useState('overview');
  const [txType, setTxType] = useState('income');

  const prevMonth = (month === 0) ? { m: 11, y: year - 1 } : { m: month - 1, y: year };

  const startDate  = `${year}-${String(month + 1).padStart(2,'0')}-01`;
  const endDate    = format(endOfMonth(new Date(year, month, 1)), 'yyyy-MM-dd');
  const prevStart  = `${prevMonth.y}-${String(prevMonth.m + 1).padStart(2,'0')}-01`;
  const prevEnd    = format(endOfMonth(new Date(prevMonth.y, prevMonth.m, 1)), 'yyyy-MM-dd');

  const { data: summary = {}, isLoading } = useQuery({
    queryKey: ['financial-summary', startDate, endDate],
    queryFn:  () => financialApi.summary(startDate, endDate),
  });

  const { data: prevSummary = {} } = useQuery({
    queryKey: ['financial-summary', prevStart, prevEnd],
    queryFn:  () => financialApi.summary(prevStart, prevEnd),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['financial-transactions', startDate, endDate],
    queryFn:  () => financialApi.transactions(startDate, endDate),
  });

  const income   = Number(summary.gross_revenue  || 0);
  const expenses = Number(summary.paid_expenses   || 0);
  const profit   = Number(summary.net_profit      || 0);

  const prevIncome   = Number(prevSummary.gross_revenue || 0);
  const prevExpenses = Number(prevSummary.paid_expenses || 0);
  const prevProfit   = Number(prevSummary.net_profit    || 0);

  const pct = (curr, prev) => prev === 0 ? null : ((curr - prev) / Math.abs(prev) * 100).toFixed(1);
  const incomeChange  = pct(income,   prevIncome);
  const expenseChange = pct(expenses, prevExpenses);
  const profitChange  = pct(profit,   prevProfit);

  // formas de pagamento
  const paymentMethods = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const m = t.payment_method || 'cash';
      acc[m] = (acc[m] || 0) + Number(t.amount || 0);
      return acc;
    }, {});

  // top serviços
  const serviceMap = transactions
    .filter(t => t.type === 'income' && t.services?.length > 0)
    .flatMap(t => t.services.map(s => ({ name: s.name, amount: s.price || 0 })))
    .reduce((acc, s) => {
      if (!s.name) return acc;
      acc[s.name] = (acc[s.name] || 0) + s.amount;
      return acc;
    }, {});

  const topServices = Object.entries(serviceMap)
    .sort((a,b) => b[1] - a[1]).slice(0,5)
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  // evolução diária do mês
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2,'0');
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${d}`;
    const dayIncome   = transactions.filter(t => t.type === 'income'  && t.date === dateStr).reduce((s,t) => s + Number(t.amount||0), 0);
    const dayExpenses = transactions.filter(t => t.type === 'expense' && t.date === dateStr).reduce((s,t) => s + Number(t.amount||0), 0);
    return { day: d, receita: dayIncome, despesa: dayExpenses };
  });

  // categorias de despesa
  const expCatMap = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const c = t.category || 'Outros';
      acc[c] = (acc[c] || 0) + Number(t.amount || 0);
      return acc;
    }, {});
  const expCatData = Object.entries(expCatMap)
    .sort((a,b) => b[1]-a[1]).slice(0,6)
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  // profissionais
  const profMap = transactions
    .filter(t => t.type === 'income' && t.professional_name)
    .reduce((acc, t) => {
      const n = t.professional_name;
      if (!acc[n]) acc[n] = { income: 0, count: 0 };
      acc[n].income += Number(t.amount || 0);
      acc[n].count  += 1;
      return acc;
    }, {});
  const profData = Object.entries(profMap)
    .map(([name, d]) => ({ name, income: d.income, count: d.count, avg: d.income / d.count }))
    .sort((a,b) => b.income - a.income);

  // lista de transações do mês
  const txList = [...transactions]
    .filter(t => t.type === txType)
    .sort((a,b) => b.date.localeCompare(a.date));

  const navMonth = (dir) => {
    if (dir === -1) {
      if (month === 0) { setMonth(11); setYear((y) => y - 1); }
      else setMonth((m) => m - 1);
    } else {
      if (month === 11) { setMonth(0); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    }
  };

  const Trend = ({ val }) => {
    if (val === null || isNaN(val)) return null;
    const pos = parseFloat(val) >= 0;
    return (
      <div className={`flex items-center justify-center gap-0.5 text-[11px] mt-0.5 ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
        {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{Math.abs(val)}%</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen page-bg pb-24">
      {/* Seletor de mês */}
      <div className="bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <button onClick={() => navMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-800">
          {MONTHS[month]} de {year}
        </span>
        <button onClick={() => navMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 flex">
        {[
          { id: 'overview',  Icon: DollarSign, label: 'Geral' },
          { id: 'list',      Icon: List,       label: 'Lançamentos' },
          { id: 'charts',    Icon: TrendingUp, label: 'Gráficos' },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
              tab === id ? 'border-b-2 border-amber-500 text-amber-600' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      {/* Cards de resumo — sempre visíveis */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Receita',  value: income,   trend: incomeChange,  color: 'text-emerald-600' },
          { label: 'Despesas', value: expenses,  trend: expenseChange, color: 'text-red-500' },
          { label: 'Lucro',    value: profit,    trend: profitChange,  color: profit >= 0 ? 'text-emerald-600' : 'text-red-500' },
        ].map(({ label, value, trend, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-3 shadow-sm text-center"
          >
            <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
            <p className={`text-sm font-bold leading-tight ${color}`}>
              R$ {fmt(value)}
            </p>
            <Trend val={trend} />
          </motion.div>
        ))}
      </div>

      {/* Conteúdo por tab */}
      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Formas de pagamento */}
            <div className="px-4 pt-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Formas de Pagamento</h3>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {Object.entries(PAYMENT_LABELS).map(([method, label]) => {
                    const Icon = PAYMENT_ICONS[method];
                    const amount = paymentMethods[method] || 0;
                    const pctVal = income > 0 ? Math.round((amount / income) * 100) : 0;
                    return (
                      <div key={method}>
                        <Icon className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                        <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">R$ {fmt(amount)}</p>
                        <p className="text-[10px] text-amber-600 font-medium">{pctVal}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance por profissional */}
            {profData.length > 0 && (
              <div className="px-4 pt-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Performance por Profissional</h3>
                  <div className="space-y-3">
                    {profData.map((prof, i) => (
                      <div key={prof.name} className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        >
                          {prof.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{prof.name}</p>
                          <p className="text-xs text-gray-500">{prof.count} atend. · média R$ {fmtMoney(prof.avg)}</p>
                        </div>
                        <p className="font-bold text-gray-800 text-sm">R$ {fmt(prof.income)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top serviços */}
            {topServices.length > 0 && (
              <div className="px-4 pt-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Top Serviços</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-36 flex-shrink-0">
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={topServices} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={2} dataKey="value">
                            {topServices.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {topServices.map(s => (
                        <div key={s.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <p className="text-xs text-gray-700 truncate flex-1">{s.name}</p>
                          <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">R$ {fmt(s.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {income === 0 && expenses === 0 && !isLoading && (
              <div className="text-center py-16 text-gray-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum lançamento em {MONTHS[month]}</p>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Toggle receita/despesa */}
            <div className="px-4 pt-4">
              <div className="flex bg-white rounded-xl p-1 shadow-sm gap-1">
                <button
                  onClick={() => setTxType('income')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    txType === 'income' ? 'bg-emerald-500 text-white shadow' : 'text-gray-500'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Receitas · R$ {fmt(income)}
                </button>
                <button
                  onClick={() => setTxType('expense')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    txType === 'expense' ? 'bg-red-500 text-white shadow' : 'text-gray-500'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Despesas · R$ {fmt(expenses)}
                </button>
              </div>
            </div>

            <div className="px-4 pt-3 space-y-2">
              {txList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <List className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum lançamento de {txType === 'income' ? 'receita' : 'despesa'}</p>
                </div>
              ) : (
                txList.map(tx => {
                  const Icon = PAYMENT_ICONS[tx.payment_method] || DollarSign;
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isIncome ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${isIncome ? 'text-emerald-600' : 'text-red-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {tx.description || (isIncome ? 'Receita' : 'Despesa')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {tx.date ? format(parseISO(tx.date), "dd 'de' MMM", { locale: ptBR }) : ''}
                          {tx.category ? ` · ${tx.category}` : ''}
                        </p>
                      </div>
                      <p className={`font-bold text-sm whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'} R$ {fmt(tx.amount)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {tab === 'charts' && (
          <motion.div key="charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Evolução diária */}
            <div className="px-4 pt-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Evolução em {MONTHS[month]}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                      formatter={(v) => `R$ ${fmt(v)}`}
                    />
                    <Area type="monotone" dataKey="receita" stroke="#22C55E" fill="url(#gIncome)" strokeWidth={2} name="Receita" />
                    <Area type="monotone" dataKey="despesa" stroke="#EF4444" fill="url(#gExpense)" strokeWidth={2} name="Despesa" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Despesas por categoria */}
            {expCatData.length > 0 && (
              <div className="px-4 pt-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Despesas por Categoria</h3>
                  <ResponsiveContainer width="100%" height={Math.max(expCatData.length * 40, 150)}>
                    <BarChart data={expCatData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                        formatter={(v) => `R$ ${fmt(v)}`}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {expCatData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
