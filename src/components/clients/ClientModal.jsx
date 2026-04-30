import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ClientModal({ isOpen, onClose, client, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    birthday: '',
    notes: '',
    anamnesis: {
      allergies: '',
      medications: '',
      skin_type: '',
      health_conditions: '',
      previous_procedures: '',
      observations: ''
    }
  });
  
  const [showAnamnesis, setShowAnamnesis] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        phone: client.phone || '',
        email: client.email || '',
        birthday: client.birthday || '',
        notes: client.notes || '',
        anamnesis: client.anamnesis || {
          allergies: '',
          medications: '',
          skin_type: '',
          health_conditions: '',
          previous_procedures: '',
          observations: ''
        }
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        birthday: '',
        notes: '',
        anamnesis: {
          allergies: '',
          medications: '',
          skin_type: '',
          health_conditions: '',
          previous_procedures: '',
          observations: ''
        }
      });
    }
  }, [client]);

  const handleAnamnesisChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      anamnesis: {
        ...prev.anamnesis,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl flex flex-col"
          style={{ maxHeight: 'calc(100dvh - 56px - env(safe-area-inset-bottom) - env(safe-area-inset-top))' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b flex-shrink-0">
            <button onClick={onClose} className="text-amber-600 font-medium">
              Fechar
            </button>
            <h2 className="font-semibold text-lg">
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <div className="w-12" />
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-500 text-sm">Nome *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Nome"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Sobrenome</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Sobrenome"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Telefone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Data de Aniversário</Label>
              <Input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações gerais..."
                className="mt-1"
              />
            </div>

            {/* Anamnesis Section */}
            <div className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowAnamnesis(!showAnamnesis)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Ficha de Anamnese</span>
                {showAnamnesis ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {showAnamnesis && (
                <div className="p-4 space-y-4 border-t">
                  <div>
                    <Label className="text-gray-500 text-sm">Alergias</Label>
                    <Textarea
                      value={formData.anamnesis.allergies}
                      onChange={(e) => handleAnamnesisChange('allergies', e.target.value)}
                      placeholder="Possui alguma alergia?"
                      className="mt-1 h-20"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-500 text-sm">Medicamentos em Uso</Label>
                    <Textarea
                      value={formData.anamnesis.medications}
                      onChange={(e) => handleAnamnesisChange('medications', e.target.value)}
                      placeholder="Está tomando algum medicamento?"
                      className="mt-1 h-20"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-500 text-sm">Tipo de Pele</Label>
                    <Input
                      value={formData.anamnesis.skin_type}
                      onChange={(e) => handleAnamnesisChange('skin_type', e.target.value)}
                      placeholder="Normal, oleosa, seca, mista..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-500 text-sm">Condições de Saúde</Label>
                    <Textarea
                      value={formData.anamnesis.health_conditions}
                      onChange={(e) => handleAnamnesisChange('health_conditions', e.target.value)}
                      placeholder="Diabetes, hipertensão, gestante..."
                      className="mt-1 h-20"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-500 text-sm">Procedimentos Anteriores</Label>
                    <Textarea
                      value={formData.anamnesis.previous_procedures}
                      onChange={(e) => handleAnamnesisChange('previous_procedures', e.target.value)}
                      placeholder="Já fez algum procedimento estético?"
                      className="mt-1 h-20"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-500 text-sm">Outras Observações</Label>
                    <Textarea
                      value={formData.anamnesis.observations}
                      onChange={(e) => handleAnamnesisChange('observations', e.target.value)}
                      placeholder="Observações adicionais..."
                      className="mt-1 h-20"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t space-y-2 flex-shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>
            <Button
              onClick={handleSave}
              className="w-full gold-gradient text-black font-semibold h-12 rounded-xl"
            >
              Salvar
            </Button>
            
            {client && (
              <Button
                variant="outline"
                onClick={() => onDelete(client.id)}
                className="w-full text-red-500 border-red-200 h-12 rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Cliente
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}