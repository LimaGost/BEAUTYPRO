import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Clock, ChevronRight, Loader2, Check, ArrowLeft, Sparkles } from 'lucide-react';

const DAYS = [
  { d: 0, label: 'Domingo',   short: 'Dom' },
  { d: 1, label: 'Segunda',   short: 'Seg' },
  { d: 2, label: 'Terça',     short: 'Ter' },
  { d: 3, label: 'Quarta',    short: 'Qua' },
  { d: 4, label: 'Quinta',    short: 'Qui' },
  { d: 5, label: 'Sexta',     short: 'Sex' },
  { d: 6, label: 'Sábado',    short: 'Sáb' },
];

const defaultHours = DAYS.map(({ d }) => ({
  day_of_week: d,
  is_open:     d >= 1 && d <= 6,
  open_time:   '09:00',
  close_time:  d === 6 ? '13:00' : '18:00',
}));

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 transition-all"
      style={{ width: 44, height: 26 }}
    >
      <div
        className="absolute inset-0 rounded-full transition-all duration-200"
        style={{ background: checked ? '#C9A861' : 'rgba(255,255,255,0.12)' }}
      />
      <div
        className="absolute top-1 w-[18px] h-[18px] rounded-full bg-white shadow transition-all duration-200"
        style={{ left: checked ? 22 : 4 }}
      />
    </button>
  );
}

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function CompanySetup() {
  const { company, updateCompany, logout } = useAuth();

  const [step,    setStep]    = useState(0);
  const [dir,     setDir]     = useState(1);
  const [name,    setName]    = useState(company?.name || '');
  const [hours,   setHours]   = useState(defaultHours);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function goTo(next) {
    setDir(next > step ? 1 : -1);
    setStep(next);
    setError('');
  }

  function toggleDay(idx) {
    setHours((h) => h.map((d, i) => i === idx ? { ...d, is_open: !d.is_open } : d));
  }
  function setTime(idx, field, val) {
    setHours((h) => h.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  }

  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      await updateCompany({ name: name.trim(), business_hours: hours });
    } catch (err) {
      setError(err.message || 'Erro ao salvar. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080808' }}>

      {/* ── Topo ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-14 pb-6 flex flex-col items-center">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg,#C9A861,#E5D4A8)',
            boxShadow: '0 8px 32px rgba(201,168,97,0.30)',
          }}
        >
          <Sparkles className="w-7 h-7 text-black" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[11px] font-bold tracking-widest uppercase mb-1"
          style={{ color: '#C9A861' }}
        >
          Bem-vindo ao BeautyPro
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-black text-white text-center leading-tight"
        >
          {step === 0 ? 'Como se chama\nsua empresa?' : 'Quando você\natende?'}
        </motion.h1>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === step ? 24 : 8,
                height: 8,
                background: i <= step ? '#C9A861' : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Conteúdo animado ─────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={dir} mode="wait">

          {/* ── STEP 0: Nome da empresa ── */}
          {step === 0 && (
            <motion.div
              key="step0"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="absolute inset-0 px-6 pt-4 flex flex-col"
            >
              <div
                className="rounded-2xl p-4 mb-3"
                style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(255,255,255,0.30)' }}>
                  Nome do estabelecimento *
                </p>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && goTo(1)}
                  placeholder="Ex: Studio Elegância"
                  className="w-full bg-transparent text-white text-xl font-bold focus:outline-none placeholder:font-normal"
                  style={{ caretColor: '#C9A861' }}
                />
              </div>

              <p className="text-xs px-1 mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Este nome aparecerá para seus clientes no link de agendamento.
              </p>

              {error && (
                <p className="text-sm text-red-400 text-center mb-4">{error}</p>
              )}

              <button
                onClick={() => {
                  if (!name.trim()) { setError('Informe o nome da empresa.'); return; }
                  goTo(1);
                }}
                className="w-full py-4 rounded-2xl font-black text-base text-black flex items-center justify-center gap-2 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg,#C9A861,#E5D4A8)',
                  boxShadow: '0 4px 20px rgba(201,168,97,0.30)',
                  opacity: name.trim() ? 1 : 0.5,
                }}
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── STEP 1: Horários ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="absolute inset-0 px-6 pt-4 pb-6 flex flex-col overflow-y-auto"
            >
              <div
                className="rounded-2xl overflow-hidden mb-4"
                style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {hours.map((h, idx) => (
                  <div
                    key={h.day_of_week}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: idx < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    {/* Toggle + label */}
                    <Toggle checked={h.is_open} onChange={() => toggleDay(idx)} />
                    <span
                      className="text-sm font-semibold w-12 flex-shrink-0"
                      style={{ color: h.is_open ? '#fff' : 'rgba(255,255,255,0.25)' }}
                    >
                      {DAYS[idx].short}
                    </span>

                    {h.is_open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={h.open_time}
                          onChange={(e) => setTime(idx, 'open_time', e.target.value)}
                          className="flex-1 text-xs text-white text-center rounded-xl py-2 px-2 focus:outline-none"
                          style={{
                            background: '#1A1A1A',
                            border: '1px solid rgba(255,255,255,0.10)',
                            colorScheme: 'dark',
                          }}
                        />
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>–</span>
                        <input
                          type="time"
                          value={h.close_time}
                          onChange={(e) => setTime(idx, 'close_time', e.target.value)}
                          className="flex-1 text-xs text-white text-center rounded-xl py-2 px-2 focus:outline-none"
                          style={{
                            background: '#1A1A1A',
                            border: '1px solid rgba(255,255,255,0.10)',
                            colorScheme: 'dark',
                          }}
                        />
                      </div>
                    ) : (
                      <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
                        Fechado
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center mb-3">{error}</p>
              )}

              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-base text-black flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg,#C9A861,#E5D4A8)',
                  boxShadow: '0 4px 20px rgba(201,168,97,0.30)',
                }}
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><Check className="w-5 h-5" /> Concluir e entrar</>
                }
              </button>

              <button
                onClick={() => goTo(0)}
                className="w-full mt-3 py-2.5 text-sm flex items-center justify-center gap-1.5 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.30)' }}
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Rodapé ────────────────────────────────────────────────────── */}
      <div className="px-6 pb-10 text-center">
        <button
          onClick={logout}
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.18)' }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
