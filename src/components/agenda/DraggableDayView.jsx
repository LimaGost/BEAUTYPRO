import React from 'react';
import DraggableTimeSlot from './DraggableTimeSlot';

const SLOT_HEIGHT = 48; // px per 30-minute slot

const timeSlots = [];
for (let hour = 7; hour <= 21; hour++) {
  timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
}

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const DAY_START_MINUTES = timeToMinutes('07:00');

export default function DraggableDayView({ appointments, professionals, onAppointmentClick, onCheckout }) {
  const getAppointmentStyle = (apt) => {
    const startMinutes = timeToMinutes(apt.start_time);
    const endMinutes = timeToMinutes(apt.end_time);
    const duration = endMinutes - startMinutes;
    const topOffset = ((startMinutes - DAY_START_MINUTES) / 30) * SLOT_HEIGHT;
    const height = (duration / 30) * SLOT_HEIGHT;
    return { top: topOffset, height };
  };

  const totalHeight = timeSlots.length * SLOT_HEIGHT;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50">
      <div className="relative flex pt-2 pb-8" style={{ height: totalHeight + 40 }}>

        {/* Time Labels */}
        <div className="w-12 flex-shrink-0 relative">
          {timeSlots.map((time, i) => (
            <div
              key={time}
              className="absolute right-0 pr-2 flex items-start justify-end"
              style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
            >
              {time.endsWith(':00') && (
                <span className="text-[10px] font-medium text-gray-400 mt-1 leading-none">{time}</span>
              )}
            </div>
          ))}
        </div>

        {/* Grid + Appointments */}
        <div className="flex-1 relative pr-3">
          {/* Grid Lines */}
          {timeSlots.map((time, i) => (
            <div
              key={time}
              className={`absolute left-0 right-3 border-b ${time.endsWith(':00') ? 'border-gray-200' : 'border-gray-100 border-dashed'}`}
              style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
            />
          ))}

          {/* Appointments */}
          {appointments.map((apt) => {
            const { top, height } = getAppointmentStyle(apt);
            const professional = professionals.find(p => p.id === apt.professional_id);
            return (
              <div
                key={apt.id}
                className="absolute left-0 right-3"
                style={{ top, height, zIndex: 10 }}
              >
                <DraggableTimeSlot
                  appointment={apt}
                  onClick={onAppointmentClick}
                  onCheckout={onCheckout}
                  professionalColor={professional?.color}
                  height={height}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}