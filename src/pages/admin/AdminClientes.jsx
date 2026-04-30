// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Users, Loader2, RefreshCw, Search, Building2 } from 'lucide-react';

const GOLD = '#C9A861';

function clientName(c) {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || '—';
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
}

export default function AdminClientes() {
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const searchTimer = useRef(null);
  const LIMIT = 50;

  const load = useCallback((reset = true, q = search, p = page) => {
    if (reset) { setPage(1); setClients([]); }
    setLoading(true);
    setError('');
    const params = { limit: LIMIT, page: reset ? 1 : p };
    if (q) params.search = q;

    apiClient.admin.clients(params)
      .then((rows) => {
        setClients((prev) => reset ? rows : [...prev, ...rows]);
        setHasMore(rows.length === LIMIT);
      })
      .catch(() => setError('Erro ao carregar clientes.'))
      .finally(() => setLoading(false));
  }, [search, page]);

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
          <h2 className="text-xl font-black text-white">Clientes</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Todos os clientes do sistema
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
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* List */}
      {error ? (
        <div className="text-center py-16">
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
          <button onClick={() => load(true)} className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(201,168,97,0.15)', color: GOLD }}>
            Tentar novamente
          </button>
        </div>
      ) : clients.length === 0 && !loading ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {clients.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'rgba(201,168,97,0.12)', color: GOLD }}
                >
                  {(c.first_name || c.last_name || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{clientName(c)}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {c.phone || c.email || '—'}
                  </p>
                </div>

                {/* Company badge */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Building2 className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <span className="text-[10px] font-medium truncate max-w-[80px]"
                      style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {c.company_name || '—'}
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {formatDate(c.created_date)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Load more / spinner */}
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
