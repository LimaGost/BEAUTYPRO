// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { apiClient } from '@/api/apiClient';
import { format, isToday, parseISO } from 'date-fns';
import { fmtMoney } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { 
  CalendarDays, 
  Calendar as CalendarIcon, 
  List, 
  Search,
  CalendarCheck,
  Lock,
  Plus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import WeekCalendar from '../components/agenda/WeekCalendar';
import DraggableDayView from '../components/agenda/DraggableDayView';
import AppointmentModal from '../components/agenda/AppointmentModal';
import CheckoutModal from '../components/agenda/CheckoutModal';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import ClientSearchBar from '../components/agenda/ClientSearchBar';

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'list'
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);
  const queryClient = useQueryClient();

  const handleClientSelect = (client) => {
    setSelectedAppointment(null);
    setModalOpen(true);
  };

  // Queries
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => apiClient.entities.Appointment.filter({
      date: format(selectedDate, 'yyyy-MM-dd')
    })
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => apiClient.entities.Professional.filter({ active: true })
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiClient.entities.Service.filter({ active: true })
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.entities.Client.list()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setModalOpen(false);
      setSelectedAppointment(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setModalOpen(false);
      setSelectedAppointment(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Appointment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setModalOpen(false);
      setSelectedAppointment(null);
    }
  });

  const completeMutation = useMutation({
    mutationFn: async ({ appointment, payments }) => {
      // Update appointment status
      await apiClient.entities.Appointment.update(appointment.id, {
        ...appointment,
        status: 'completed'
      });

      // Create transaction for each payment
      const transactionPromises = payments.map(payment => 
        apiClient.entities.Transaction.create({
          type: 'income',
          amount: payment.amount,
          date: format(new Date(), 'yyyy-MM-dd'),
          description: `${appointment.client_name} - ${appointment.services?.map(s => s.name).join(', ')}`,
          payment_method: payment.method,
          appointment_id: appointment.id,
          client_id: appointment.client_id,
          client_name: appointment.client_name,
          professional_id: appointment.professional_id,
          professional_name: appointment.professional_name,
          services: appointment.services
        })
      );

      await Promise.all(transactionPromises);

      // Update client stats
      if (appointment.client_id) {
        const client = await apiClient.entities.Client.filter({ id: appointment.client_id });
        if (client[0]) {
          await apiClient.entities.Client.update(appointment.client_id, {
            visit_count: (client[0].visit_count || 0) + 1,
            total_spent: (client[0].total_spent || 0) + appointment.total_amount
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setCheckoutModalOpen(false);
      setSelectedAppointment(null);
    },
    onError: (err) => {
      alert('Erro ao confirmar pagamento: ' + (err?.message || 'Tente novamente.'));
    }
  });

  let filteredAppointments = selectedProfessional === 'all'
    ? appointments
    : appointments.filter(a => a.professional_id === selectedProfessional);

  if (searchQuery) {
    filteredAppointments = filteredAppointments.filter(apt => 
      apt.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.services?.some(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  const handleSaveAppointment = (data) => {
    if (selectedAppointment) {
      updateMutation.mutate({ id: selectedAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleTimeChange = (appointmentId, newStartTime, newEndTime) => {
    const appointment = filteredAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    updateMutation.mutate({
      id: appointmentId,
      data: {
        ...appointment,
        start_time: newStartTime,
        end_time: newEndTime
      }
    });
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries(['appointments']);
  }, [queryClient]);
  const { refreshing, containerRef } = usePullToRefresh(handleRefresh);

  const handleOpenNewAppointment = (type = 'appointment') => {
    setSelectedAppointment(null);
    setModalOpen(true);
  };

  const fabActions = [
    { 
      icon: CalendarCheck, 
      label: 'Novo Agendamento', 
      onClick: () => handleOpenNewAppointment('appointment') 
    },
    { 
      icon: Lock, 
      label: 'Novo Bloqueio', 
      onClick: () => handleOpenNewAppointment('block') 
    },
    { 
      icon: List, 
      label: 'Lista de Espera', 
      onClick: () => {} 
    },
  ];

  return (
    <div ref={containerRef} className="flex flex-col" style={{ height: 'calc(100dvh - 56px - env(safe-area-inset-bottom))' }}>
      {refreshing && (
        <div className="flex justify-center py-2 bg-amber-50 text-amber-600 text-xs font-medium">
          Atualizando...
        </div>
      )}
      {/* Action Bar */}
      <div className="bg-white border-b border-gray-100">
        {/* Top row: view toggles + search */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1 gap-2">
          {/* View Mode Pills */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'day' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Dia</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
          </div>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2.5 rounded-xl transition-colors ${
              showSearch ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Professional Filter */}
        <div className="px-3 pb-2">
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-full h-10 text-sm bg-gray-50 border-gray-200">
              <SelectValue placeholder="Filtrar por profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {professionals.map(prof => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-2 space-y-2"
          >
            {/* Appointment/Service Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente ou serviço..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
              />
            </div>

            {/* Client Search */}
            <ClientSearchBar 
              clients={clients}
              onClientSelect={handleClientSelect}
              onClear={() => setSearchQuery('')}
            />
          </motion.div>
        )}
      </div>

      {/* Week Calendar */}
      {viewMode !== 'list' && (
        <WeekCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onWeekChange={setSelectedDate}
        />
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <DraggableDayView
          appointments={filteredAppointments}
          professionals={professionals}
          onAppointmentClick={(apt) => {
            setSelectedAppointment(apt);
            setModalOpen(true);
          }}
          onCheckout={(apt) => {
            setSelectedAppointment(apt);
            setCheckoutModalOpen(true);
          }}

        />
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Vista semanal em desenvolvimento</p>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedAppointment(apt);
                  setModalOpen(true);
                }}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{apt.client_name}</h3>
                    <p className="text-sm text-gray-500">{apt.professional_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium gold-text">{apt.start_time}</p>
                    {apt.total_amount > 0 && (
                      <p className="text-sm font-bold">R$ {fmtMoney(apt.total_amount)}</p>
                    )}
                  </div>
                </div>
                {apt.services && apt.services.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {apt.services.map((service, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {service.name}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <List className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum agendamento encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Today Button */}
      {!isToday(selectedDate) && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setSelectedDate(new Date())}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full shadow-lg text-sm font-medium"
        >
          Hoje
        </motion.button>
      )}

      {/* FAB */}
      <FloatingActionButton actions={fabActions} />

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        selectedDate={selectedDate}
        professionals={professionals}
        services={services}
        clients={clients}
        onSave={handleSaveAppointment}
        onDelete={(id) => deleteMutation.mutate(id)}
        onCancel={(id) => updateMutation.mutate({ id, data: { status: 'cancelled' } })}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => {
          setCheckoutModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onComplete={(payments) => {
          completeMutation.mutate({
            appointment: selectedAppointment,
            payments
          });
        }}
      />
    </div>
  );
}