import React, { useState, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

export default function WhatsAppActions({ clientPhone, clientName }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const messageTemplates = await apiClient.entities.MessageTemplate.filter({ active: true });
        setTemplates(messageTemplates);
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const sendViaWhatsApp = (templateContent) => {
    if (!clientPhone) {
      alert('Telefone do cliente não informado');
      return;
    }

    // Remove caracteres especiais e formata o número
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    // Prepara a mensagem
    const message = templateContent.replace('{nome}', clientName || 'cliente');
    const encodedMessage = encodeURIComponent(message);
    
    // Abre WhatsApp Web ou App
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!clientPhone) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        WhatsApp
      </button>

      {showOptions && (
        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-64 max-h-64 overflow-y-auto z-10">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Carregando templates...
            </div>
          ) : templates.length > 0 ? (
            <>
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    sendViaWhatsApp(template.content);
                    setShowOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {template.content}
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Nenhum template disponível
            </div>
          )}
        </div>
      )}
    </div>
  );
}