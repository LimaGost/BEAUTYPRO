import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Scissors, Lock, DollarSign, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusColors = {
  scheduled: 'bg-amber-100 border-l-amber-500',
  confirmed: 'bg-green-100 border-l-green-500',
  completed: 'bg-gray-100 border-l-gray-500',
  cancelled: 'bg-red-100 border-l-red-400 opacity-60',
  no_show: 'bg-red-100 border-l-red-500 opacity-70',
};

const typeColors = {
  appointment: 'bg-amber-50 border-l-amber-500',
  block_professional: 'bg-gray-200 border-l-gray-600',
  block_personal: 'bg-purple-100 border-l-purple-500',
  fit_in: 'bg-blue-100 border-l-blue-500',
};

export default function TimeSlot({ appointment, onClick, onCheckout, professionalColor }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isBlock = appointment.type?.includes('block');
  const canCheckout = !isBlock && appointment.status !== 'completed' && appointment.status !== 'cancelled';
  
  const getBorderColor = () => {
    if (professionalColor) {
      return professionalColor;
    }
    return isBlock 
      ? (appointment.type === 'block_professional' ? '#4b5563' : '#a855f7')
      : '#f59e0b';
  };
  
  const getBackgroundColor = () => {
    if (isBlock) {
      return appointment.type === 'block_professional' ? 'bg-gray-200' : 'bg-purple-100';
    }
    if (appointment.status === 'completed') return 'bg-gray-100';
    if (appointment.status === 'cancelled') return 'bg-red-100 opacity-60';
    return 'bg-white';
  };

  const handleClick = (e) => {
    if (!menuOpen) {
      onClick(appointment);
    }
  };

  const handleCheckout = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onCheckout(appointment);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`rounded-lg border-l-4 p-3 cursor-pointer shadow-sm hover:shadow-md transition-all ${getBackgroundColor()} relative`}
      style={{ borderLeftColor: getBorderColor() }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-600">
              {appointment.start_time} - {appointment.end_time}
            </span>
            {appointment.type === 'fit_in' && (
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                Encaixe
              </span>
            )}
          </div>

          {isBlock ? (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {appointment.type === 'block_professional' ? 'Bloqueio Profissional' : 'Bloqueio Pessoal'}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {appointment.client_name || 'Cliente'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">
                  {appointment.services?.map(s => s.name).join(', ') || 'Serviço'}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isBlock && appointment.total_amount > 0 && (
            <span className="text-sm font-bold gold-text">
              R$ {parseFloat(appointment.total_amount||0).toFixed(2)}
            </span>
          )}
          
          {canCheckout && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1 hover:bg-white/50 rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCheckout} className="gap-2">
                  <DollarSign className="w-4 h-4" />
                  Finalizar Atendimento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {appointment.notes && (
        <p className="text-xs text-gray-500 mt-2 truncate">
          {appointment.notes}
        </p>
      )}
    </motion.div>
  );
}