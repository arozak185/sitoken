import React, { useState } from 'react';
import { useExam } from '../context/ExamContext';
import { generateCbtToken, sanitizeToken } from '../utils/tokenGenerator';
import { playTokenUpdateChime } from '../utils/audio';
import { formatTimestampHM } from '../utils/timeFormat';
import { TokenDisplaySize } from '../types/exam';
import {
  X,
  KeyRound,
  Dices,
  Save,
  Clock,
  History,
  Settings,
  Lock,
  Volume2,
  Check,
  RotateCcw,
  BookOpen,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  School,
  Cloud,
  Radio,
  Loader2,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const {
    state,
    updateToken,
    updateExamInfo,
    updateSettings,
    clearHistory,
    restoreToken,
    resetToDefaults,
    cloudStatus,
    currentUser,
    loginWithGoogle,
    logout,
  } = useExam();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Tab: 'token' | 'exam' | 'history' | 'settings'
  const [activeTab, setActiveTab] = useState<'token' | 'exam' | 'history' | 'settings'>('token');

  // Token Form State
  const [tokenInput, setTokenInput] = useState(state.currentToken);
  const [durationMinutes, setDurationMinutes] = useState(state.settings.tokenDurationMinutes);
  const [tokenNotes, setTokenNotes] = useState('');
  const [tokenSavedNotice, setTokenSavedNotice] = useState(false);

  // Exam Info Form State
  const [examForm, setExamForm] = useState(state.examInfo);
  const [examSavedNotice, setExamSavedNotice] = useState(false);

  // Settings State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Handle PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === state.settings.adminPin) {
      setIsAuthenticated(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('PIN salah! Silakan coba lagi (Default: 1234)');
    }
  };

  // Generate random token into input field
  const handleRandomize = () => {
    const random = generateCbtToken(6);
    setTokenInput(random);
  };

  // Submit token update to Firebase (syncs to all rooms)
  const handleApplyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeToken(tokenInput);
    if (!clean) return;

    setIsSubmitting(true);
    try {
      await updateToken(clean, durationMinutes, tokenNotes);
      setTokenSavedNotice(true);
      setTimeout(() => setTokenSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to update token', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Exam Info to Firebase
  const handleSaveExamInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateExamInfo(examForm);
      setExamSavedNotice(true);
      setTimeout(() => setExamSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to update exam info', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinChangeMsg({ type: 'error', text: 'PIN minimal 4 digit karakter' });
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg({ type: 'error', text: 'Konfirmasi PIN tidak cocok' });
      return;
    }
    updateSettings({ adminPin: newPin });
    setNewPin('');
    setConfirmPin('');
    setPinChangeMsg({ type: 'success', text: 'PIN berhasil diperbarui!' });
    setTimeout(() => setPinChangeMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Panel Pengawas & Admin Utama
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>Sinkron Semua Ruangan</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                SMK As-Syafi'iyah — Perubahan token di sini langsung tampil di seluruh ruang ujian secara realtime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-100 text-slate-700 rounded-3xl mb-4">
              <Lock className="w-8 h-8 text-emerald-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Masukkan PIN Pengawas
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-6">
              Akses ini khusus untuk pengawas ruang dan administrator ujian.
            </p>

            <form onSubmit={handleVerifyPin} className="w-full max-w-xs space-y-4">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN Pengawas (Default: 1234)"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono-token text-xl font-bold tracking-widest focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
              >
                Masuk ke Panel
              </button>

              <p className="text-[11px] text-slate-400">
                Petunjuk: Jika belum diubah, PIN default adalah <strong>1234</strong>
              </p>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Tabs */
          <div className="flex-1 overflow-y-auto">
            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveTab('token')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === 'token'
                    ? 'bg-white border-emerald-600 text-emerald-800 font-bold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Kelola Token</span>
              </button>
              <button
                onClick={() => setActiveTab('exam')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === 'exam'
                    ? 'bg-white border-emerald-600 text-emerald-800 font-bold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Info & Jadwal Ujian</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'bg-white border-emerald-600 text-emerald-800 font-bold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat ({state.history.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-white border-emerald-600 text-emerald-800 font-bold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pengaturan & PIN</span>
              </button>
            </div>

            {/* Tab 1: Token Management */}
            {activeTab === 'token' && (
              <div className="p-6 space-y-6">
                {tokenSavedNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Token berhasil disiarkan ke SELURUH RUANGAN ujian secara serentak!</span>
                  </div>
                )}

                <form onSubmit={handleApplyToken} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Kode Token Ujian (Maksimal 6-8 Karakter)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={8}
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                          placeholder="CONTOH: XK79PQ"
                          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-300 font-mono-token text-2xl font-extrabold tracking-widest text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 uppercase"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRandomize}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
                        title="Acak token otomatis"
                      >
                        <Dices className="w-4 h-4 text-emerald-600" />
                        <span>Acak Token</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Karakter otomatis menggunakan huruf kapital. Karakter membingungkan (seperti 0/O, 1/I) dihindari secara otomatis.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Masa Berlaku Token
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: '15 Menit', val: 15 },
                        { label: '30 Menit', val: 30 },
                        { label: '45 Menit', val: 45 },
                        { label: '60 Menit', val: 60 },
                        { label: 'Tanpa Batas', val: 0 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setDurationMinutes(item.val)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            durationMinutes === item.val
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Catatan / Keterangan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={tokenNotes}
                      onChange={(e) => setTokenNotes(e.target.value)}
                      placeholder="Contoh: Pembaruan token menit ke-30 / Token sesi tambahan"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyiarkan ke Seluruh Ruangan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Tayangkan & Siarkan ke Semua Ruangan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Exam Information */}
            {activeTab === 'exam' && (
              <div className="p-6 space-y-4">
                {examSavedNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Informasi ujian berhasil diperbarui!</span>
                  </div>
                )}

                <form onSubmit={handleSaveExamInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Nama Asesmen / Ujian
                      </label>
                      <input
                        type="text"
                        value={examForm.examName}
                        onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })}
                        placeholder="Contoh: Asesmen Sumatif Akhir Semester"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Mata Pelajaran
                      </label>
                      <input
                        type="text"
                        value={examForm.subject}
                        onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                        placeholder="Contoh: Pemrograman Web"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Tingkat / Kelas & Jurusan
                      </label>
                      <input
                        type="text"
                        value={examForm.gradeAndMajor}
                        onChange={(e) => setExamForm({ ...examForm, gradeAndMajor: e.target.value })}
                        placeholder="Contoh: XII RPL (Rekayasa Perangkat Lunak)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Ruang Ujian
                      </label>
                      <input
                        type="text"
                        value={examForm.roomName}
                        onChange={(e) => setExamForm({ ...examForm, roomName: e.target.value })}
                        placeholder="Contoh: Lab Komputer 01"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Sesi Ujian & Waktu
                      </label>
                      <input
                        type="text"
                        value={examForm.sessionName}
                        onChange={(e) => setExamForm({ ...examForm, sessionName: e.target.value })}
                        placeholder="Contoh: Sesi 1 (07.30 - 09.30 WIB)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        URL Portal CBT Siswa
                      </label>
                      <input
                        type="url"
                        value={examForm.cbtUrl}
                        onChange={(e) => setExamForm({ ...examForm, cbtUrl: e.target.value })}
                        placeholder="https://cbt.smkassyafiiyah.sch.id"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Pengawas 1
                      </label>
                      <input
                        type="text"
                        value={examForm.proctor1}
                        onChange={(e) => setExamForm({ ...examForm, proctor1: e.target.value })}
                        placeholder="Nama Pengawas Utama"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Pengawas 2 (Opsional)
                      </label>
                      <input
                        type="text"
                        value={examForm.proctor2}
                        onChange={(e) => setExamForm({ ...examForm, proctor2: e.target.value })}
                        placeholder="Nama Pengawas Pendamping"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Catatan Pengawas / Pengumuman untuk Peserta
                    </label>
                    <textarea
                      rows={2}
                      value={examForm.announcement}
                      onChange={(e) => setExamForm({ ...examForm, announcement: e.target.value })}
                      placeholder="Pesan khusus pengawas yang tampil di bagian bawah layar"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Informasi Ujian</span>
                  </button>
                </form>
              </div>
            )}

            {/* Tab 3: History */}
            {activeTab === 'history' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Riwayat Pembuatan Token
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Daftar token yang pernah digunakan dalam sesi ini.
                    </p>
                  </div>
                  {state.history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Riwayat</span>
                    </button>
                  )}
                </div>

                {state.history.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Belum ada riwayat token tersimpan.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {state.history.map((item) => {
                      const isCurrent = item.token === state.currentToken;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                            isCurrent
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono-token font-extrabold text-lg text-slate-900 tracking-wider">
                              {item.token}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="font-semibold">{item.subject}</span>
                                <span>•</span>
                                <span>{formatTimestampHM(item.createdAt)}</span>
                              </div>
                              {item.notes && (
                                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isCurrent ? (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Sedang Tayang
                              </span>
                            ) : (
                              <button
                                onClick={() => restoreToken(item.token)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                                title="Gunakan kembali token ini"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Gunakan</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Settings & PIN */}
            {activeTab === 'settings' && (
              <div className="p-6 space-y-6">
                {/* Audio chime toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-5 h-5 text-emerald-700" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Suara Notifikasi Token (Chime)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Membunyikan nada lonceng lembut saat token baru ditayangkan.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.settings.soundEnabled}
                        onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={playTokenUpdateChime}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Uji Dengarkan Suara Chime</span>
                  </button>
                </div>

                {/* Display size setting */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900 mb-2">
                    Ukuran Huruf Token di Layar Utama
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['normal', 'large', 'jumbo'] as TokenDisplaySize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateSettings({ displaySize: size })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border capitalize transition-all cursor-pointer ${
                          state.settings.displaySize === size
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {size === 'normal' ? 'Standar' : size === 'large' ? 'Besar' : 'Jumbo (Proyektor)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Header Icon Setting for TKA */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Ikon Header (Sementara untuk Kegiatan TKA)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Pilih ikon pengganti logo sekolah untuk kegiatan Tes Kemampuan Akademik (TKA).
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'graduation', label: 'Topi Toga', icon: GraduationCap },
                      { id: 'school', label: 'Gedung Sekolah', icon: School },
                      { id: 'book', label: 'Buku Ujian', icon: BookOpen },
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isSelected = (state.settings.iconType || 'graduation') === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateSettings({ iconType: item.id as 'graduation' | 'school' | 'book' })}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <IconComp className="w-4 h-4 text-emerald-600" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Google Admin Account (Optional Cloud Auth) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Akun Google Admin Utama (Firebase)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Email resmi: <strong>rozak.a003@gmail.com</strong>
                      </p>
                    </div>
                    {currentUser ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        Terautentikasi
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                        Mode PIN Aktif
                      </span>
                    )}
                  </div>
                  {currentUser ? (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-600 truncate max-w-[200px]">
                        {currentUser.email}
                      </span>
                      <button
                        type="button"
                        onClick={logout}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        Keluar Google
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={loginWithGoogle}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Masuk dengan Google (rozak.a003@gmail.com)</span>
                    </button>
                  )}
                </div>

                {/* Change PIN */}
                <form onSubmit={handleChangePin} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Ganti PIN Pengawas
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      PIN saat ini: ••••. Masukkan PIN baru minimal 4 angka.
                    </p>
                  </div>

                  {pinChangeMsg && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-medium ${
                        pinChangeMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {pinChangeMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="password"
                      maxLength={8}
                      placeholder="PIN Baru"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 font-mono-token"
                    />
                    <input
                      type="password"
                      maxLength={8}
                      placeholder="Konfirmasi PIN Baru"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 font-mono-token"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Simpan PIN Baru
                  </button>
                </form>

                {/* Reset to Defaults */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Kembalikan semua ke pengaturan bawaan
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Kembalikan semua data ke pengaturan awal?')) {
                        resetToDefaults();
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Reset Data Default
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
