import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Scissors, Clock, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fmtMoney } from '@/lib/utils';
import { SERVICE_CATEGORY_LABELS, formatDuration } from '@/models/schemas';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useServices';
import ServiceModal from '../components/services/ServiceModal';

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
    <div className="min-h-screen page-bg">
      {/* Search bar */}
      <div className="bg-white px-4 py-3 border-b border-black/[0.07]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar serviço..."
            className="pl-9 h-11 rounded-xl bg-gray-50 border-gray-200 text-sm"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          {filteredServices.length} {filteredServices.length === 1 ? 'serviço' : 'serviços'}
        </p>
      </div>

      {/* Content */}
      <div className="pb-28">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-28" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedServices).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Scissors className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {searchQuery ? 'Nenhum resultado' : 'Nenhum serviço cadastrado'}
            </h3>
            <p className="text-sm text-gray-400 text-center">
              {searchQuery ? 'Tente outro termo de busca' : 'Toque em + para adicionar seu primeiro serviço'}
            </p>
          </div>
        ) : (
          Object.entries(groupedServices).map(([category, items]) => (
            <div key={category}>
              {/* Category header */}
              <div className="cat-divider">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{ background: '#C9A861' }} />
                  <span className="cat-divider-label">
                    {SERVICE_CATEGORY_LABELS[category] || category}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{items.length}</span>
              </div>

              {/* Service rows */}
              <div>
                {items.map((service, idx) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => { setSelectedService(service); setModalOpen(true); }}
                    className="list-row"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="font-medium text-gray-900 text-sm">{service.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(service.duration_minutes)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm gold-text">R$ {fmtMoney(service.price)}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </motion.div>
                ))}
              </div>
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
