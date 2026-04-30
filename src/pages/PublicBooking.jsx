// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { publicBookingApi } from '@/services/publicBookingApi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Loader2, Check, Calendar,
  Clock, User, Phone, MessageSquare, Sparkles, Building2,
} from 'lucide-react';
import { formatBrazilianCellphone, validateBrazilianCellphone, onlyNumbers } from '@/utils/formatters';

// ── Helpers de calendário ─────────────────────────────────────────────────────

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function firstWeekday(year, month) { return new Date(year, month, 1).getDay(); }
function pad(n) { return String(n).padStart(2, '0'); }
function toISO(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  const date = new Date(+y, +m - 1, +d);
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS_PT   = ['D','S','T','Q','Q','S','S'];

function Calendar2({ selected, onSelect }) {
  const today = new Date();
  const [yr,  setYr]  = useState(today.getFullYear());
  const [mo,  setMo]  = useState(today.getMonth());

  const days    = daysInMonth(yr, mo);
  const offset  = firstWeekday(yr, mo);
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  function prev() { if (mo === 0) { setYr(y => y - 1); setMo(11); } else setMo(m => m - 1); }
  function next() { if (mo === 11) { setYr(y => y + 1); setMo(0); } else setMo(m => m + 1); }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-white">{MONTHS_PT[mo]} {yr}</span>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAYS_PT.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold py-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
          const iso     = toISO(yr, mo, day);
          const isPast  = iso < todayISO;
          const isSel   = iso === selected;
          const isToday = iso === todayISO;
          return (
            <button
              key={day}
              onClick={() => !isPast && onSelect(iso)}
              disabled={isPast}
              className="aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all disabled:opacity-25"
              style={isSel
                ? { background: 'linear-gradient(135deg,#C9A861,#E5D4A8)', color: '#000' }
                : isToday
                ? { background: 'rgba(201,168,97,0.15)', color: '#C9A861' }
                : { color: 'rgba(255,255,255,0.75)' }
              }
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = ['Serviço', 'Profissional', 'Data', 'Horário', 'Dados', 'Confirmar'];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-1 justify-center flex-wrap">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black transition-all"
            style={
              i < current  ? { background: '#C9A861', color: '#000' }
            : i === current ? { background: 'rgba(201,168,97,0.25)', color: '#C9A861', border: '1.5px solid rgba(201,168,97,0.6)' }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
            }
          >
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-4 h-px" style={{ background: i < current ? '#C9A861' : 'rgba(255,255,255,0.10)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PublicBooking() {
  const { slug } = useParams();

  const [step,          setStep]          = useState(0);
  const [company,       setCompany]       = useState(null);
  const [services,      setServices]      = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slots,         setSlots]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [phoneError,    setPhoneError]    = useState('');
  const [done,          setDone]          = useState(false);

  const [selectedService,  setSelectedService]  = useState(null);
  const [selectedProf,     setSelectedProf]     = useState(null); // null = qualquer
  const [selectedDate,     setSelectedDate]     = useState('');
  const [selectedTime,     setSelectedTime]     = useState('');
  const [form,             setForm]             = useState({ name: '', phone: '', notes: '' });

  // Carrega dados da empresa
  useEffect(() => {
    Promise.allSettled([
      publicBookingApi.getCompany(slug),
      publicBookingApi.getServices(slug),
      publicBookingApi.getProfessionals(slug),
    ])
      .then(([companyRes, servicesRes, profsRes]) => {
        if (companyRes.status === 'rejected') {
          setError('Empresa não encontrada.');
        } else {
          setCompany(companyRes.value);
          setServices(servicesRes.status === 'fulfilled' ? servicesRes.value : []);
          setProfessionals(profsRes.status === 'fulfilled' ? profsRes.value : []);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Carrega slots ao mudar data/serviço/profissional
  const loadSlots = useCallback(async () => {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    try {
      const times = await publicBookingApi.getAvailableTimes(
        slug, selectedDate, selectedService.id, selectedProf?.id
      );
      setSlots(times);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, selectedDate, selectedService, selectedProf]);

  useEffect(() => {
    if (step === 3) loadSlots();
  }, [step, loadSlots]);

  async function handleConfirm() {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return; }
    if (!validateBrazilianCellphone(form.phone)) {
      setError('Telefone inválido. Use o formato (00) 90000-0000.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await publicBookingApi.createAppointment(slug, {
        customer_name:   form.name.trim(),
        customer_phone:  onlyNumbers(form.phone),
        notes:           form.notes.trim(),
        date:            selectedDate,
        start_time:      selectedTime,
        service_id:      selectedService?.id,
        professional_id: selectedProf?.id ?? null,
      });
      setDone(true);
      // Recarrega slots para refletir o horário ocupado quando fizer outro agendamento
      loadSlots();
    } catch (err) {
      const msg = err.message || '';
      try { const j = JSON.parse(msg); setError(j.error || msg); } catch { setError(msg || 'Erro ao confirmar agendamento.'); }
    } finally {
      setSubmitting(false);
    }
  }

  const hasProfessionals = professionals.length > 0;

  function goNext() {
    // Pula profissional se não há profissionais cadastrados
    if (step === 0 && !hasProfessionals) { setStep(2); return; }
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step === 2 && !hasProfessionals) { setStep(0); return; }
    setStep((s) => s - 1);
  }

  // ── Carregando ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C9A861' }} />
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: '#080808' }}>
        <Building2 className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p className="text-white font-bold text-center">{error}</p>
      </div>
    );
  }

  // ── Sucesso ─────────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: '#080808' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.4)' }}
        >
          <Check className="w-9 h-9" style={{ color: '#4ade80' }} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Agendado!</h2>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Seu agendamento em <strong className="text-white">{company?.name}</strong> foi confirmado.
          </p>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {formatDate(selectedDate)} às {selectedTime}
          </p>
        </div>
        <button
          onClick={() => {
            setStep(0); setDone(false);
            setSelectedService(null); setSelectedProf(null);
            setSelectedDate(''); setSelectedTime('');
            setForm({ name: '', phone: '', notes: '' });
            setError(''); setPhoneError('');
          }}
          className="px-6 py-3 rounded-2xl font-bold text-sm"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
        >
          Fazer outro agendamento
        </button>
      </div>
    );
  }

  // ── Layout principal ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080808' }}>

      {/* Header empresa */}
      <div className="px-5 pt-8 pb-5 text-center border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {company?.logo_url && (
          <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3" />
        )}
        {!company?.logo_url && (
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center font-black text-xl text-black"
            style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)' }}>
            {company?.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
        <h1 className="text-lg font-black text-white">{company?.name}</h1>
        {company?.address && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{company.address}</p>}
        <p className="text-[11px] mt-1" style={{ color: '#C9A861' }}>Agendamento online</p>
      </div>

      {/* Step bar */}
      <div className="px-4 py-4">
        <StepBar current={step} />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* STEP 0 — Serviço */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-2.5">
              <h2 className="text-white font-bold mb-3">Escolha o serviço</h2>
              {services.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum serviço disponível.</p>
              )}
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); goNext(); }}
                  className="w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between"
                  style={selectedService?.id === s.id
                    ? { background: 'rgba(201,168,97,0.15)', border: '1.5px solid rgba(201,168,97,0.5)' }
                    : { background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,97,0.12)' }}>
                      <Sparkles className="w-4 h-4" style={{ color: '#C9A861' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{s.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.duration_minutes} min</p>
                    </div>
                  </div>
                  {s.price > 0 && (
                    <span className="text-sm font-bold" style={{ color: '#C9A861' }}>
                      R$ {s.price.toFixed(2).replace('.',',')}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          )}

          {/* STEP 1 — Profissional */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-2.5">
              <h2 className="text-white font-bold mb-3">Escolha o profissional</h2>
              {/* Qualquer */}
              <button
                onClick={() => { setSelectedProf(null); goNext(); }}
                className="w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3"
                style={selectedProf === null
                  ? { background: 'rgba(201,168,97,0.15)', border: '1.5px solid rgba(201,168,97,0.5)' }
                  : { background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <User className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <span className="text-sm font-bold text-white">Qualquer profissional</span>
              </button>
              {professionals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProf(p); goNext(); }}
                  className="w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3"
                  style={selectedProf?.id === p.id
                    ? { background: 'rgba(201,168,97,0.15)', border: '1.5px solid rgba(201,168,97,0.5)' }
                    : { background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display='none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)' }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    {p.specialties?.length > 0 && (
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {p.specialties.slice(0, 2).join(' · ')}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* STEP 2 — Data */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-3">
              <h2 className="text-white font-bold">Escolha a data</h2>
              <Calendar2 selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedTime(''); goNext(); }} />
            </motion.div>
          )}

          {/* STEP 3 — Horário */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-3">
              <h2 className="text-white font-bold">Escolha o horário</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatDate(selectedDate)}</p>

              {loadingSlots ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A861' }} />
                </div>
              ) : slots.length === 0 ? (
                <div className="py-10 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Sem horários disponíveis nesta data.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedTime(s); goNext(); }}
                      className="py-3 rounded-2xl text-sm font-bold transition-all"
                      style={selectedTime === s
                        ? { background: 'linear-gradient(135deg,#C9A861,#E5D4A8)', color: '#000' }
                        : { background: '#0E0E0E', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4 — Dados pessoais */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-4">
              <h2 className="text-white font-bold">Seus dados</h2>

              {/* Nome */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Nome completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium text-white focus:outline-none"
                    style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.10)' }}
                  />
                </div>
              </div>

              {/* Telefone com máscara */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Celular *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => {
                      const masked = formatBrazilianCellphone(e.target.value);
                      setForm((f) => ({ ...f, phone: masked }));
                      setPhoneError('');
                    }}
                    onBlur={() => {
                      if (form.phone && !validateBrazilianCellphone(form.phone)) {
                        setPhoneError('Celular inválido. Ex: (11) 98765-4321');
                      }
                    }}
                    placeholder="(00) 90000-0000"
                    maxLength={16}
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium text-white focus:outline-none"
                    style={{ background: '#1C1C1E', border: `1px solid ${phoneError ? 'rgba(248,113,113,0.55)' : 'rgba(255,255,255,0.10)'}` }}
                  />
                </div>
                {phoneError && <p className="text-xs mt-1 px-1" style={{ color: '#f87171' }}>{phoneError}</p>}
              </div>

              {/* Observação */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Observação
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Ex: alergia a produto..."
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium text-white focus:outline-none"
                    style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.10)' }}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                onClick={() => {
                  if (!form.name.trim()) { setError('Nome é obrigatório.'); return; }
                  if (!validateBrazilianCellphone(form.phone)) {
                    setPhoneError('Celular inválido. Ex: (11) 98765-4321');
                    return;
                  }
                  setError('');
                  goNext();
                }}
                className="w-full py-4 rounded-2xl font-black text-black text-base"
                style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)' }}
              >
                Continuar
              </button>
            </motion.div>
          )}

          {/* STEP 5 — Confirmação */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="space-y-4">
              <h2 className="text-white font-bold">Confirme seu agendamento</h2>

              <div className="rounded-2xl overflow-hidden" style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  ['Serviço',       selectedService?.name],
                  ['Profissional',  selectedProf?.name ?? 'Qualquer disponível'],
                  ['Data',          formatDate(selectedDate)],
                  ['Horário',       selectedTime],
                  ['Nome',          form.name],
                  ['Telefone',      form.phone],
                  ...(form.notes ? [['Observação', form.notes]] : []),
                ].map(([label, value], i, arr) => (
                  <div key={label} className="flex gap-3 px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <span className="text-xs w-24 flex-shrink-0 font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                    <span className="text-sm text-white">{value}</span>
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full py-4 rounded-2xl font-black text-black text-base disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#C9A861,#E5D4A8)', boxShadow: '0 4px 20px rgba(201,168,97,0.3)' }}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar agendamento'}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Botão voltar fixo */}
      {step > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3" style={{ background: 'linear-gradient(to top, #080808 70%, transparent)' }}>
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      )}
    </div>
  );
}
