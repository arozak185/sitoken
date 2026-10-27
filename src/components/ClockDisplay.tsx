import React, { useState, useEffect } from 'react';
import { formatIndonesianDate, formatTimeParts } from '../utils/timeFormat';
import { Calendar, Clock as ClockIcon } from 'lucide-react';

interface ClockDisplayProps {
  minimal?: boolean;
}

export const ClockDisplay: React.FC<ClockDisplayProps> = ({ minimal = false }) => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = formatTimeParts(date);
  const formattedDate = formatIndonesianDate(date);

  if (minimal) {
    return (
      <div className="flex items-center gap-3 bg-white/90 border border-slate-200/80 rounded-xl px-4 py-2 shadow-xs">
        <ClockIcon className="w-4 h-4 text-emerald-700" />
        <span className="font-mono-token text-lg font-bold tracking-wider text-slate-800">
          {hours}:{minutes}:{seconds}
        </span>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
          WIB
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm text-center">
      {/* Date Bar */}
      <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-500 mb-1">
        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
        <span>{formattedDate}</span>
      </div>

      {/* Real-time Clock Numbers */}
      <div className="flex items-baseline gap-1 md:gap-1.5 font-mono-token font-bold text-slate-900 tracking-tight">
        <span className="text-3xl md:text-4xl lg:text-5xl tabular-nums drop-shadow-2xs">
          {hours}
        </span>
        <span className="text-2xl md:text-3xl lg:text-4xl text-emerald-600 animate-pulse font-normal">
          :
        </span>
        <span className="text-3xl md:text-4xl lg:text-5xl tabular-nums drop-shadow-2xs">
          {minutes}
        </span>
        <span className="text-2xl md:text-3xl lg:text-4xl text-emerald-600 animate-pulse font-normal">
          :
        </span>
        <span className="text-2xl md:text-3xl lg:text-4xl text-slate-500 tabular-nums">
          {seconds}
        </span>
        <span className="ml-1.5 text-xs md:text-sm font-semibold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 self-center">
          WIB
        </span>
      </div>

      <div className="text-[11px] text-slate-400 font-medium mt-1">
        Waktu Server Ruang Ujian (Presisi Detik)
      </div>
    </div>
  );
};
