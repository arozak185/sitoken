import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { useExam } from '../context/ExamContext';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Lock,
  QrCode,
  Eye,
  EyeOff,
  Sun,
  Contrast,
  Cloud,
  CloudOff,
  Radio,
} from 'lucide-react';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenQr: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdmin,
  onOpenQr,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { state, updateSettings, cloudStatus } = useExam();
  const { settings, examInfo } = state;

  return (
    <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-4">
        {/* School Branding with Academic Icon */}
        <div className="flex items-center gap-3 sm:gap-4">
          <SchoolLogo size={46} iconType={settings.iconType || 'graduation'} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight font-display leading-tight">
                SMK AS-SYAFI'IYAH
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                TKA 2026
              </span>
              {/* Cloud Sync Status Badge */}
              <div
                className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                  cloudStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                    : cloudStatus === 'connecting'
                    ? 'bg-amber-50 text-amber-800 border-amber-200/80 animate-pulse'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title={
                  cloudStatus === 'connected'
                    ? 'Terhubung ke Firebase: Token otomatis tersinkron ke semua ruangan secara realtime'
                    : 'Menghubungkan ke server cloud Firebase...'
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cloudStatus === 'connected'
                      ? 'bg-emerald-500 animate-ping'
                      : cloudStatus === 'connecting'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span>
                  {cloudStatus === 'connected'
                    ? 'Live Multi-Ruangan'
                    : cloudStatus === 'connecting'
                    ? 'Menghubungkan...'
                    : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-tight">
              Sistem Informasi Token — Tes Kemampuan Akademik (TKA)
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* QR Code Portal Button */}
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            title="Tampilkan QR Code Portal CBT"
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">QR CBT</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              settings.soundEnabled
                ? 'text-emerald-700 hover:bg-emerald-50'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={settings.soundEnabled ? 'Suara Chime Aktif' : 'Suara Chime Senyap'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => updateSettings({ focusMode: !settings.focusMode })}
            className={`p-2 rounded-xl transition-colors cursor-pointer hidden sm:flex ${
              settings.focusMode
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title={settings.focusMode ? 'Matikan Mode Fokus' : 'Aktifkan Mode Fokus (Sembunyikan Informasi Tambahan)'}
          >
            {settings.focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* High Contrast Toggle */}
          <button
            onClick={() => updateSettings({ highContrast: !settings.highContrast })}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              settings.highContrast
                ? 'bg-black text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Mode Kontras Tinggi (Proyektor Lampu Redup)"
          >
            <Contrast className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh (F11 / Mode Proyektor)'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer ml-1"
            title="Masuk ke Panel Pengawas / Admin"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin / Pengawas</span>
          </button>
        </div>
      </div>
    </header>
  );
};
