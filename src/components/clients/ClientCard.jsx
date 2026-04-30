import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Gift, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientCard({ client, onClick }) {
  const initials = `${client.first_name?.charAt(0) || ''}${client.last_name?.charAt(0) || ''}`.toUpperCase();

  const today = new Date();
  const birthdayDate = client.birthdate ? new Date(client.birthdate + 'T00:00:00') : null;
  const isBirthdayToday  = birthdayDate &&
    birthdayDate.getDate()  === today.getDate() &&
    birthdayDate.getMonth() === today.getMonth();
  const isBirthdayMonth  = birthdayDate &&
    !isBirthdayToday &&
    birthdayDate.getMonth() === today.getMonth();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(client)}
      className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-all ${
        isBirthdayToday ? 'border-amber-400 ring-1 ring-amber-300' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 flex-shrink-0">
          <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-black font-bold text-lg">{initials}</span>
          </div>
          {isBirthdayToday && (
            <span className="absolute -top-1 -right-1 text-base">🎂</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {client.first_name} {client.last_name}
            </h3>
            {isBirthdayMonth && !isBirthdayToday && (
              <span className="text-sm" title="Aniversário este mês">🎁</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Phone className="w-4 h-4" />
            <span>{client.phone}</span>
          </div>

          {birthdayDate && (
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <Gift className="w-3 h-3" />
              <span>{format(birthdayDate, 'dd/MM', { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <div className="text-right">
          {client.total_spent > 0 && (
            <div className="mb-1">
              <p className="text-sm font-bold gold-text">
                R$ {(client.total_spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">
                {client.visit_count || 0} visitas
              </p>
            </div>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </motion.div>
  );
}