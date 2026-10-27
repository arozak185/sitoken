import React, { useState } from 'react';
import { useExam } from '../context/ExamContext';
import { formatRemainingTime, formatTimestampHM } from '../utils/timeFormat';
import { Check, Copy, ShieldCheck, AlertCircle, RefreshCw, KeyRound, Timer } from 'lucide-react';

export const TokenCard: React.FC = () => {
  const { state, isTokenExpired, remainingMs } = useExam();
  const [copied, setCopied] = useState(false);

  const tokenChars = state.currentToken ? state.currentToken.split('') : ['-'];

  const handleCopy = () => {
    if (!state.currentToken) return;
    navigator.clipboard.writeText(state.currentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate percentage of remaining time
  const totalDurationMs = state.settings.tokenDurationMinutes * 60 * 1000;
  const progressPercent =
    totalDurationMs > 0 && state.tokenExpiresAt
      ? Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100))
      : 100;

  // Sizing styles based on state.settings.displaySize
  const isJumbo = state.settings.displaySize === 'jumbo';
  const isLarge = state.settings.displaySize === 'large';

  const charBoxClass = isJumbo
    ? 'w-16 h-22 sm:w-22 sm:h-28 md:w-28 md:h-34 lg:w-32 lg:h-40 text-4xl sm:text-6xl md:text-7xl lg:text-8xl'
    : isLarge
    ? 'w-13 h-18 sm:w-18 sm:h-24 md:w-22 md:h-28 lg:w-26 lg:h-32 text-3xl sm:text-5xl md:text-6xl lg:text-7xl'
    : 'w-11 h-15 sm:w-14 sm:h-20 md:w-18 md:h-24 lg:w-20 lg:h-28 text-2xl sm:text-4xl md:text-5xl lg:text-6xl';

  return (
    <div
      className={`relative w-full max-w-5xl mx-auto rounded-3xl transition-all duration-300 ${
        state.settings.highContrast
          ? 'bg-white border-4 border-black text-black shadow-none'
          : 'bg-white border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100'
      }`}
    >
      {/* Subtle top indicator bar */}
      <div className="h-1.5 w-full bg-slate-100 rounded-t-3xl overflow-hidden">
        {state.tokenExpiresAt && (
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isTokenExpired
                ? 'bg-rose-500'
                : progressPercent < 20
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        )}
      </div>

      <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col items-center justify-center">
        {/* Header Tag above Token */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold tracking-wide">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>KODE TOKEN RESMI CBT</span>
          </div>

          {isTokenExpired ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>TOKEN KEDALUWARSA</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>STATUS: AKTIF & VALID</span>
            </div>
          )}
        </div>

        {/* The Mega Giant Token Display */}
        <div
          className={`flex items-center justify-center flex-wrap gap-2 sm:gap-3 md:gap-4 lg:gap-5 my-2 sm:my-4 transition-all ${
            isTokenExpired ? 'opacity-40 grayscale' : 'opacity-100'
          }`}
          aria-label={`Token Ujian: ${state.currentToken}`}
        >
          {tokenChars.map((char, index) => (
            <div
              key={`${index}-${char}`}
              className={`flex items-center justify-center rounded-2xl font-mono-token font-extrabold select-all tracking-wider transition-transform duration-200 hover:scale-[1.03] ${charBoxClass} ${
                state.settings.highContrast
                  ? 'bg-slate-50 border-3 border-black text-black'
                  : 'bg-gradient-to-b from-white via-slate-50/60 to-slate-100/90 text-slate-900 border border-slate-300/80 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'
              }`}
            >
              <span className="drop-shadow-xs">{char}</span>
            </div>
          ))}
        </div>

        {/* Token Validity & Countdown Bar */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600">
          {state.tokenExpiresAt ? (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                isTokenExpired
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : progressPercent < 20
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <Timer className="w-4 h-4 text-emerald-600" />
              <span>
                {isTokenExpired ? (
                  <strong className="font-semibold">Masa Berlaku Habis</strong>
                ) : (
                  <>
                    Berlaku sisa:{' '}
                    <strong className="font-mono-token font-bold text-slate-900 text-base">
                      {formatRemainingTime(remainingMs)}
                    </strong>
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
              <Timer className="w-4 h-4 text-emerald-600" />
              <span>Masa Berlaku: <strong>Tanpa Batas Waktu</strong></span>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Diperbarui: <strong>{formatTimestampHM(state.tokenCreatedAt)}</strong>
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            title="Salin token ke papan klip"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Salin Token</span>
              </>
            )}
          </button>
        </div>

        {/* Clear Instructions */}
        <p className="mt-4 text-center text-xs sm:text-sm text-slate-500 max-w-lg">
          Perhatikan huruf kapital dan angka dengan cermat. Masukkan token ini pada kolom input aplikasi CBT ujian.
        </p>
      </div>
    </div>
  );
};
