import React from 'react';
import TimeSlot from './TimeSlot';

const timeSlots = [];
for (let hour = 7; hour <= 21; hour++) {
  timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
}

export default function DayView({ appointments, onAppointmentClick, onCheckout }) {
  const getAppointmentForSlot = (slotTime) => {
    return appointments.filter(apt => {
      const startMinutes = timeToMinutes(apt.start_time);
      const endMinutes = timeToMinutes(apt.end_time);
      const slotMinutes = timeToMinutes(slotTime);
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
  };

  const isSlotStart = (slotTime, appointment) => {
    return appointment.start_time === slotTime;
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const renderedAppointments = new Set();

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50">
      <div className="relative">
        {timeSlots.map((time) => {
          const slotAppointments = getAppointmentForSlot(time);
          
          return (
            <div key={time} className="flex border-b border-gray-100">
              {/* Time Label */}
              <div className="w-16 flex-shrink-0 py-3 text-right pr-3">
                {time.endsWith(':00') && (
                  <span className="text-xs font-medium text-gray-400">
                    {time}
                  </span>
                )}
              </div>

              {/* Appointment Area */}
              <div className="flex-1 min-h-[60px] py-1 pr-4">
                {slotAppointments.map((apt) => {
                  if (renderedAppointments.has(apt.id)) return null;
                  if (!isSlotStart(time, apt)) return null;
                  
                  renderedAppointments.add(apt.id);
                  
                  return (
                    <TimeSlot 
                      key={apt.id} 
                      appointment={apt} 
                      onClick={onAppointmentClick}
                      onCheckout={onCheckout}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}