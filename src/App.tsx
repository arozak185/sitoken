/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ExamProvider, useExam } from './context/ExamContext';
import { Header } from './components/Header';
import { ClockDisplay } from './components/ClockDisplay';
import { TokenCard } from './components/TokenCard';
import { ExamMetaBar } from './components/ExamMetaBar';
import { ExamNotice } from './components/ExamNotice';
import { AdminModal } from './components/AdminModal';
import { CbtQrModal } from './components/CbtQrModal';
import { Eye, Shield, Sparkles } from 'lucide-react';

function ExamAppContent() {
  const { state, updateSettings } = useExam();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);

  // Keyboard shortcuts (Escape closes modals, A opens admin, Q opens QR)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'a' || e.key === 'A') {
        setIsAdminOpen(true);
      } else if (e.key === 'q' || e.key === 'Q') {
        setIsQrOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isHighContrast = state.settings.highContrast;
  const isFocusMode = state.settings.focusMode;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isHighContrast
          ? 'bg-white text-black'
          : 'bg-[#fafbfc] text-slate-900'
      }`}
    >
      {/* Official Header */}
      <Header
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenQr={() => setIsQrOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Main Focus Stage (Dominant White, Clean, Distraction-Free) */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
        {/* Real-time Digital Clock Header Section */}
        <div className="w-full max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-flex items-center gap-1.5 mb-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>{state.examInfo.examName}</span>
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 font-display">
              {state.examInfo.subject}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {state.examInfo.gradeAndMajor} • {state.examInfo.roomName}
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <ClockDisplay />
          </div>
        </div>

        {/* Centerpiece Giant Exam Token Card */}
        <TokenCard />

        {/* Focus Mode Exit Reminder (shown only if focus mode is active) */}
        {isFocusMode ? (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => updateSettings({ focusMode: false })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mode Fokus Aktif (Klik untuk menampilkan detail lengkap)</span>
            </button>
          </div>
        ) : (
          <>
            {/* Exam Meta Information Bar */}
            <ExamMetaBar />

            {/* Exam Rules & Proctor Announcement */}
            <ExamNotice />
          </>
        )}
      </main>

      {/* Subtle, Calm Footer */}
      <footer className="w-full py-4 border-t border-slate-200/80 bg-white/70 text-center text-xs text-slate-400 select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © SMK As-Syafi'iyah • Sistem Informasi Token Ujian Berbasis Komputer (CBT)
          </span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600">A</kbd> untuk Panel Pengawas</span>
            <span>•</span>
            <span>Jaga Integritas & Semangat Belajar</span>
          </div>
        </div>
      </footer>

      {/* Admin / Proctor Modal */}
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

      {/* CBT Portal QR Code Modal */}
      <CbtQrModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ExamProvider>
      <ExamAppContent />
    </ExamProvider>
  );
}
