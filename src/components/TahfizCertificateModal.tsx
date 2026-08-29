import React, { useRef } from 'react';
import { 
  X, 
  Award, 
  Printer, 
  Download, 
  Sparkles, 
  Star, 
  CheckCircle,
  Share2
} from 'lucide-react';
import { useKafa } from '../context/KafaContext';

interface TahfizCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  surahName?: string;
  surahId?: number;
  juzNumber?: number;
  score?: number;
}

export const TahfizCertificateModal: React.FC<TahfizCertificateModalProps> = ({
  isOpen,
  onClose,
  surahName = "An-Naba'",
  surahId = 78,
  juzNumber = 30,
  score = 96,
}) => {
  const { activeProfile } = useKafa();
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/30 flex items-center justify-center text-amber-200">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                Syahadah Tahfizul Qur'an Digital 🏅
              </h2>
              <p className="text-xs text-amber-100/80">
                Sertifikat kelulusan & apresiasi hafalan santri cilik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Display Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex justify-center bg-slate-100 dark:bg-slate-950">
          <div
            id="tahfiz-certificate-print"
            ref={certRef}
            className="w-full max-w-2xl bg-[#fffef9] text-slate-900 rounded-3xl p-6 sm:p-10 border-8 border-double border-amber-600/70 shadow-2xl relative overflow-hidden"
          >
            {/* Islamic Gold Corner Accents */}
            <div className="absolute top-2 left-2 text-amber-600 font-bold text-lg select-none">❖</div>
            <div className="absolute top-2 right-2 text-amber-600 font-bold text-lg select-none">❖</div>
            <div className="absolute bottom-2 left-2 text-amber-600 font-bold text-lg select-none">❖</div>
            <div className="absolute bottom-2 right-2 text-amber-600 font-bold text-lg select-none">❖</div>

            {/* Bismillah Banner */}
            <div className="text-center space-y-2">
              <div className="font-arabic text-2xl sm:text-3xl text-emerald-800 font-bold">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700">
                KAFA TAHFIZ INDONESIA • SYAHADAH HAFALAN
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                SERTIFIKAT KELULUSAN TAHFIZ
              </h1>
            </div>

            <div className="my-6 border-b-2 border-amber-200/80 w-32 mx-auto" />

            {/* Main Certificate Content */}
            <div className="text-center space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Dengan penuh rasa syukur kepada Allah SWT, sertifikat ini dianugerahkan kepada:
              </p>

              {/* Student Name */}
              <div className="py-2">
                <div className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight uppercase border-b-2 border-dashed border-emerald-400 inline-block px-6 pb-1">
                  {activeProfile.name}
                </div>
                <div className="text-xs text-slate-500 font-bold mt-1">
                  {activeProfile.grade} • Santri Cilik Kafa
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-lg mx-auto">
                Telah berhasil menyelesaikan ujian dan setoran hafalan Al-Qur'an dengan predikat{' '}
                <strong className="text-emerald-700 font-extrabold">Mumtaz (Istimewa)</strong> pada surat:
              </p>

              {/* Surah Details Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 inline-flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left mx-auto">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {surahId}
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">
                    Surat {surahName} (Juz {juzNumber})
                  </div>
                  <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Skor Ujian: {score}/100 • Mutqin & Tartil</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-500 italic max-w-md mx-auto pt-2">
                "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." (HR. Bukhari)
              </p>
            </div>

            {/* Signatures & Seal */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-center text-xs">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Tanggal Kelulusan</div>
                <div className="font-bold text-slate-800">{currentDate}</div>
              </div>

              {/* Seal Stamp */}
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-amber-600 flex flex-col items-center justify-center text-amber-700 font-black text-[9px] rotate-12 shadow-xs bg-amber-100/50 select-none">
                <span>KAFA</span>
                <span>TAHFIZ</span>
                <span>★ MUTQIN ★</span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Pembimbing Tahfiz</div>
                <div className="font-arabic text-base text-emerald-800 font-bold">أُسْتَاذُ كَافَا</div>
                <div className="font-bold text-slate-800">Ustadz Kafa AI</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500 hidden sm:block">
            Tips: Gunakan tombol Cetak untuk mencetak atau menyimpan sebagai PDF.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
