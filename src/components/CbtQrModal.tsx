import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useExam } from '../context/ExamContext';
import { X, ExternalLink, QrCode } from 'lucide-react';

interface CbtQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CbtQrModal: React.FC<CbtQrModalProps> = ({ isOpen, onClose }) => {
  const { state } = useExam();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const url = state.examInfo.cbtUrl || 'https://cbt.smkassyafiiyah.sch.id';

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error('Failed to generate QR Code', err));
  }, [isOpen, url]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl mb-3">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            Pindai Portal CBT Ujian
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Arahkan kamera smartphone atau tablet peserta ke QR Code berikut untuk menuju halaman ujian.
          </p>

          <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code CBT"
                className="w-56 h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                Membuat QR Code...
              </div>
            )}
          </div>

          <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl w-full flex items-center justify-between text-xs text-slate-700">
            <span className="truncate max-w-[200px] font-mono-token text-[11px] text-slate-600">
              {url}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-emerald-700 hover:text-emerald-900"
              title="Buka tautan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
