import React from 'react';
import { useExam } from '../context/ExamContext';
import { BookOpen, Users, MapPin, Clock, UserCheck } from 'lucide-react';

export const ExamMetaBar: React.FC = () => {
  const { state } = useExam();
  const { examInfo } = state;

  return (
    <div className="w-full max-w-5xl mx-auto mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Mata Pelajaran */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Mata Pelajaran
            </span>
            <h3 className="text-sm md:text-base font-bold text-slate-900 truncate" title={examInfo.subject}>
              {examInfo.subject || 'Belum diatur'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {examInfo.examName}
            </span>
          </div>
        </div>

        {/* Kelas & Tingkat */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Tingkat & Jurusan
            </span>
            <h3 className="text-sm md:text-base font-bold text-slate-900 truncate" title={examInfo.gradeAndMajor}>
              {examInfo.gradeAndMajor || 'Semua Kelas'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              SMK As-Syafi'iyah
            </span>
          </div>
        </div>

        {/* Ruang & Sesi */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Ruang & Sesi
            </span>
            <h3 className="text-sm md:text-base font-bold text-slate-900 truncate" title={examInfo.roomName}>
              {examInfo.roomName}
            </h3>
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {examInfo.sessionName}
            </span>
          </div>
        </div>

        {/* Pengawas Ruang */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Pengawas Ruang
            </span>
            <p className="text-xs md:text-sm font-bold text-slate-900 truncate" title={examInfo.proctor1}>
              1. {examInfo.proctor1 || '-'}
            </p>
            {examInfo.proctor2 && (
              <p className="text-xs font-medium text-slate-600 truncate mt-0.5" title={examInfo.proctor2}>
                2. {examInfo.proctor2}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
