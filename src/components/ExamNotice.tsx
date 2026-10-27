import React, { useState } from 'react';
import { useExam } from '../context/ExamContext';
import { Info, ChevronDown, ChevronUp, Bell } from 'lucide-react';

export const ExamNotice: React.FC = () => {
  const { state } = useExam();
  const [showRules, setShowRules] = useState(false);
  const announcement = state.examInfo.announcement;

  return (
    <div className="w-full max-w-5xl mx-auto mt-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        {/* Main notice line */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
              <Bell className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Catatan Pengawas
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-700">
                {announcement || 'Jaga ketertiban dan kejujuran selama ujian berlangsung.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3 py-1.5 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Tata Tertib Ujian</span>
            {showRules ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Expandable Rules */}
        {showRules && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <span>
                Masukkan kode token persis seperti yang tertulis (huruf kapital).
              </span>
            </div>
            <div className="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <span>
                Dilarang membuka tab baru, mencari contekan, atau bertukar jawaban.
              </span>
            </div>
            <div className="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <span>
                Jika ada kendala koneksi atau perangkat mati, segera lapor pengawas ruang.
              </span>
            </div>
            <div className="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                4
              </span>
              <span>
                Pastikan menekan tombol <strong>Kirim / Selesai</strong> sebelum waktu ujian berakhir.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
