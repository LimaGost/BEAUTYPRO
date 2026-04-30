// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Clock, ChevronRight, Plus } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';
import { SERVICE_CATEGORY_LABELS, formatDuration } from '@/models/schemas';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useServices';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import ServiceModal from '../components/services/ServiceModal';

const GOLD = '#C9A861';

export default function ServicesPage() {
  const [searchQuery,     setSearchQuery]     = useState('');
  const [modalOpen,       setModalOpen]       = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const { data: services = [], isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const filteredServices = services.filter((s) =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const groupedServices = filteredServices.reduce((acc, service) => {
    const cat = service.category || 'outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  const closeModal = () => { setModalOpen(false); setSelectedService(null); };

  const handleSave = (data) => {
    const mutation = selectedService
      ? updateService.mutateAsync({ id: selectedService.id, data })
      : createService.mutateAsync(data);
    mutation.then(closeModal).catch(() => {});
  };

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>

      {/* Barra de busca */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Buscar serviço..."
        />
        <p className="text-[11px] mt-2 px-1 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {filteredServices.length} {filteredServices.length === 1 ? 'serviço' : 'serviços'}
        </p>
      </div>

      {/* Conteúdo */}
      <div className="pb-28">
        {isLoading ? (
          /* Skeleton */
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl p-4 animate-pulse"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-4 rounded-lg w-40 mb-2" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <div className="h-3 rounded-lg w-24" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))}
          </div>

        ) : Object.keys(groupedServices).length === 0 ? (
          <EmptyState
            icon={Scissors}
            title={searchQuery ? 'Nenhum resultado' : 'Nenhum serviço cadastrado'}
            description={searchQuery ? 'Tente outro termo de busca' : 'Toque em + para adicionar seu primeiro serviço'}
            action={
              !searchQuery && (
                <button
                  onClick={() => { setSelectedService(null); setModalOpen(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black"
                  style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)' }}
                >
                  <Plus className="w-4 h-4" />
                  Novo serviço
                </button>
              )
            }
          />

        ) : (
          Object.entries(groupedServices).map(([category, items]) => (
            <div key={category}>

              {/* Cabeçalho da categoria */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 rounded-full" style={{ background: GOLD }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {SERVICE_CATEGORY_LABELS[category] || category}
                  </span>
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {items.length}
                </span>
              </div>

              {/* Linhas de serviço */}
              {items.map((service, idx) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => { setSelectedService(service); setModalOpen(true); }}
                  className="flex items-center px-4 py-3.5 cursor-pointer transition-colors active:bg-white/5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="font-semibold text-white text-sm">{service.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-xs"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDuration(service.duration_minutes)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm" style={{ color: GOLD }}>
                      R$ {fmtMoney(service.price)}
                    </span>
                    <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => { setSelectedService(null); setModalOpen(true); }}
        className="fixed right-5 gold-gradient shadow-xl flex items-center justify-center z-30 rounded-full w-14 h-14"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus className="w-6 h-6 text-black" />
      </motion.button>

      <ServiceModal
        isOpen={modalOpen}
        onClose={closeModal}
        service={selectedService}
        onSave={handleSave}
        onDelete={(id) => deleteService.mutate(id, { onSuccess: closeModal })}
      />
    </div>
  );
}
