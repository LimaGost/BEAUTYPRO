import React, { useState } from 'react';
import { User, Scissors, Lock, DollarSign, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DraggableTimeSlot({ appointment, onClick, onCheckout, professionalColor, height }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isBlock = appointment.type?.includes('block');
  const canCheckout = !isBlock && appointment.status !== 'completed' && appointment.status !== 'cancelled';

  const getBorderColor = () => {
    if (professionalColor) return professionalColor;
    return isBlock
      ? (appointment.type === 'block_professional' ? '#4b5563' : '#a855f7')
      : '#f59e0b';
  };

  const getBackgroundColor = () => {
    if (isBlock) return appointment.type === 'block_professional' ? 'bg-gray-200' : 'bg-purple-100';
    if (appointment.status === 'completed') return 'bg-gray-100';
    if (appointment.status === 'cancelled') return 'bg-red-100 opacity-60';
    return 'bg-white';
  };

  const handleClick = () => {
    if (!menuOpen) onClick(appointment);
  };

  const handleCheckout = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onCheckout(appointment);
  };

  const isShort = height && height < 60;

  return (
    <div
      onClick={handleClick}
      className={`w-full rounded-lg border-l-[3px] px-2 py-1.5 shadow-sm active:shadow-md transition-all cursor-pointer overflow-hidden ${getBackgroundColor()}`}
      style={{
        borderLeftColor: getBorderColor(),
        height: height ? `${height - 3}px` : 'auto',
      }}
    >
      <div className="flex items-start justify-between gap-1 h-full">
        <div className="flex-1 min-w-0">
          {isShort ? (
            /* Compact view for short slots */
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                {appointment.start_time}
              </span>
              <span className="text-xs font-medium text-gray-800 truncate">
                {isBlock ? (appointment.type === 'block_professional' ? 'Bloqueio' : 'Bloqueio Pessoal') : (appointment.client_name || 'Cliente')}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                  {appointment.start_time} – {appointment.end_time}
                </span>
                {appointment.type === 'fit_in' && (
                  <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                    Encaixe
                  </span>
                )}
              </div>

              {isBlock ? (
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {appointment.type === 'block_professional' ? 'Bloqueio Profissional' : 'Bloqueio Pessoal'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      {appointment.client_name || 'Cliente'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Scissors className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-[10px] text-gray-500 truncate">
                      {appointment.services?.map(s => s.name).join(', ') || 'Serviço'}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-start gap-1 flex-shrink-0">
          {!isBlock && appointment.total_amount > 0 && !isShort && (
            <span className="text-xs font-bold gold-text whitespace-nowrap">
              R$ {parseFloat(appointment.total_amount||0).toFixed(2)}
            </span>
          )}

          {canCheckout && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-0.5 hover:bg-black/10 rounded transition-colors">
                  <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCheckout} className="gap-2 text-green-600">
                  <DollarSign className="w-4 h-4" />
                  Efetivar Pagamento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}