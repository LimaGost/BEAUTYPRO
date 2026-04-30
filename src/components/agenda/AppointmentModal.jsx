import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fmtMoney, toNum } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/api/apiClient';
import WhatsAppActions from './WhatsAppActions';

export default function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  selectedDate,
  professionals,
  services,
  clients,
  onSave,
  onDelete,
  onCancel,
}) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [formData, setFormData] = useState({
    type: 'appointment',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    start_time: '09:00',
    end_time: '10:00',
    professional_id: '',
    professional_name: '',
    client_id: '',
    client_name: '',
    services: [],
    total_amount: 0,
    notes: '',
    block_reason: '',
    repeat: 'none'
  });

  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showServiceSearch, setShowServiceSearch] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);

  // Load existing appointments for the selected date to block times
  useEffect(() => {
    if (isOpen && formData.date) {
      apiClient.entities.Appointment.filter({ date: formData.date }).then(apts => {
        setExistingAppointments(apts);
      });
    }
  }, [isOpen, formData.date, formData.professional_id]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        ...appointment,
        date: appointment.date || format(selectedDate, 'yyyy-MM-dd')
      });
      setClientSearch('');
    } else {
      setFormData({
        type: 'appointment',
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        start_time: '09:00',
        end_time: '10:00',
        professional_id: professionals[0]?.id || '',
        professional_name: professionals[0]?.name || '',
        client_id: '',
        client_name: '',
        services: [],
        total_amount: 0,
        notes: '',
        block_reason: '',
        repeat: 'none'
      });
      setClientSearch('');
    }
  }, [appointment, selectedDate, professionals]);

  const filteredClients = clients.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const handleSelectClient = (client) => {
    const clientName = `${client.first_name} ${client.last_name || ''}`;
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      client_name: clientName
    }));
    setClientSearch(clientName);
    setShowClientSearch(false);
  };

  const handleAddService = (service) => {
    const newServices = [...formData.services, {
      service_id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration_minutes
    }];
    
    const totalDuration = newServices.reduce((sum, s) => sum + (s.duration || 60), 0);
    const [hours, minutes] = formData.start_time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + totalDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    setFormData(prev => ({
      ...prev,
      services: newServices,
      total_amount: newServices.reduce((sum, s) => sum + (s.price || 0), 0),
      end_time: `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
    }));
    setShowServiceSearch(false);
    setServiceSearch('');
  };

  const handleRemoveService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    const totalDuration = newServices.reduce((sum, s) => sum + (s.duration || 60), 0);
    const [hours, minutes] = formData.start_time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + (totalDuration || 60);
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    setFormData(prev => ({
      ...prev,
      services: newServices,
      total_amount: newServices.reduce((sum, s) => sum + (s.price || 0), 0),
      end_time: `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
    }));
  };

  const getTotalDurationMinutes = () => {
    const [startH, startM] = formData.start_time.split(':').map(Number);
    const [endH, endM] = formData.end_time.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  const handleDurationChange = (minutes) => {
    const [startH, startM] = formData.start_time.split(':').map(Number);
    const endMinutes = startH * 60 + startM + minutes;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    setFormData(prev => ({
      ...prev,
      end_time: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
    }));
  };

  const durationOptions = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 h', value: 60 },
    { label: '1 h 15 min', value: 75 },
    { label: '1 h 30 min', value: 90 },
    { label: '1 h 45 min', value: 105 },
    { label: '2 h', value: 120 },
    { label: '2 h 30 min', value: 150 },
    { label: '3 h', value: 180 },
    { label: '3 h 30 min', value: 210 },
    { label: '4 h', value: 240 },
  ];

  const handleSave = async () => {
    // Validate required fields
    if (!formData.professional_id) {
      alert('Por favor, selecione um profissional');
      return;
    }

    if (formData.type === 'appointment' || formData.type === 'fit_in') {
      if (!formData.client_id) {
        alert('Por favor, selecione um cliente');
        return;
      }
    }

    // Check for time conflicts
    try {
      const allAppointments = await apiClient.entities.Appointment.filter({
        date: formData.date
      });

      const hasConflict = allAppointments.some(apt => {
        if (appointment && apt.id === appointment.id) return false; // Skip current appointment when editing
        if (apt.professional_id !== formData.professional_id) return false; // Different professional
        if (apt.status === 'cancelled') return false; // Cancelled appointments don't count

        // Convert times to minutes for easier comparison
        const [aptStartH, aptStartM] = apt.start_time.split(':').map(Number);
        const [aptEndH, aptEndM] = apt.end_time.split(':').map(Number);
        const [newStartH, newStartM] = formData.start_time.split(':').map(Number);
        const [newEndH, newEndM] = formData.end_time.split(':').map(Number);

        const aptStart = aptStartH * 60 + aptStartM;
        const aptEnd = aptEndH * 60 + aptEndM;
        const newStart = newStartH * 60 + newStartM;
        const newEnd = newEndH * 60 + newEndM;

        // Check if times overlap
        return (newStart < aptEnd && newEnd > aptStart);
      });

      if (hasConflict) {
        alert('⚠️ Conflito de horário!\n\nJá existe um agendamento para este profissional neste horário. Por favor, escolha outro horário.');
        return;
      }

      onSave(formData);
    } catch (error) {
      console.error('Error checking conflicts:', error);
      onSave(formData); // Proceed anyway if there's an error
    }
  };

  const timeOptions = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }

  const isTimeBlocked = (time) => {
    if (!formData.professional_id) return false;
    const [tH, tM] = time.split(':').map(Number);
    const tMinutes = tH * 60 + tM;

    return existingAppointments.some(apt => {
      if (appointment && apt.id === appointment.id) return false;
      if (apt.professional_id !== formData.professional_id) return false;
      if (apt.status === 'cancelled') return false;

      const [sH, sM] = apt.start_time.split(':').map(Number);
      const [eH, eM] = apt.end_time.split(':').map(Number);
      const aptStart = sH * 60 + sM;
      const aptEnd = eH * 60 + eM;

      return tMinutes >= aptStart && tMinutes < aptEnd;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl text-gray-900 flex flex-col"
          style={{ maxHeight: 'calc(100dvh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b flex-shrink-0">
            <button onClick={onClose} className="text-amber-600 font-semibold text-base py-1 px-1">
              Fechar
            </button>
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'appointment' }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.type === 'appointment' || formData.type === 'fit_in'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Agendamento
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'block_professional' }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.type?.includes('block')
                    ? 'bg-white text-gray-700 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Bloqueio
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pt-3 pb-4 overflow-y-auto flex-1 space-y-4">
            {/* Time Display */}
            <div className="flex items-center justify-center gap-2 bg-amber-50 rounded-xl py-3 px-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-lg font-bold text-gray-800">{formData.start_time} – {formData.end_time}</span>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-500 text-sm">Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1 text-gray-900"
                />
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Horário</Label>
                <Select
                  value={formData.start_time}
                  onValueChange={(value) => {
                    const currentDuration = getTotalDurationMinutes();
                    const [h, m] = value.split(':').map(Number);
                    const endMinutes = h * 60 + m + currentDuration;
                    const endH = Math.floor(endMinutes / 60);
                    const endM = endMinutes % 60;
                    setFormData(prev => ({
                      ...prev,
                      start_time: value,
                      end_time: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(time => {
                      const blocked = isTimeBlocked(time);
                      return (
                        <SelectItem key={time} value={time} disabled={blocked}>
                          <span className={blocked ? 'text-red-400 line-through' : ''}>
                            {time}{blocked ? ' 🔒' : ''}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Professional */}
            <div>
              <Label className="text-gray-500 text-sm">Profissional</Label>
              <Select
                value={formData.professional_id}
                onValueChange={(value) => {
                  const prof = professionals.find(p => p.id === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    professional_id: value,
                    professional_name: prof?.name || ''
                  }));
                }}
              >
                <SelectTrigger className="mt-1 text-gray-900">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'appointment' || formData.type === 'fit_in' ? (
              <>
                {/* Client */}
                <div className="relative">
                  <Label className="text-gray-500 text-sm">Cliente</Label>
                  <div className="relative mt-1">
                    <Input
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientSearch(true);
                        if (e.target.value === '') {
                          setFormData(prev => ({
                            ...prev,
                            client_id: '',
                            client_name: ''
                          }));
                        }
                      }}
                      onFocus={() => setShowClientSearch(true)}
                      placeholder="Buscar cliente..."
                      className="pr-10 text-gray-900 placeholder:text-gray-400"
                    />
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  
                  {showClientSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                          <button
                            key={client.id}
                            onClick={() => handleSelectClient(client)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                          >
                            {client.first_name} {client.last_name}
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-2 text-sm text-gray-500">Nenhum cliente encontrado</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Services */}
                <div className="relative">
                  <Label className="text-gray-500 text-sm">Serviços</Label>
                  <div className="relative mt-1">
                    <Input
                      value={serviceSearch}
                      onChange={(e) => {
                        setServiceSearch(e.target.value);
                        setShowServiceSearch(true);
                      }}
                      onFocus={() => setShowServiceSearch(true)}
                      placeholder="Buscar..."
                        className="pr-10 text-gray-900 placeholder:text-gray-400"
                    />
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  
                  {showServiceSearch && serviceSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredServices.map(service => (
                        <button
                          key={service.id}
                          onClick={() => handleAddService(service)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between text-sm"
                        >
                          <span>{service.name}</span>
                          <span className="text-gray-500">R$ {fmtMoney(service.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Services */}
                  {formData.services.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {formData.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                          <span className="text-sm">{service.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">R$ {fmtMoney(service.price)}</span>
                            <button
                              onClick={() => handleRemoveService(index)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <button 
                      onClick={() => setShowServiceSearch(true)}
                      className="text-amber-600 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Item
                    </button>
                    <span className="text-sm font-bold">
                      Total: R$ {fmtMoney(formData.total_amount)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* Block Reason */
              <div>
                <Label className="text-gray-500 text-sm">Motivo do Bloqueio</Label>
                <Textarea
                  value={formData.block_reason || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, block_reason: e.target.value }))}
                  placeholder="Motivo..."
                  className="mt-1"
                />
              </div>
            )}

            {/* Duration */}
            <div>
              <Label className="text-gray-500 text-sm">
                Duração {formData.services.length > 0 ? '(Valor padrão baseado no serviço)' : ''}
              </Label>
              <Select
                value={String(getTotalDurationMinutes())}
                onValueChange={(value) => handleDurationChange(Number(value))}
              >
                <SelectTrigger className="mt-1 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(opt => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-gray-500 text-sm">Observações</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pt-3 pb-4 border-t space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="flex-1 gold-gradient text-black font-bold h-14 rounded-2xl text-base"
              >
                Salvar
              </Button>
              {formData.type === 'appointment' && professionals && professionals.length > 0 && (
                <WhatsAppActions
                  clientPhone={clients?.find(c => c.id === formData.client_id)?.phone}
                  clientName={formData.client_name}
                />
              )}
            </div>

            {appointment && appointment.status !== 'cancelled' && (
              <Button
                variant="outline"
                onClick={() => onCancel?.(appointment.id)}
                className="w-full text-amber-600 border-amber-200 h-12 rounded-2xl"
              >
                Cancelar Agendamento
              </Button>
            )}

            {appointment && !confirmDelete && (
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                className="w-full text-red-500 border-red-200 h-12 rounded-2xl"
              >
                Excluir Agendamento
              </Button>
            )}

            {appointment && confirmDelete && (
              <div className="rounded-2xl border border-red-200 p-3 space-y-2">
                <p className="text-sm text-center text-red-600 font-medium">
                  Tem certeza? Essa ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 h-10 rounded-xl text-gray-600"
                  >
                    Não
                  </Button>
                  <Button
                    onClick={() => { onDelete(appointment.id); setConfirmDelete(false); }}
                    className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                  >
                    Sim, excluir
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}