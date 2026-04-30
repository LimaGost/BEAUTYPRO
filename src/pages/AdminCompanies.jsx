// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Building2, Users, Calendar, CheckCircle2, XCircle,
  LogOut, ChevronRight, Loader2, RefreshCw,
} from 'lucide-react';

const GOLD = '#C9A861';

export default function AdminCompanies() {
  const { selectAdminCompany, logout, user } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiClient.admin.companies()
      .then(setCompanies)
      .catch(() => setError('Erro ao carregar empresas.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAccess = (company) => {
    selectAdminCompany(company);
    navigate(createPageUrl('Agenda'));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080808' }}>

      {/* Header */}
      <header
        className="flex items-center justify-between px-5 border-b"
        style={{
          paddingTop: 'calc(1.25rem + env(safe-area-inset-top))',
          paddingBottom: '1.25rem',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: GOLD }}>
            Admin Global
          </p>
          <h1 className="text-xl font-black text-white mt-0.5">Empresas</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
          <button
            onClick={logout}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <LogOut className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>
      </header>

      {/* Usuário logado */}
      <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Logado como <strong className="text-white">{user?.name || user?.email}</strong>
        </p>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: GOLD }} />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(201,168,97,0.15)', color: GOLD }}
            >
              Tentar novamente
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma empresa cadastrada.</p>
          </div>
        ) : (
          companies.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="p-4">
                {/* Nome + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)' }}
                      >
                        {c.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{c.name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {c.owner_email || c.slug || '—'}
                      </p>
                    </div>
                  </div>
                  {c.is_active
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                    : <XCircle     className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
                  }
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {c.client_count} clientes
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {c.appointment_count} agendamentos
                    </span>
                  </div>
                </div>

                {/* Botão */}
                <button
                  onClick={() => handleAccess(c)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)', color: '#000' }}
                >
                  Acessar empresa
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Rodapé info */}
              {(c.cnpj || c.phone || c.city) && (
                <div
                  className="px-4 py-2 flex gap-3 flex-wrap border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  {c.cnpj && (
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      CNPJ: {c.cnpj}
                    </span>
                  )}
                  {c.city && (
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {c.city}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Criado em {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
