// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import {
  Building2, Users, Calendar, DollarSign,
  TrendingUp, Loader2, RefreshCw,
} from 'lucide-react';

const GOLD = '#C9A861';

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
        {sub && (
          <p className="text-[10px] mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiClient.admin.dashboard()
      .then(setData)
      .catch(() => setError('Erro ao carregar dados.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="px-4 pb-10">
      {/* Page title */}
      <div className="flex items-center justify-between py-5">
        <div>
          <h2 className="text-xl font-black text-white">Dashboard</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Visão geral do sistema
          </p>
        </div>
        <button
          onClick={load}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            style={{ color: 'rgba(255,255,255,0.4)' }} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: GOLD }} />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
          <button onClick={load} className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(201,168,97,0.15)', color: GOLD }}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Building2}
              label="Empresas"
              value={data.total_companies}
              color="#C9A861"
              delay={0}
            />
            <StatCard
              icon={Users}
              label="Usuários"
              value={data.total_users}
              color="#60A5FA"
              delay={0.05}
            />
            <StatCard
              icon={Calendar}
              label="Agendamentos"
              value={data.total_appointments}
              sub={`${data.appointments_this_month} este mês`}
              color="#34D399"
              delay={0.1}
            />
            <StatCard
              icon={DollarSign}
              label="Faturamento total"
              value={fmt(data.total_revenue)}
              sub={`${fmt(data.revenue_this_month)} este mês`}
              color="#F59E0B"
              delay={0.15}
            />
          </div>

          {/* Quick links */}
          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Acesso rápido
            </p>
            <div className="space-y-2">
              {[
                { label: 'Ver todas as empresas', path: '/admin/empresas',      icon: Building2 },
                { label: 'Ver todos os clientes', path: '/admin/clientes',      icon: Users },
                { label: 'Ver agendamentos',      path: '/admin/agendamentos',  icon: Calendar },
              ].map((item) => (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors active:opacity-80"
                  style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(201,168,97,0.12)' }}>
                    <item.icon className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  <TrendingUp className="w-3.5 h-3.5 ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
