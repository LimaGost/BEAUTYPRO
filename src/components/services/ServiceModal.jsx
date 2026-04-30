import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categories = [
  { value: 'sobrancelha', label: 'Sobrancelha' },
  { value: 'cilios', label: 'Cílios' },
  { value: 'micropigmentacao', label: 'Micropigmentação' },
  { value: 'limpeza_pele', label: 'Limpeza de Pele' },
  { value: 'dermaplaning', label: 'Dermaplaning' },
  { value: 'outros', label: 'Outros' },
];

const durations = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2h' },
  { value: 150, label: '2h 30min' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
  { value: 300, label: '5h' },
  { value: 360, label: '6h' },
];

export default function ServiceModal({ isOpen, onClose, service, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'outros',
    duration_minutes: 60,
    price: 0,
    cost: 0,
    description: '',
    available_online: true,
    active: true
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        category: service.category || 'outros',
        duration_minutes: service.duration_minutes || 60,
        price: service.price || 0,
        cost: service.cost || 0,
        description: service.description || '',
        available_online: service.available_online ?? true,
        active: service.active ?? true
      });
    } else {
      setFormData({
        name: '',
        category: 'outros',
        duration_minutes: 60,
        price: 0,
        cost: 0,
        description: '',
        available_online: true,
        active: true
      });
    }
  }, [service]);

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
          <div className="flex items-center justify-between px-4 pb-3 pt-1 border-b flex-shrink-0">
            <button onClick={onClose} className="text-amber-600 font-semibold text-base py-1">
              Fechar
            </button>
            <h2 className="font-bold text-lg text-gray-900">Serviço</h2>
            <div className="w-14" />
          </div>

          {/* Content */}
          <div className="px-4 pt-3 pb-2 overflow-y-auto flex-1 space-y-4">
            <div>
              <Label className="text-gray-500 text-sm">Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do serviço"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Duração</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map(d => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Preço</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Custo do Serviço</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700">Agendamento Online</Label>
                <p className="text-xs text-gray-500">Disponível para agendamento online</p>
              </div>
              <Switch
                checked={formData.available_online}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available_online: checked }))}
              />
            </div>

            <div>
              <Label className="text-gray-500 text-sm">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do serviço..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pt-3 pb-3 border-t space-y-2 flex-shrink-0">
            <Button
              onClick={() => onSave(formData)}
              className="w-full gold-gradient text-black font-bold h-14 rounded-2xl text-base"
            >
              Salvar
            </Button>

            {service && (
              <Button
                variant="outline"
                onClick={() => onDelete(service.id)}
                className="w-full text-red-500 border-red-200 h-12 rounded-2xl"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Serviço
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}