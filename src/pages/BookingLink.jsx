import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Link2, Copy, ExternalLink, Check, QrCode } from 'lucide-react';

export default function BookingLink() {
  const { company } = useAuth();
  const [copied, setCopied] = useState(false);

  const slug      = company?.slug || '';
  const publicUrl = slug ? `${window.location.origin}/agendar/${slug}` : '';

  function copy() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (!slug) {
    return (
      <div className="px-4 py-20 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(201,168,97,0.10)', border: '1px solid rgba(201,168,97,0.20)' }}>
          <Link2 className="w-7 h-7" style={{ color: '#C9A861' }} />
        </div>
        <div>
          <p className="text-white font-bold">Empresa não configurada</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Configure sua empresa para gerar o link de agendamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-28 max-w-lg mx-auto space-y-5">

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl text-center space-y-4"
        style={{ background: 'linear-gradient(135deg, rgba(201,168,97,0.12) 0%, rgba(229,212,168,0.06) 100%)', border: '1px solid rgba(201,168,97,0.25)' }}
      >
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'rgba(201,168,97,0.15)' }}>
          <QrCode className="w-6 h-6" style={{ color: '#C9A861' }} />
        </div>
        <div>
          <h2 className="text-white font-black text-lg">{company.name}</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Compartilhe este link para seus clientes agendarem online
          </p>
        </div>
      </motion.div>

      {/* Link box */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl space-y-3"
        style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Seu link público
        </p>

        <div
          className="px-4 py-3 rounded-xl text-sm font-medium break-all"
          style={{ background: '#1C1C1E', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {publicUrl}
        </div>

        <div className="flex gap-2">
          <button
            onClick={copy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
            style={copied
              ? { background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }
              : { background: 'rgba(201,168,97,0.12)', color: '#C9A861', border: '1px solid rgba(201,168,97,0.25)' }
            }
          >
            {copied ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar link</>}
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <ExternalLink className="w-4 h-4" /> Abrir link
          </a>
        </div>
      </motion.div>

      {/* Dica */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          💡 Compartilhe este link no WhatsApp, Instagram ou adicione ao seu perfil. Seus clientes podem agendar 24h por dia sem precisar ligar.
        </p>
      </motion.div>
    </div>
  );
}
