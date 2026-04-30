import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import {
  Users, Building2, TrendingUp, LogOut, RefreshCw,
  Trash2, CheckCircle, XCircle, Mail, Phone, MapPin,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}33` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value ?? '—'}</p>
        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      </div>
    </motion.div>
  );
}

function Badge({ active }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={
        active
          ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80' }
          : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
      }
    >
      {active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {active ? 'Configurado' : 'Pendente'}
    </span>
  );
}

export default function AdminPanel() {
  const { user, logout } = useAuth();

  const [stats,     setStats]     = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users,     setUsers]     = useState([]);
  const [tab,       setTab]       = useState('companies');
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, u] = await Promise.all([
        apiClient.admin.stats(),
        apiClient.admin.companies(),
        apiClient.admin.users(),
      ]);
      setStats(s);
      setCompanies(c);
      setUsers(u);
    } catch (err) {
      console.error('admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDeleteUser(id, name) {
    if (!confirm(`Remover usuário "${name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    try {
      await apiClient.admin.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setStats((prev) => prev ? { ...prev, total_users: prev.total_users - 1 } : prev);
    } catch {
      alert('Erro ao remover usuário.');
    } finally {
      setDeleting(null);
    }
  }

  const fmt = (dateStr) => dateStr
    ? new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#080808',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 border-b"
        style={{
          background: 'rgba(8,8,8,0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(255,255,255,0.08)',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9A861 0%, #E5D4A8 100%)' }}
          >
            <span className="text-black font-black text-sm">B</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-none">
              Beauty<span style={{ color: '#C9A861' }}>Pro</span>
            </h1>
            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Painel Administrativo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-white/8"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#C9A861' }}>
              <span className="text-black font-black text-[10px]">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <span className="text-xs font-medium text-white">{user?.name || 'Admin'}</span>
          </div>
          <button
            onClick={logout}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Building2}  label="Empresas"        value={stats?.total_companies}  color="#C9A861" />
          <StatCard icon={Users}      label="Usuários"        value={stats?.total_users}       color="#60a5fa" />
          <StatCard icon={TrendingUp} label="Novos (30 dias)" value={stats?.new_last_30_days}  color="#4ade80" />
        </div>

        {/* Tabs */}
        <div
          className="flex p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {[
            { key: 'companies', label: 'Empresas',    icon: Building2 },
            { key: 'users',     label: 'Usuários',    icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={
                tab === key
                  ? { background: '#fff', color: '#000' }
                  : { color: 'rgba(255,255,255,0.4)' }
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Companies table */}
        {tab === 'companies' && (
          <motion.div
            key="companies"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0E0E0E' }}
          >
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#C9A861' }} />
              </div>
            ) : companies.length === 0 ? (
              <div className="py-16 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Nenhuma empresa cadastrada ainda.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {companies.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-black"
                          style={{ background: 'linear-gradient(135deg, #C9A861 0%, #E5D4A8 100%)' }}
                        >
                          {c.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{c.name}</p>
                          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {c.owner_name || '—'}
                          </p>
                        </div>
                      </div>
                      <Badge active={c.hours_configured} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pl-13">
                      {c.owner_email && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <Mail className="w-3 h-3" /> {c.owner_email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <Phone className="w-3 h-3" /> {c.phone}
                        </span>
                      )}
                      {c.city && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <MapPin className="w-3 h-3" /> {c.city}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Desde {fmt(c.created_at)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Users table */}
        {tab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0E0E0E' }}
          >
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#C9A861' }} />
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Nenhum usuário cadastrado ainda.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {users.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}
                    >
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{u.email}</p>
                      {u.company_name && (
                        <p className="text-[10px] truncate mt-0.5" style={{ color: '#C9A861' }}>
                          {u.company_name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {fmt(u.created_at)}
                      </span>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        disabled={deleting === u.id}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-40"
                        title="Remover usuário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
