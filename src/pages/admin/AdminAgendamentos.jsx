// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Calendar, Loader2, RefreshCw, Search, Building2, Clock } from 'lucide-react';

const GOLD = '#C9A861';

const STATUS_STYLE = {
  confirmed:  { bg: 'rgba(52,211,153,0.12)', color: '#34D399', label: 'Confirmado' },
  pending:    { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', label: 'Pendente'   },
  cancelled:  { bg: 'rgba(248,113,113,0.12)',color: '#F87171', label: 'Cancelado'  },
  completed:  { bg: 'rgba(96,165,250,0.12)', color: '#60A5FA', label: 'Concluído'  },
  no_show:    { bg: 'rgba(156,163,175,0.12)',color: '#9CA3AF', label: 'Faltou'     },
};

function statusStyle(s) {
  return STATUS_STYLE[s] ?? { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label: s };
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function fmtCurrency(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function serviceNames(services) {
  if (!Array.isArray(services) || services.length === 0) return '—';
  return services.map((s) => s.name || s).join(', ');
}

const LIMIT = 50;

export default function AdminAgendamentos() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchTimer = useRef(null);

  const load = useCallback((reset = true, q = search, p = 1) => {
    if (reset) { setPage(1); setItems([]); }
    setLoading(true);
    setError('');
    const params = { limit: LIMIT, page: reset ? 1 : p };
    if (q) params.search = q;

    apiClient.admin.appointments(params)
      .then((rows) => {
        setItems((prev) => reset ? rows : [...prev, ...rows]);
        setHasMore(rows.length === LIMIT);
      })
      .catch(() => setError('Erro ao carregar agendamentos.'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(true, '', 1); }, []);

  const handleSearch = (q) => {
    setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(true, q, 1), 400);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(false, search, next);
  };

  return (
    <div className="px-4 pb-10">
      {/* Title */}
      <div className="flex items-center justify-between py-5">
        <div>
          <h2 className="text-xl font-black text-white">Agendamentos</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Todos os agendamentos do sistema
          </p>
        </div>
        <button onClick={() => load(true, search, 1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            style={{ color: 'rgba(255,255,255,0.4)' }} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'rgba(255,255,255,0.3)' }} />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por cliente, empresa ou profissional..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>

      {error ? (
        <div className="text-center py-16">
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
          <button onClick={() => load(true)} className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(201,168,97,0.15)', color: GOLD }}>
            Tentar novamente
          </button>
        </div>
      ) : items.length === 0 && !loading ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {search ? 'Nenhum agendamento encontrado.' : 'Nenhum agendamento cadastrado.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item, idx) => {
              const st = statusStyle(item.status);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                  className="rounded-2xl p-4"
                  style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Top row: client + status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-white truncate flex-1">
                      {item.client_name || '—'}
                    </p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Services */}
                  <p className="text-xs mb-2 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {serviceNames(item.services)}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {fmtDate(item.date)}
                      </span>
                    </div>
                    {item.start_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {item.start_time}
                        </span>
                      </div>
                    )}
                    {item.total_amount != null && (
                      <span className="text-[11px] font-semibold ml-auto" style={{ color: GOLD }}>
                        {fmtCurrency(item.total_amount)}
                      </span>
                    )}
                  </div>

                  {/* Company */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Building2 className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {item.company_name || '—'}
                    </span>
                    {item.professional_name && (
                      <>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {item.professional_name}
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
            </div>
          )}
          {!loading && hasMore && (
            <button
              onClick={loadMore}
              className="w-full mt-4 py-3 rounded-2xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
            >
              Carregar mais
            </button>
          )}
        </>
      )}
    </div>
  );
}
