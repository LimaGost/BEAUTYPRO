// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, ArrowUpDown, Smartphone } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import ClientCard from '../components/clients/ClientCard';
import ClientModal from '../components/clients/ClientModal';
import ImportContactsModal from '../components/clients/ImportContactsModal';

const GOLD = '#C9A861';

const SORT_OPTIONS = [
  { value: 'nome',    label: 'Nome (A–Z)' },
  { value: 'gasto',  label: 'Maior gasto' },
  { value: 'visitas',label: 'Mais visitas' },
  { value: 'recente',label: 'Mais recentes' },
];

export default function ClientsPage() {
  const [searchQuery,     setSearchQuery]     = useState('');
  const [modalOpen,       setModalOpen]       = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedClient,  setSelectedClient]  = useState(null);
  const [sortBy,          setSortBy]          = useState('nome');

  const { user }                          = useAuth();
  const { data: clients = [], isLoading } = useClients();
  const createClient                      = useCreateClient();
  const updateClient                      = useUpdateClient();
  const deleteClient                      = useDeleteClient();

  const queryClient   = useQueryClient();
  const handleRefresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    [queryClient],
  );
  const { refreshing, containerRef } = usePullToRefresh(handleRefresh);

  /* ── Derivações ─────────────────────────────────────────────────────────── */

  const newClients = clients.filter((c) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return new Date(c.created_date) >= cutoff;
  });

  const sortedClients = [...clients].sort((a, b) => {
    if (sortBy === 'visitas') return (b.visit_count || 0)  - (a.visit_count || 0);
    if (sortBy === 'gasto')   return (b.total_spent || 0)  - (a.total_spent || 0);
    if (sortBy === 'recente') return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'pt-BR');
  });

  const filteredClients = sortedClients.filter((c) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery),
  );

  /* ── Handlers ────────────────────────────────────────────────────────────── */

  const closeModal = () => { setModalOpen(false); setSelectedClient(null); };

  const handleSave = (data) => {
    const mutation = selectedClient
      ? updateClient.mutateAsync({ id: selectedClient.id, data })
      : createClient.mutateAsync(data);
    mutation.then(closeModal).catch(() => {});
  };

  const handleImportContacts = async (contacts) => {
    await Promise.all(contacts.map((c) => createClient.mutateAsync(c)));
    setImportModalOpen(false);
  };

  /* ── Render ──────────────────────────────────────────────────────────────── */

  return (
    <div ref={containerRef} className="min-h-screen" style={{ background: '#080808' }}>

      {refreshing && (
        <div className="flex justify-center py-2 text-xs font-semibold"
          style={{ background: 'rgba(201,168,97,0.1)', color: GOLD }}>
          Atualizando...
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 pb-3">
        <StatCard
          icon={Users}
          label="Total de clientes"
          value={isLoading ? '—' : clients.length}
          color="#60A5FA"
          delay={0}
        />
        <StatCard
          icon={Users}
          label="Novos (30 dias)"
          value={isLoading ? '—' : newClients.length}
          color="#34D399"
          delay={0.05}
        />
      </div>

      {/* Busca + Ordenação */}
      <div className="px-4 pb-3 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Buscar por nome ou telefone..."
        />

        {/* Sort pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                sortBy === opt.value
                  ? { background: 'rgba(201,168,97,0.18)', color: GOLD, border: '1px solid rgba(201,168,97,0.35)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
        </p>
      </div>

      {/* Lista */}
      <div className="px-4 pt-3 pb-28 space-y-2">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse"
              style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded-lg w-32" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-3 rounded-lg w-24" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
            </div>
          ))
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            description={searchQuery ? 'Tente buscar por outro termo' : 'Adicione seu primeiro cliente'}
            action={
              !searchQuery && (
                <button
                  onClick={() => { setSelectedClient(null); setModalOpen(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black"
                  style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)' }}
                >
                  <Users className="w-4 h-4" />
                  Novo cliente
                </button>
              )
            }
          />
        ) : (
          filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
            >
              <ClientCard
                client={client}
                onClick={(c) => { setSelectedClient(c); setModalOpen(true); }}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* FABs */}
      <div
        className="fixed flex flex-col items-end gap-3 z-30"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))', right: '1rem' }}
      >
        {user?.role === 'admin' && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 font-semibold text-sm px-4 h-11 rounded-full"
            style={{
              background: 'rgba(201,168,97,0.12)',
              color: GOLD,
              border: '1px solid rgba(201,168,97,0.25)',
            }}
          >
            <Smartphone className="w-4 h-4" />
            Importar Contatos
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setSelectedClient(null); setModalOpen(true); }}
          className="w-14 h-14 rounded-full gold-gradient shadow-xl flex items-center justify-center"
        >
          <Plus className="w-6 h-6 text-black" />
        </motion.button>
      </div>

      {/* Modais */}
      <ClientModal
        isOpen={modalOpen}
        onClose={closeModal}
        client={selectedClient}
        onSave={handleSave}
        onDelete={(id) => deleteClient.mutate(id, { onSuccess: closeModal })}
      />
      <ImportContactsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        existingClients={clients}
        onImport={handleImportContacts}
      />
    </div>
  );
}
