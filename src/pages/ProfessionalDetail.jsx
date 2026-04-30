import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  TrendingUp,
  Award,
  DollarSign,
  Users,
  Sparkles,
  Edit,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const weekDays = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

const specialtyOptions = [
  'Design de Sobrancelhas',
  'Micropigmentação',
  'Alongamento de Cílios',
  'Limpeza de Pele',
  'Dermaplaning',
  'Depilação',
  'Massagem',
  'Maquiagem'
];

export default function ProfessionalDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  
  // Get professional ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const professionalId = urlParams.get('id');

  const { data: professional, isLoading } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      const profs = await apiClient.entities.Professional.filter({ id: professionalId });
      return profs[0];
    },
    enabled: !!professionalId
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments-professional', professionalId],
    queryFn: () => apiClient.entities.Appointment.filter({ professional_id: professionalId })
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-professional', professionalId],
    queryFn: () => apiClient.entities.Transaction.filter({ professional_id: professionalId, type: 'income' })
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [],
    work_schedule: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: false, start: '09:00', end: '13:00' },
      sunday: { enabled: false, start: '09:00', end: '13:00' }
    }
  });

  useEffect(() => {
    if (professional) {
      setFormData({
        name: professional.name || '',
        email: professional.email || '',
        phone: professional.phone || '',
        specialties: professional.specialties || [],
        work_schedule: professional.work_schedule || formData.work_schedule
      });
    }
  }, [professional]);

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Professional.update(professionalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['professional', professionalId]);
      queryClient.invalidateQueries(['professionals']);
      setEditMode(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const toggleSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const updateSchedule = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      work_schedule: {
        ...prev.work_schedule,
        [day]: {
          ...prev.work_schedule[day],
          [field]: value
        }
      }
    }));
  };

  // Calculate stats
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  const thisMonthAppointments = appointments.filter(a => 
    a.date >= monthStart && a.date <= monthEnd && a.status === 'completed'
  );

  const thisMonthRevenue = transactions
    .filter(t => t.date >= monthStart && t.date <= monthEnd)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalAppointments = appointments.filter(a => a.status === 'completed').length;
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Profissional não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="p-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: professional.color || '#C9A861' }}
            >
              {professional.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{professional.name}</h1>
              <p className="text-sm text-gray-500">{professional.email}</p>
              {professional.phone && (
                <p className="text-sm text-gray-500">{professional.phone}</p>
              )}
            </div>
            <Button
              variant={editMode ? "default" : "outline"}
              size="icon"
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              className={editMode ? "gold-gradient text-black" : ""}
            >
              {editMode ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500">Este mês</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{thisMonthAppointments.length}</p>
              <p className="text-xs text-gray-500">atendimentos</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">Este mês</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                R$ {thisMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">receita</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{totalAppointments}</p>
              <p className="text-xs text-gray-500">atendimentos</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <p className="text-xl font-bold text-purple-600">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">receita</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent h-12 rounded-none border-t border-gray-100">
            <TabsTrigger 
              value="info" 
              className="data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none"
            >
              Informações
            </TabsTrigger>
            <TabsTrigger 
              value="schedule"
              className="data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none"
            >
              Horários
            </TabsTrigger>
            <TabsTrigger 
              value="performance"
              className="data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none"
            >
              Desempenho
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'info' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Dados de Contato</h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-500">Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Email</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Especialidades
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map(specialty => (
                  <button
                    key={specialty}
                    onClick={() => editMode && toggleSpecialty(specialty)}
                    disabled={!editMode}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      formData.specialties.includes(specialty)
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                    } ${editMode ? 'cursor-pointer hover:border-amber-200' : 'cursor-default'}`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'schedule' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Horários de Trabalho
            </h3>
            
            <div className="space-y-3">
              {weekDays.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Switch
                    checked={formData.work_schedule[key]?.enabled || false}
                    onCheckedChange={(checked) => updateSchedule(key, 'enabled', checked)}
                    disabled={!editMode}
                  />
                  
                  <span className={`font-medium min-w-[80px] ${
                    formData.work_schedule[key]?.enabled ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>

                  {formData.work_schedule[key]?.enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={formData.work_schedule[key]?.start || '09:00'}
                        onChange={(e) => updateSchedule(key, 'start', e.target.value)}
                        disabled={!editMode}
                        className="h-9 text-sm"
                      />
                      <span className="text-gray-400">até</span>
                      <Input
                        type="time"
                        value={formData.work_schedule[key]?.end || '18:00'}
                        onChange={(e) => updateSchedule(key, 'end', e.target.value)}
                        disabled={!editMode}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Resumo de Performance</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Comissão</p>
                    <p className="text-lg font-bold text-gray-900">{professional.commission_percent || 0}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Este mês</p>
                    <p className="text-lg font-bold gold-text">
                      R$ {((thisMonthRevenue * (professional.commission_percent || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Taxa de Ocupação (Este mês)</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                        style={{ width: `${Math.min((thisMonthAppointments.length / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {thisMonthAppointments.length}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Ticket Médio</p>
                  <p className="text-xl font-bold text-gray-900">
                    R$ {thisMonthAppointments.length > 0 
                      ? (thisMonthRevenue / thisMonthAppointments.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      : '0,00'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Últimos Atendimentos</h3>
              
              <div className="space-y-2">
                {appointments
                  .filter(a => a.status === 'completed')
                  .slice(0, 5)
                  .map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{apt.client_name}</p>
                        <p className="text-xs text-gray-500">{apt.date} • {apt.start_time}</p>
                      </div>
                      <span className="font-bold gold-text">
                        R$ {parseFloat(apt.total_amount||0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                
                {appointments.filter(a => a.status === 'completed').length === 0 && (
                  <p className="text-center text-gray-400 py-4">Nenhum atendimento concluído</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}