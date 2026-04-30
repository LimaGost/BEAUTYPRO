// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, ChevronRight, Trash2, Phone, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PROFESSIONAL_COLORS, PROFESSIONAL_FORM_DEFAULT } from '@/models/schemas';
import { useProfessionals, useCreateProfessional, useUpdateProfessional, useDeleteProfessional } from '@/hooks/useProfessionals';

export default function ProfessionalsPage() {
  const [searchQuery,          setSearchQuery]          = useState('');
  const [modalOpen,            setModalOpen]            = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [formData,             setFormData]             = useState(PROFESSIONAL_FORM_DEFAULT);
  const photoInputRef = useRef(null);

  const { data: professionals = [], isLoading } = useProfessionals();
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();
  const deleteProfessional = useDeleteProfessional();

  const resetForm  = () => { setSelectedProfessional(null); setFormData(PROFESSIONAL_FORM_DEFAULT); };
  const closeModal = () => { setModalOpen(false); resetForm(); };

  const openEdit = (prof) => {
    setSelectedProfessional(prof);
    setFormData({
      name:               prof.name               || '',
      email:              prof.email              || '',
      phone:              prof.phone              || '',
      color:              prof.color              || '#C9A861',
      commission_percent: prof.commission_percent || 0,
      document:           prof.document           || '',
      document_type:      prof.document_type      || 'cpf',
      has_schedule:       prof.has_schedule       ?? true,
      permissions:        prof.permissions        || [],
      active:             prof.active             ?? true,
      photo_url:          prof.photo_url          || '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const mutation = selectedProfessional
      ? updateProfessional.mutateAsync({ id: selectedProfessional.id, data: formData })
      : createProfessional.mutateAsync(formData);
    mutation.then(closeModal).catch(() => {});
  };

  const set = (field) => (value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const filtered = professionals.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const active   = filtered.filter((p) => p.active !== false).length;

  return (
    <div className="min-h-screen page-bg">
      {/* Search + count */}
      <div className="bg-white px-4 py-3 border-b border-black/[0.07]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar profissional..."
            className="pl-9 h-11 rounded-xl bg-gray-50 border-gray-200 text-sm"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 px-1">
          {active} ativo{active !== 1 ? 's' : ''} · {professionals.length} total
        </p>
      </div>

      {/* List */}
      <div className="p-4 pb-28 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {searchQuery ? 'Nenhum resultado' : 'Nenhum profissional cadastrado'}
            </h3>
            <p className="text-sm text-gray-400 text-center">
              {searchQuery ? 'Tente outro nome' : 'Toque em + para adicionar'}
            </p>
          </div>
        ) : (
          filtered.map((prof, idx) => (
            <motion.div
              key={prof.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card-surface overflow-hidden"
            >
              <Link
                to={createPageUrl('ProfessionalDetail') + `?id=${prof.id}`}
                className="flex items-center gap-4 p-4"
              >
                {/* Avatar */}
                {prof.photo_url ? (
                  <img
                    src={prof.photo_url}
                    alt={prof.name}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{ backgroundColor: prof.color || '#C9A861' }}
                  >
                    {prof.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{prof.name}</h3>
                    {prof.active === false && (
                      <span className="badge-gray">Inativo</span>
                    )}
                    {prof.commission_percent > 0 && (
                      <span className="badge-amber">{prof.commission_percent}%</span>
                    )}
                  </div>
                  {prof.phone ? (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{prof.phone}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1 truncate">{prof.email || 'Sem contato'}</p>
                  )}
                  {prof.specialties?.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1 truncate">
                      {prof.specialties.slice(0, 2).join(', ')}
                      {prof.specialties.length > 2 && ` +${prof.specialties.length - 2}`}
                    </p>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </Link>

              {/* Edit strip */}
              <button
                onClick={() => openEdit(prof)}
                className="w-full px-4 py-2 text-xs font-semibold text-amber-600 border-t border-gray-100 bg-amber-50/40 text-center hover:bg-amber-50 transition-colors"
              >
                Editar dados
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => { resetForm(); setModalOpen(true); }}
        className="fixed right-5 gold-gradient shadow-xl flex items-center justify-center z-30 rounded-full w-14 h-14"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus className="w-6 h-6 text-black" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button onClick={closeModal} className="text-amber-600 font-semibold text-sm">Fechar</button>
                <h2 className="font-bold text-gray-900">
                  {selectedProfessional ? 'Editar Profissional' : 'Novo Profissional'}
                </h2>
                <div className="w-14" />
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                {/* Foto */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    {formData.photo_url ? (
                      <img
                        src={formData.photo_url}
                        alt="Foto"
                        className="w-20 h-20 rounded-full object-cover border-2 border-amber-200"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                        style={{ backgroundColor: formData.color || '#C9A861' }}
                      >
                        {formData.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-md"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => set('photo_url')(ev.target?.result);
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => set('photo_url')('')}
                      className="text-xs text-red-400 hover:text-red-500"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                {/* Nome + Cor */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome *</Label>
                    <Input value={formData.name} onChange={(e) => set('name')(e.target.value)} placeholder="Nome completo" className="mt-1.5 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cor</Label>
                    <div className="flex gap-1.5 mt-2 flex-wrap max-w-[120px]">
                      {PROFESSIONAL_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => set('color')(color)}
                          className={`w-8 h-8 rounded-full transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => set('email')(e.target.value)} placeholder="email@exemplo.com" className="mt-1.5 h-11 rounded-xl" />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone</Label>
                  <Input value={formData.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="(00) 00000-0000" className="mt-1.5 h-11 rounded-xl" />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de documento</Label>
                  <div className="flex gap-4 mt-2">
                    {['cpf', 'cnpj'].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={formData.document_type === type} onChange={() => set('document_type')(type)} className="w-4 h-4 accent-amber-500" />
                        <span className="text-sm font-medium uppercase">{type}</span>
                      </label>
                    ))}
                  </div>
                  <Input value={formData.document} onChange={(e) => set('document')(e.target.value)} placeholder={formData.document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'} className="mt-2 h-11 rounded-xl" />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Comissão (%)</Label>
                  <Input type="number" min="0" max="100" value={formData.commission_percent} onChange={(e) => set('commission_percent')(parseFloat(e.target.value) || 0)} className="mt-1.5 h-11 rounded-xl" />
                </div>

                <div className="flex items-center justify-between py-2 px-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Possui Agenda</p>
                    <p className="text-xs text-gray-400">Aparece na agenda de agendamentos</p>
                  </div>
                  <Switch checked={formData.has_schedule} onCheckedChange={set('has_schedule')} />
                </div>

                <div className="flex items-center justify-between py-2 px-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Ativo</p>
                    <p className="text-xs text-gray-400">Profissional está em atividade</p>
                  </div>
                  <Switch checked={formData.active} onCheckedChange={set('active')} />
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-2">
                <Button onClick={handleSave} className="w-full gold-gradient text-black font-bold h-12 rounded-xl">
                  Salvar
                </Button>
                {selectedProfessional && (
                  <Button
                    variant="outline"
                    onClick={() => deleteProfessional.mutate(selectedProfessional.id, { onSuccess: closeModal })}
                    className="w-full text-red-500 border-red-200 h-11 rounded-xl text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir profissional
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
