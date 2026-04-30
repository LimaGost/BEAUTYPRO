// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Gift, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GOLD = '#C9A861';

export default function ClientCard({ client, onClick }) {
  const initials = `${client.first_name?.charAt(0) || ''}${client.last_name?.charAt(0) || ''}`.toUpperCase();

  const today = new Date();
  const birthdayDate = client.birthdate ? new Date(client.birthdate + 'T00:00:00') : null;
  const isBirthdayToday = birthdayDate &&
    birthdayDate.getDate()  === today.getDate() &&
    birthdayDate.getMonth() === today.getMonth();
  const isBirthdayMonth = birthdayDate && !isBirthdayToday &&
    birthdayDate.getMonth() === today.getMonth();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(client)}
      className="rounded-2xl p-4 cursor-pointer transition-all active:opacity-80"
      style={{
        background: '#0E0E0E',
        border: isBirthdayToday
          ? '1px solid rgba(201,168,97,0.5)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isBirthdayToday ? '0 0 12px rgba(201,168,97,0.08)' : 'none',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-black font-bold text-base">{initials || '?'}</span>
          </div>
          {isBirthdayToday && (
            <span className="absolute -top-1 -right-1 text-sm">🎂</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate text-sm">
              {client.first_name} {client.last_name}
            </h3>
            {isBirthdayMonth && !isBirthdayToday && (
              <span className="text-sm flex-shrink-0" title="Aniversário este mês">🎁</span>
            )}
          </div>

          {client.phone && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {client.phone}
              </span>
            </div>
          )}

          {birthdayDate && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Gift className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {format(birthdayDate, 'dd/MM', { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        {/* Stats + chevron */}
        <div className="text-right flex-shrink-0">
          {client.total_spent > 0 && (
            <div className="mb-1">
              <p className="text-sm font-bold" style={{ color: GOLD }}>
                R$ {(client.total_spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {client.visit_count || 0} visitas
              </p>
            </div>
          )}
          <ChevronRight className="w-4 h-4 ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>
    </motion.div>
  );
}
