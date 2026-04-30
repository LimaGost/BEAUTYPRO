/**
 * Clients — View
 *
 * Responsabilidade: renderizar a listagem e gerenciar estado de UI local.
 * Toda a lógica de dados é delegada ao hook useClients (Controller).
 */
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Users, Smartphone, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import ClientCard from '../components/clients/ClientCard';
import ClientModal from '../components/clients/ClientModal';
import ImportContactsModal from '../components/clients/ImportContactsModal';

export default function ClientsPage() {
  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [searchQuery,     setSearchQuery]     = useState('');
  const [modalOpen,       setModalOpen]       = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedClient,  setSelectedClient]  = useState(null);
  const [sortBy,          setSortBy]          = useState('nome');

  // ── Dados (Controller) ────────────────────────────────────────────────────
  const { user }                          = useAuth();
  const { data: clients = [], isLoading } = useClients();
  const createClient                      = useCreateClient();
  const updateClient                      = useUpdateClient();
  const deleteClient                      = useDeleteClient();

  // Pull-to-refresh invalida o cache manualmente
  const queryClient  = useQueryClient();
  const handleRefresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
    [queryClient]
  );
  const { refreshing, containerRef } = usePullToRefresh(handleRefresh);

  // ── Derivações ────────────────────────────────────────────────────────────

  const newClients = clients.filter(c => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return new Date(c.created_date) >= cutoff;
  });

  const top3 = [...clients]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 3);

  const sortedClients = [...clients].sort((a, b) => {
    if (sortBy === 'visitas') return (b.visit_count || 0) - (a.visit_count || 0);
    if (sortBy === 'gasto')   return (b.total_spent || 0) - (a.total_spent || 0);
    if (sortBy === 'recente') return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'pt-BR');
  });

  const filteredClients = sortedClients.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  // ── Handlers de UI ────────────────────────────────────────────────────────

  const closeModal = () => { setModalOpen(false); setSelectedClient(null); };

  const handleSave = (data) => {
    const mutation = selectedClient
      ? updateClient.mutateAsync({ id: selectedClient.id, data })
      : createClient.mutateAsync(data);
    mutation.then(closeModal).catch(() => {});
  };

  const handleImportContacts = async (contacts) => {
    await Promise.all(contacts.map(c => createClient.mutateAsync(c)));
    setImportModalOpen(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="min-h-screen page-bg">
      {refreshing && (
        <div className="flex justify-center py-2 bg-amber-50 text-amber-600 text-xs font-medium">
          Atualizando...
        </div>
      )}

      {/* Header com estatísticas */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
        <div className="flex items-center justify-center gap-8 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{clients.length}</p>
            <p className="text-xs opacity-90">Total de Clientes</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{newClients.length}</p>
            <p className="text-xs opacity-90">Novos (30 dias)</p>
          </div>
        </div>

        {clients.length > 0 && (
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3 opacity-90">🏆 Top 3 Clientes</h3>
            <div className="space-y-2">
              {top3.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{['🥇', '🥈', '🥉'][index]}</span>
                    <span className="font-medium text-sm">
                      {client.first_name} {client.last_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      R$ {(client.total_spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs opacity-75">{client.visit_count || 0} visitas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Busca + Ordenação */}
      <div className="p-4 space-y-2">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="pl-10 h-12 rounded-xl bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 text-sm bg-white flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome">Nome (A-Z)</SelectItem>
              <SelectItem value="gasto">Maior gasto</SelectItem>
              <SelectItem value="visitas">Mais visitas</SelectItem>
              <SelectItem value="recente">Mais recentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 pb-24 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">
              {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-sm text-gray-400">
              {searchQuery ? 'Tente buscar por outro termo' : 'Adicione seu primeiro cliente'}
            </p>
          </div>
        ) : (
          filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
        className="fixed bottom-20 right-4 flex flex-col items-end gap-3 z-30"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        {user?.role === 'admin' && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-amber-300 text-amber-700 font-semibold text-sm px-4 h-12 rounded-full shadow-lg"
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
