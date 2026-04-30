import { useState, useEffect } from 'react';
import { businessHoursApi } from '@/services/businessHoursApi';
import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';

const DAYS = [
  { d: 0, label: 'Domingo'       },
  { d: 1, label: 'Segunda-feira' },
  { d: 2, label: 'Terça-feira'   },
  { d: 3, label: 'Quarta-feira'  },
  { d: 4, label: 'Quinta-feira'  },
  { d: 5, label: 'Sexta-feira'   },
  { d: 6, label: 'Sábado'        },
];

const DEFAULT = DAYS.map(({ d }) => ({
  day_of_week: d,
  is_open:     d >= 1 && d <= 5,
  open_time:   '09:00',
  close_time:  '18:00',
  has_break:   false,
  break_start: '12:00',
  break_end:   '13:00',
}));

function TimeInput({ value, onChange, disabled }) {
  return (
    <input
      type="time"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="text-sm font-medium text-white rounded-xl px-3 py-2 focus:outline-none transition-all disabled:opacity-30"
      style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.10)' }}
    />
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 focus:outline-none"
    >
      <div
        className="w-10 h-6 rounded-full transition-all relative flex-shrink-0"
        style={{ background: checked ? '#C9A861' : 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow"
          style={{ left: checked ? '22px' : '4px' }}
        />
      </div>
      {label && <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>}
    </button>
  );
}

export default function BusinessHours() {
  const [hours,   setHours]   = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    businessHoursApi.get()
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        // Merge com default para garantir todos os 7 dias
        setHours(DEFAULT.map((def) => {
          const found = rows.find((r) => r.day_of_week === def.d || r.day_of_week === def.day_of_week);
          return found ? { ...def, ...found } : def;
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(index, field, value) {
    setHours((prev) => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await businessHoursApi.save(hours);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A861' }} />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-28 max-w-lg mx-auto space-y-3">

      {hours.map((h, i) => {
        const { label } = DAYS[i];
        return (
          <motion.div
            key={h.day_of_week}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Cabeçalho do dia */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-bold text-white">{label}</span>
              <Toggle
                checked={h.is_open}
                onChange={(v) => update(i, 'is_open', v)}
                label={h.is_open ? 'Aberto' : 'Fechado'}
              />
            </div>

            {h.is_open && (
              <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

                {/* Horário de funcionamento */}
                <div className="flex items-center gap-3 pt-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Abre</p>
                    <TimeInput value={h.open_time}  onChange={(v) => update(i, 'open_time',  v)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Fecha</p>
                    <TimeInput value={h.close_time} onChange={(v) => update(i, 'close_time', v)} />
                  </div>
                </div>

                {/* Intervalo */}
                <div>
                  <Toggle
                    checked={h.has_break}
                    onChange={(v) => update(i, 'has_break', v)}
                    label="Intervalo / almoço"
                  />
                </div>

                {h.has_break && (
                  <div className="flex items-center gap-3 pl-12">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Início</p>
                      <TimeInput value={h.break_start} onChange={(v) => update(i, 'break_start', v)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Fim</p>
                      <TimeInput value={h.break_end}   onChange={(v) => update(i, 'break_end',   v)} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      {error && <p className="text-sm text-red-400 px-1">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl font-black text-black text-base transition-opacity disabled:opacity-60 mt-2"
        style={{ background: 'linear-gradient(135deg, #C9A861 0%, #E5D4A8 100%)', boxShadow: '0 4px 20px rgba(201,168,97,0.25)' }}
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          : saved ? <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Salvo!</span>
          : 'Salvar horários'}
      </button>
    </div>
  );
}
