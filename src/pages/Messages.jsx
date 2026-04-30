import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageSquare, Trash2, Clock, Gift, Megaphone, Bell, Send, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const typeIcons = {
  reminder: Clock,
  promotion: Megaphone,
  birthday: Gift,
  confirmation: Bell,
  custom: MessageSquare
};

const typeLabels = {
  reminder: 'Lembrete de Horário',
  promotion: 'Promoção',
  birthday: 'Aniversário',
  confirmation: 'Confirmação',
  custom: 'Personalizada'
};

const templateVariables = [
  { key: '{nome}',    description: 'Nome do cliente' },
  { key: '{data}',    description: 'Data do agendamento' },
  { key: '{hora}',    description: 'Hora do agendamento' },
  { key: '{servico}', description: 'Nome do serviço' },
  { key: '{valor}',   description: 'Valor do serviço' },
];

function replaceVars(text, vars) {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(k, v || k), text);
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery]       = useState('');
  const [modalOpen, setModalOpen]           = useState(false);
  const [sendModal, setSendModal]           = useState(null); // template sendo enviado
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'custom', content: '', active: true });

  // Estado do modal de envio
  const [sendPhone,   setSendPhone]   = useState('');
  const [sendNome,    setSendNome]    = useState('');
  const [sendData,    setSendData]    = useState('');
  const [sendHora,    setSendHora]    = useState('');
  const [sendServico, setSendServico] = useState('');
  const [sendValor,   setSendValor]   = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['messageTemplates'],
    queryFn: () => apiClient.entities.MessageTemplate.list()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.entities.Client.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.entities.MessageTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['messageTemplates'] }); setModalOpen(false); resetForm(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.MessageTemplate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['messageTemplates'] }); setModalOpen(false); resetForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.MessageTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['messageTemplates'] }); setModalOpen(false); resetForm(); }
  });

  const resetForm = () => {
    setSelectedTemplate(null);
    setFormData({ name: '', type: 'custom', content: '', active: true });
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({ name: template.name || '', type: template.type || 'custom', content: template.content || '', active: template.active ?? true });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({ ...prev, content: prev.content + variable }));
  };

  const openSendModal = (template) => {
    setSendModal(template);
    setSendPhone(''); setSendNome(''); setSendData('');
    setSendHora(''); setSendServico(''); setSendValor('');
    setClientSearch('');
  };

  const selectClient = (client) => {
    setSendNome(client.first_name + (client.last_name ? ' ' + client.last_name : ''));
    setSendPhone(client.phone || '');
    setClientSearch('');
  };

  const sendToWhatsApp = () => {
    const vars = { '{nome}': sendNome, '{data}': sendData, '{hora}': sendHora, '{servico}': sendServico, '{valor}': sendValor };
    const text  = replaceVars(sendModal.content, vars);
    const phone = sendPhone.replace(/\D/g, '');
    const url   = phone
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clientSearch.length >= 2
    ? clients.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar mensagem..." className="pl-10 h-12 rounded-xl" />
        </div>
      </div>

      {/* Templates List */}
      <div className="pb-24 p-4 space-y-3">
        {isLoading ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhuma mensagem cadastrada</h3>
            <p className="text-sm text-gray-400">Crie templates para enviar aos seus clientes</p>
          </div>
        ) : (
          filteredTemplates.map((template, index) => {
            const Icon = typeIcons[template.type] || MessageSquare;
            return (
              <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                      <Icon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-xs text-gray-500">{typeLabels[template.type] || template.type}</p>
                    </div>
                  </div>
                  <Switch checked={!!template.active}
                    onCheckedChange={(checked) => updateMutation.mutate({ id: template.id, data: { ...template, active: checked } })} />
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.content}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)} className="flex-1">Editar</Button>
                  <Button size="sm" onClick={() => openSendModal(template)} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <Send className="w-4 h-4 mr-2" />Enviar
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { resetForm(); setModalOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full gold-gradient shadow-xl flex items-center justify-center z-30">
        <Plus className="w-6 h-6 text-black" />
      </motion.button>

      {/* Modal Editar/Criar */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setModalOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <button onClick={() => setModalOpen(false)} className="text-amber-600 font-medium">Fechar</button>
                <h2 className="font-semibold text-lg">Mensagem</h2>
                <div className="w-12" />
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div>
                  <Label className="text-gray-500 text-sm">Nome do Template *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Lembrete 24h antes" className="mt-1" />
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-500 text-sm">Conteúdo da Mensagem</Label>
                  <Textarea value={formData.content} onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Escreva sua mensagem..." className="mt-1 h-32" />
                </div>
                <div>
                  <Label className="text-gray-500 text-sm mb-2 block">Clique para inserir variável</Label>
                  <div className="flex flex-wrap gap-2">
                    {templateVariables.map(v => (
                      <button key={v.key} type="button" onClick={() => insertVariable(v.key)}
                        className="px-3 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors">
                        {v.key} <span className="text-gray-400">— {v.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label className="text-gray-700">Ativo</Label>
                    <p className="text-xs text-gray-500">Template disponível para uso</p>
                  </div>
                  <Switch checked={formData.active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))} />
                </div>
              </div>
              <div className="p-4 border-t space-y-2">
                <Button onClick={handleSave} className="w-full gold-gradient text-black font-semibold h-12 rounded-xl">Salvar</Button>
                {selectedTemplate && (
                  <Button variant="outline" onClick={() => deleteMutation.mutate(selectedTemplate.id)}
                    className="w-full text-red-500 border-red-200 h-12 rounded-xl">
                    <Trash2 className="w-4 h-4 mr-2" />Excluir Mensagem
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Enviar pelo WhatsApp */}
      <AnimatePresence>
        {sendModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setSendModal(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <button onClick={() => setSendModal(null)} className="text-gray-500"><X className="w-5 h-5" /></button>
                <h2 className="font-semibold text-lg">Enviar via WhatsApp</h2>
                <div className="w-8" />
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(92vh-160px)] space-y-4">
                {/* Busca cliente */}
                <div className="relative">
                  <Label className="text-gray-500 text-sm">Buscar cliente (opcional)</Label>
                  <Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Digite o nome do cliente..." className="mt-1" />
                  {filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-xl shadow-lg mt-1">
                      {filteredClients.map(c => (
                        <button key={c.id} onClick={() => selectClient(c)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b last:border-0">
                          {c.first_name} {c.last_name} — {c.phone}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campos */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-500 text-sm">{'{nome}'}</Label>
                    <Input value={sendNome} onChange={(e) => setSendNome(e.target.value)} placeholder="Nome do cliente" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Telefone (WhatsApp)</Label>
                    <Input value={sendPhone} onChange={(e) => setSendPhone(e.target.value)} placeholder="(00) 00000-0000" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">{'{data}'}</Label>
                    <Input value={sendData} onChange={(e) => setSendData(e.target.value)} placeholder="Ex: 25/04/2026" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">{'{hora}'}</Label>
                    <Input value={sendHora} onChange={(e) => setSendHora(e.target.value)} placeholder="Ex: 14:00" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">{'{servico}'}</Label>
                    <Input value={sendServico} onChange={(e) => setSendServico(e.target.value)} placeholder="Ex: Design de Sobrancelha" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">{'{valor}'}</Label>
                    <Input value={sendValor} onChange={(e) => setSendValor(e.target.value)} placeholder="Ex: R$ 80,00" className="mt-1" />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium mb-2">Preview da mensagem:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {replaceVars(sendModal.content, {
                      '{nome}': sendNome, '{data}': sendData, '{hora}': sendHora,
                      '{servico}': sendServico, '{valor}': sendValor
                    })}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t">
                <Button onClick={sendToWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 rounded-xl">
                  <Send className="w-5 h-5 mr-2" />
                  Abrir no WhatsApp
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
