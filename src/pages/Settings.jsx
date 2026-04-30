import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Check, Building2, Clock } from 'lucide-react';

const DAYS = [
  { day_of_week: 0, label: 'Domingo'  },
  { day_of_week: 1, label: 'Segunda'  },
  { day_of_week: 2, label: 'Terça'    },
  { day_of_week: 3, label: 'Quarta'   },
  { day_of_week: 4, label: 'Quinta'   },
  { day_of_week: 5, label: 'Sexta'    },
  { day_of_week: 6, label: 'Sábado'  },
];

const defaultHours = DAYS.map(({ day_of_week }) => ({
  day_of_week,
  is_open:    day_of_week >= 1 && day_of_week <= 6,
  open_time:  '09:00',
  close_time: day_of_week === 6 ? '13:00' : '18:00',
}));

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inp = 'w-full px-3.5 py-3 rounded-xl text-sm text-gray-800 font-medium bg-white border border-gray-200 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 transition-all';

export default function Settings() {
  const { company, updateCompany } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [cnpj,        setCnpj]        = useState('');
  const [phone,       setPhone]       = useState('');
  const [email,       setEmail]       = useState('');
  const [address,     setAddress]     = useState('');
  const [city,        setCity]        = useState('');
  const [hours,       setHours]       = useState(defaultHours);
  const [loading,     setLoading]     = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!company) return;
    setCompanyName(company.name  || '');
    setCnpj(company.cnpj         || '');
    setPhone(company.phone        || '');
    setEmail(company.email        || '');
    setAddress(company.address    || '');
    setCity(company.city          || '');

    if (company.business_hours?.length) {
      setHours(
        DAYS.map(({ day_of_week }) => {
          const existing = company.business_hours.find((h) => h.day_of_week === day_of_week);
          return existing || { day_of_week, is_open: false, open_time: '09:00', close_time: '18:00' };
        })
      );
    }
  }, [company]);

  function toggleDay(idx) {
    setHours((prev) => prev.map((h, i) => i === idx ? { ...h, is_open: !h.is_open } : h));
  }

  function setTime(idx, field, val) {
    setHours((prev) => prev.map((h, i) => i === idx ? { ...h, [field]: val } : h));
  }

  async function handleSave() {
    if (!companyName.trim()) return setError('Informe o nome da empresa.');
    setLoading(true);
    setSaved(false);
    setError('');
    try {
      await updateCompany({
        name:           companyName.trim(),
        cnpj:           cnpj.trim(),
        phone:          phone.replace(/\D/g, ''),
        email:          email.trim(),
        address:        address.trim(),
        city:           city.trim(),
        business_hours: hours,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      try   { setError(JSON.parse(err.message).error || err.message); }
      catch { setError(err.message || 'Erro ao salvar. Tente novamente.'); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-bg min-h-screen pb-32">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* ── Dados da empresa ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4" style={{ color: '#C9A861' }} />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Dados da empresa</h2>
          </div>

          <Field label="Nome da empresa">
            <input className={inp} value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CNPJ">
              <input className={inp} value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00" inputMode="numeric" />
            </Field>
            <Field label="Telefone">
              <input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000" inputMode="numeric" />
            </Field>
          </div>

          <Field label="E-mail">
            <input className={inp} value={email} type="email" onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@empresa.com" />
          </Field>

          <Field label="Endereço">
            <input className={inp} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro" />
          </Field>

          <Field label="Cidade">
            <input className={inp} value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Sua cidade" />
          </Field>
        </motion.div>

        {/* ── Horários de funcionamento ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="card-surface overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <Clock className="w-4 h-4" style={{ color: '#C9A861' }} />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Horário de funcionamento</h2>
          </div>

          {hours.map((h, idx) => (
            <div
              key={h.day_of_week}
              className="flex items-center gap-3 px-5 py-3 border-t border-gray-100"
            >
              {/* Toggle */}
              <button type="button" onClick={() => toggleDay(idx)}
                className="flex items-center gap-2.5 flex-shrink-0">
                <div
                  className="w-10 h-5.5 rounded-full transition-all relative"
                  style={{
                    height: '22px', width: '40px',
                    background: h.is_open ? '#C9A861' : '#E5E7EB',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all"
                    style={{ left: h.is_open ? '20px' : '2px' }}
                  />
                </div>
                <span className="text-sm font-semibold w-16 text-left"
                  style={{ color: h.is_open ? '#1a1a1a' : '#9CA3AF' }}>
                  {DAYS[idx].label}
                </span>
              </button>

              {h.is_open ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={h.open_time}
                    onChange={(e) => setTime(idx, 'open_time', e.target.value)}
                    className="flex-1 text-xs text-gray-700 text-center rounded-lg py-1.5 px-2 border border-gray-200 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-gray-400">às</span>
                  <input
                    type="time"
                    value={h.close_time}
                    onChange={(e) => setTime(idx, 'close_time', e.target.value)}
                    className="flex-1 text-xs text-gray-700 text-center rounded-lg py-1.5 px-2 border border-gray-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              ) : (
                <span className="text-xs text-gray-400 flex-1">Fechado</span>
              )}
            </div>
          ))}
          <div className="h-5" />
        </motion.div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center font-medium"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-base text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{
            background: saved ? 'linear-gradient(135deg,#4ade80,#22c55e)' : 'linear-gradient(135deg,#C9A861,#E5D4A8)',
            boxShadow: '0 4px 20px rgba(201,168,97,0.25)',
          }}
        >
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : saved
            ? <><Check className="w-5 h-5" /> Salvo!</>
            : 'Salvar alterações'
          }
        </button>
      </div>
    </div>
  );
}
