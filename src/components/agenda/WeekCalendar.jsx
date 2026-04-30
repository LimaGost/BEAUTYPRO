import React from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WeekCalendar({ selectedDate, onDateSelect, onWeekChange }) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPrevWeek = () => {
    onWeekChange(addDays(selectedDate, -7));
  };

  const goToNextWeek = () => {
    onWeekChange(addDays(selectedDate, 7));
  };

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Month Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={goToPrevWeek}
          className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900 capitalize">
          {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button
          onClick={goToNextWeek}
          className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 px-1 pb-2">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const dayIsToday = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className="flex flex-col items-center py-1 rounded-xl transition-all active:scale-95"
            >
              <span className={`text-[10px] font-semibold mb-1 ${
                isSelected ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {format(day, 'EEE', { locale: ptBR }).substring(0, 3).toUpperCase()}
              </span>
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isSelected
                    ? 'gold-gradient text-black'
                    : dayIsToday
                      ? 'bg-black text-white'
                      : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </motion.div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Display */}
      <div className="px-4 pb-2">
        <p className="text-xs font-medium text-gray-500 capitalize">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}