// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import {
  Building2, Phone, MessageCircle, MapPin, FileText,
  Image, Loader2, Check, Link2, Sparkles, Copy, ExternalLink, Hash,
} from 'lucide-react';

// ── Máscaras ─────────────────────────────────────────────────────────────────

function maskCNPJ(v) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2)  return d;
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2)  return `(${d}`;
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function validateCNPJ(cnpj) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  const calc = (x) => {
    let s = 0, p = x - 7;
    for (let i = 1; i <= x; i++) { s += parseInt(d[i - 1]) * p--; if (p < 2) p = 9; }
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

function validatePhone(phone) {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 || d.length === 11;
}

// ── UI primitives ─────────────────────────────────────────────────────────────

const inp = 'w-full px-4 py-3 rounded-2xl text-sm font-medium text-white focus:outline-none transition-all';
const inpStyle = { background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.10)' };
const inpFocus = { border: '1px solid rgba(201,168,97,0.55)', boxShadow: '0 0 0 3px rgba(201,168,97,0.10)' };
const inpError = { border: '1px solid rgba(248,113,113,0.55)', boxShadow: '0 0 0 3px rgba(248,113,113,0.08)' };

function Field({ icon: Icon, label, error, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
        style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.25)' }} />
        )}
        {children}
      </div>
      {error && <p className="text-[11px] mt-1 px-1" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}

function DarkInput({ icon, hasError, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
      className={`${inp} ${icon ? 'pl-10' : 'pl-4'} pr-4`}
      style={{ ...inpStyle, ...(hasError ? inpError : focused ? inpFocus : {}) }}
    />
  );
}

function DarkTextarea(props) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-white focus:outline-none transition-all resize-none"
      style={{
        background: '#1C1C1E',
        border: `1px solid ${focused ? 'rgba(201,168,97,0.55)' : 'rgba(255,255,255,0.10)'}`,
        boxShadow: focused ? '0 0 0 3px rgba(201,168,97,0.10)' : 'none',
      }}
      rows={3}
    />
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function Company() {
  const { company, updateCompany } = useAuth();

  const [form, setForm] = useState({
    name: '', cnpj: '', phone: '', whatsapp: '',
    address: '', description: '', logo_url: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        name:        company.name        || '',
        cnpj:        maskCNPJ(company.cnpj || ''),
        phone:       maskPhone(company.phone    || ''),
        whatsapp:    maskPhone(company.whatsapp || ''),
        address:     company.address     || '',
        description: company.description || '',
        logo_url:    company.logo_url    || '',
      });
    }
  }, [company]);

  const setMasked = (field, maskFn) => (e) => {
    const masked = maskFn(e.target.value);
    setForm((f) => ({ ...f, [field]: masked }));
    setFieldErrors((fe) => ({ ...fe, [field]: '' }));
  };

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [field]: '' }));
  };

  const publicUrl = company?.slug
    ? `${window.location.origin}/agendar/${company.slug}`
    : '';

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Obrigatório.';

    const rawCnpj = form.cnpj.replace(/\D/g, '');
    if (rawCnpj && !validateCNPJ(form.cnpj)) errs.cnpj = 'CNPJ inválido.';

    const rawPhone = form.phone.replace(/\D/g, '');
    if (rawPhone && !validatePhone(form.phone)) errs.phone = 'Telefone inválido.';

    const rawWpp = form.whatsapp.replace(/\D/g, '');
    if (rawWpp && !validatePhone(form.whatsapp)) errs.whatsapp = 'WhatsApp inválido.';

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setError('');
    setLoading(true);
    try {
      await updateCompany({
        ...form,
        cnpj:     form.cnpj.replace(/\D/g, ''),
        phone:    form.phone.replace(/\D/g, ''),
        whatsapp: form.whatsapp.replace(/\D/g, ''),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-4 py-6 pb-28 max-w-lg mx-auto space-y-5">

      {/* Banner de boas-vindas */}
      {!company && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl flex items-start gap-4"
          style={{ background: 'linear-gradient(135deg,rgba(201,168,97,0.12),rgba(229,212,168,0.06))', border: '1px solid rgba(201,168,97,0.30)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,97,0.15)' }}>
            <Sparkles className="w-5 h-5" style={{ color: '#C9A861' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Cadastre sua empresa</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Preencha os dados abaixo para liberar seu link de agendamento e começar a receber clientes.
            </p>
          </div>
        </motion.div>
      )}

      {/* Link público de agendamento */}
      {company?.slug && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(201,168,97,0.30)' }}
        >
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,rgba(201,168,97,0.14),rgba(229,212,168,0.06))' }}>
            <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A861' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C9A861' }}>
              Link de agendamento
            </p>
          </div>
          <div className="px-4 py-3 space-y-3" style={{ background: '#0E0E0E' }}>
            <p className="text-xs break-all" style={{ color: 'rgba(255,255,255,0.55)' }}>{publicUrl}</p>
            <div className="flex gap-2">
              <button
                type="button" onClick={copyLink}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                style={{
                  background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,97,0.15)',
                  color:      copied ? '#4ade80'                : '#C9A861',
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
              <a
                href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* Formulário */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Dados da empresa
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <Field icon={Building2} label="Nome da Empresa *" error={fieldErrors.name}>
            <DarkInput icon type="text" value={form.name} onChange={set('name')}
              placeholder="Ex: Studio Elegância" hasError={!!fieldErrors.name} />
          </Field>

          <Field icon={Hash} label="CNPJ" error={fieldErrors.cnpj}>
            <DarkInput icon type="text" inputMode="numeric" value={form.cnpj}
              onChange={setMasked('cnpj', maskCNPJ)}
              placeholder="00.000.000/0000-00" hasError={!!fieldErrors.cnpj} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field icon={Phone} label="Telefone" error={fieldErrors.phone}>
              <DarkInput icon type="tel" inputMode="numeric" value={form.phone}
                onChange={setMasked('phone', maskPhone)}
                placeholder="(00) 00000-0000" hasError={!!fieldErrors.phone} />
            </Field>
            <Field icon={MessageCircle} label="WhatsApp" error={fieldErrors.whatsapp}>
              <DarkInput icon type="tel" inputMode="numeric" value={form.whatsapp}
                onChange={setMasked('whatsapp', maskPhone)}
                placeholder="(00) 00000-0000" hasError={!!fieldErrors.whatsapp} />
            </Field>
          </div>

          <Field icon={MapPin} label="Endereço">
            <DarkInput icon type="text" value={form.address} onChange={set('address')}
              placeholder="Rua, número, bairro" />
          </Field>

          <Field icon={Image} label="URL do Logo">
            <DarkInput icon type="url" value={form.logo_url} onChange={set('logo_url')}
              placeholder="https://..." />
          </Field>

          {form.logo_url && (
            <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-2xl object-cover"
              onError={(e) => { e.target.style.display = 'none'; }} />
          )}

          <Field icon={FileText} label="Descrição">
            <DarkTextarea value={form.description} onChange={set('description')}
              placeholder="Fale um pouco sobre sua empresa..." />
          </Field>

          {error && <p className="text-sm text-red-400 px-1">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-black text-base transition-opacity disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg,#C9A861 0%,#E5D4A8 100%)',
              boxShadow: '0 4px 20px rgba(201,168,97,0.25)',
            }}
          >
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              : saved
                ? <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Salvo!</span>
                : company ? 'Salvar empresa' : 'Criar empresa'
            }
          </button>
        </form>
      </motion.div>

    </div>
  );
}
