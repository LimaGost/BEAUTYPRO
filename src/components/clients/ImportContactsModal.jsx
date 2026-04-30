/**
 * ImportContactsModal
 *
 * Estratégia de acesso a contatos por plataforma:
 *
 *   App nativo (iOS/Android via Capacitor)
 *     → @capacitor-community/contacts: lê TODOS os contatos automaticamente
 *       após uma única concessão de permissão. Fluxo totalmente automático.
 *
 *   Web — Android Chrome/Edge
 *     → Contact Picker API (navigator.contacts): o usuário seleciona contatos
 *       manualmente na UI nativa do sistema.
 *
 *   Web — iPhone / Desktop
 *     → Importação de arquivo .vcf exportado do app de Contatos.
 *
 * Em qualquer caso, o fallback "Adicionar Manualmente" sempre está disponível.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Check, Search, AlertCircle, Loader2, Upload, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';

// Plugin de contatos nativos — importado dinamicamente para não quebrar no browser
let NativeContacts = null;
if (Capacitor.isNativePlatform()) {
  import('@capacitor-community/contacts').then(m => { NativeContacts = m.Contacts; });
}

export default function ImportContactsModal({ isOpen, onClose, onImport, existingClients = [] }) {
  const [contacts,    setContacts]    = useState([]);
  const [selected,    setSelected]    = useState(new Set());
  const [loading,     setLoading]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error,       setError]       = useState('');
  const [step,        setStep]        = useState('idle'); // idle | loaded | manual
  const [manualForm,  setManualForm]  = useState({ first_name: '', last_name: '', phone: '' });
  const vcfInputRef = useRef(null);

  const isNative           = Capacitor.isNativePlatform();
  const supportsWebPicker  = !isNative && typeof navigator !== 'undefined'
                             && 'contacts' in navigator && 'ContactsManager' in window;

  const existingPhones = new Set(existingClients.map(c => c.phone?.replace(/\D/g, '')));

  // ── Abertura automática ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    if (isNative) {
      // App nativo: carrega todos os contatos automaticamente ao abrir
      loadNativeContacts();
    } else if (supportsWebPicker) {
      // Android Chrome: abre o seletor nativo do sistema automaticamente
      loadWebPickerContacts();
    }
    // iOS web / desktop: permanece na tela inicial com opções manuais
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Loaders por plataforma ─────────────────────────────────────────────────

  /** Lê todos os contatos do dispositivo via Capacitor (iOS e Android nativos) */
  async function loadNativeContacts() {
    setError('');
    setLoading(true);
    try {
      // Solicita permissão — no iOS abre o popup de sistema na primeira vez
      const permission = await NativeContacts.requestPermissions();
      if (permission.contacts !== 'granted') {
        setError('Permissão de contatos negada. Acesse Configurações > BeautyPro > Contatos para habilitar.');
        setLoading(false);
        return;
      }

      const { contacts: raw } = await NativeContacts.getContacts({
        projection: { name: true, phones: true },
      });

      const parsed = raw
        .filter(c => c.phones?.length > 0)
        .map(c => {
          const given  = c.name?.given  || '';
          const family = c.name?.family || '';
          // Usa displayName como fallback quando nome estruturado não está disponível
          const display = c.displayName || '';
          const parts  = display.split(' ');

          const first_name = given  || parts[0]            || '';
          const last_name  = family || parts.slice(1).join(' ') || '';
          const phone      = (c.phones[0]?.number || '').replace(/\s+/g, '');

          return { first_name, last_name, phone, rawPhone: phone.replace(/\D/g, '') };
        })
        .filter(c => c.first_name || c.last_name);

      applyContacts(parsed);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Não foi possível acessar os contatos. Verifique as permissões em Configurações.');
      }
    }
    setLoading(false);
  }

  /** Abre o seletor nativo de contatos do navegador (Android Chrome) */
  async function loadWebPickerContacts() {
    setError('');
    setLoading(true);
    try {
      const result = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      if (!result?.length) { setLoading(false); return; }

      const parsed = result
        .filter(c => c.name?.[0] && c.tel?.[0])
        .map(c => {
          const parts = (c.name[0] || '').trim().split(' ');
          const phone = (c.tel[0] || '').replace(/\s+/g, '');
          return {
            first_name: parts[0] || '',
            last_name:  parts.slice(1).join(' ') || '',
            phone,
            rawPhone:   phone.replace(/\D/g, ''),
          };
        });

      applyContacts(parsed);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Não foi possível acessar os contatos. Tente importar um arquivo VCF.');
      }
    }
    setLoading(false);
  }

  /** Faz o parse de um arquivo .vcf exportado do app de Contatos */
  async function handleVCFUpload(e) {
    setError('');
    setLoading(true);
    try {
      const file = e.target.files?.[0];
      if (!file) { setLoading(false); return; }

      const text  = await file.text();
      const parsed = [];

      for (const card of text.split(/BEGIN:VCARD/i).slice(1)) {
        const fnMatch  = card.match(/^FN[^:]*:(.+)$/m);
        const nMatch   = card.match(/^N[^:]*:([^;\n]*);([^;\n]*)/m);
        const telMatch = card.match(/^TEL[^:]*:([^\n\r]+)/m);

        let first_name = '', last_name = '';

        if (fnMatch) {
          const parts = fnMatch[1].trim().split(' ');
          first_name = parts[0] || '';
          last_name  = parts.slice(1).join(' ') || '';
        } else if (nMatch) {
          last_name  = nMatch[1].trim();
          first_name = nMatch[2].trim();
        }

        if (!first_name && !last_name) continue;
        if (!telMatch) continue;

        const phone = telMatch[1].replace(/\s+/g, '').trim();
        parsed.push({ first_name, last_name, phone, rawPhone: phone.replace(/\D/g, '') });
      }

      if (parsed.length === 0) {
        setError('Nenhum contato encontrado. Verifique se o arquivo é um .vcf válido.');
        setLoading(false);
        return;
      }

      applyContacts(parsed);
    } catch {
      setError('Erro ao ler o arquivo. Use um .vcf exportado do app de Contatos.');
    }
    setLoading(false);
    if (vcfInputRef.current) vcfInputRef.current.value = '';
  }

  // ── Helpers de estado ──────────────────────────────────────────────────────

  function applyContacts(parsed) {
    setContacts(parsed);
    setStep('loaded');
    // Pré-seleciona apenas contatos ainda não cadastrados
    setSelected(new Set(
      parsed
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => !existingPhones.has(c.rawPhone))
        .map(({ i }) => i)
    ));
  }

  function toggleContact(index) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  function toggleAll() {
    const eligible = contacts
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !existingPhones.has(c.rawPhone))
      .map(({ i }) => i);
    const allOn = eligible.every(i => selected.has(i));
    setSelected(allOn ? new Set() : new Set(eligible));
  }

  async function handleImport() {
    const toImport = contacts
      .filter((_, i) => selected.has(i))
      .map(({ first_name, last_name, phone }) => ({ first_name, last_name, phone }));
    await onImport(toImport);
    resetState();
  }

  function handleManualAdd() {
    if (!manualForm.first_name.trim() || !manualForm.phone.trim()) {
      setError('Preencha nome e telefone');
      return;
    }
    const phone = manualForm.phone.replace(/\s+/g, '');
    const newContact = {
      first_name: manualForm.first_name.trim(),
      last_name:  manualForm.last_name.trim(),
      phone,
      rawPhone:   phone.replace(/\D/g, ''),
    };
    const newList = [...contacts, newContact];
    setContacts(newList);
    setManualForm({ first_name: '', last_name: '', phone: '' });
    setError('');
    setStep('loaded');
    setSelected(prev => new Set([...prev, newList.length - 1]));
  }

  function resetState() {
    setContacts([]);
    setSelected(new Set());
    setSearchQuery('');
    setError('');
    setStep('idle');
    setManualForm({ first_name: '', last_name: '', phone: '' });
  }

  const handleClose = () => { resetState(); onClose(); };

  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const eligibleCount = contacts.filter(c => !existingPhones.has(c.rawPhone)).length;

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50"
        />

        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative bg-white rounded-t-3xl flex flex-col"
          style={{ maxHeight: '92vh' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-lg font-bold text-gray-900">Importar Contatos</h2>
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* ── IDLE (somente web sem suporte automático) ────────────────── */}
          {step === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
              {loading ? (
                // Mostrado brevemente em plataformas que carregam automaticamente
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                  <p className="text-sm text-gray-500 text-center">
                    {isNative ? 'Lendo contatos do dispositivo...' : 'Abrindo contatos...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
                    <Phone className="w-10 h-10 text-amber-500" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-base font-semibold text-gray-800 mb-1">
                      Importar contatos do celular
                    </h3>
                    <p className="text-sm text-gray-500">
                      Selecione contatos para cadastrá-los como clientes.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 w-full">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="w-full space-y-2">
                    {/* Importação via arquivo VCF (iOS web e desktop) */}
                    <label className="block w-full cursor-pointer">
                      <div className="w-full flex items-center justify-center gap-2 font-bold h-14 rounded-2xl text-base gold-gradient text-black">
                        <Upload className="w-5 h-5 mr-1" /> Importar arquivo VCF
                      </div>
                      <input
                        ref={vcfInputRef}
                        type="file"
                        accept=".vcf,.vcard"
                        onChange={handleVCFUpload}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>

                    <Button
                      onClick={() => setStep('manual')}
                      variant="outline"
                      className="w-full h-12 rounded-2xl text-gray-700 border border-gray-300"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Adicionar Manualmente
                    </Button>
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    No iPhone: exporte seus contatos pelo iCloud.com ou app Contatos → Compartilhar → .vcf
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── MANUAL ──────────────────────────────────────────────────── */}
          {step === 'manual' && (
            <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
              {[
                { field: 'first_name', label: 'Nome *',     placeholder: 'Ana',          required: true },
                { field: 'last_name',  label: 'Sobrenome',  placeholder: 'Silva',         required: false },
                { field: 'phone',      label: 'Telefone *', placeholder: '(11) 9 1234-5678', required: true },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={field === 'phone' ? 'tel' : 'text'}
                    value={manualForm[field]}
                    onChange={e => setManualForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              ))}

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => { setStep(contacts.length ? 'loaded' : 'idle'); setError(''); }}
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl text-gray-700 border border-gray-300"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleManualAdd}
                  className="flex-1 gold-gradient text-black font-bold h-12 rounded-2xl"
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* ── LOADED ──────────────────────────────────────────────────── */}
          {step === 'loaded' && (
            <>
              {/* Busca + controles de seleção */}
              <div className="px-4 py-3 border-b space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar contato..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {selected.size} de {contacts.length} selecionados
                    {contacts.length - eligibleCount > 0 && (
                      <span className="text-green-600 ml-1">
                        · {contacts.length - eligibleCount} já cadastrados
                      </span>
                    )}
                  </p>
                  {eligibleCount > 0 && (
                    <button onClick={toggleAll} className="text-xs text-amber-600 font-medium">
                      {selected.size === eligibleCount ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de contatos */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {filtered.map((contact, i) => {
                  const originalIndex = contacts.indexOf(contact);
                  const isSelected    = selected.has(originalIndex);
                  const alreadyExists = existingPhones.has(contact.rawPhone);

                  return (
                    <button
                      key={i}
                      onClick={() => !alreadyExists && toggleContact(originalIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        alreadyExists ? 'opacity-50 cursor-not-allowed' : 'active:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-amber-400 text-black' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isSelected
                          ? <Check className="w-5 h-5" />
                          : (contact.first_name?.[0] || '?').toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{contact.phone}</p>
                      </div>
                      {alreadyExists && (
                        <span className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full whitespace-nowrap">
                          Já cadastrado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Rodapé com ações */}
              <div
                className="px-4 py-4 border-t flex gap-2"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
              >
                <Button
                  onClick={() => setStep('manual')}
                  variant="outline"
                  className="h-14 px-4 rounded-2xl text-gray-600 border border-gray-300"
                >
                  + Manual
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selected.size === 0}
                  className="flex-1 gold-gradient text-black font-bold h-14 rounded-2xl text-base disabled:opacity-50"
                >
                  Importar {selected.size > 0 ? `${selected.size} cliente${selected.size > 1 ? 's' : ''}` : ''}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
