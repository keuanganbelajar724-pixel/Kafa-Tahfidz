import React, { useRef } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  X, 
  Printer, 
  Download, 
  Award, 
  CheckCircle2, 
  Calendar, 
  BookOpen, 
  Star, 
  ShieldCheck,
  User
} from 'lucide-react';
import { JUZ_30_SURAHS } from '../data/quranData';

interface TahfizReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TahfizReportCardModal: React.FC<TahfizReportCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeProfile, ayahProgressList, setorAttempts, mutabaahRecords } = useKafa();
  const reportRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  // Compute stats
  const childProgress = ayahProgressList.filter((ap) => ap.childId === activeProfile.id);
  const memorizedAyatCount = childProgress.filter((ap) => ap.status === 'memorized').length;
  const inProgressAyatCount = childProgress.filter((ap) => ap.status === 'in_progress' || ap.status === 'almost_memorized').length;

  // Group by surah
  const surahBreakdown = JUZ_30_SURAHS.map((surah) => {
    const ayatInSurah = childProgress.filter((ap) => ap.surahId === surah.id);
    const memorizedInSurah = ayatInSurah.filter((ap) => ap.status === 'memorized').length;
    const isCompleted = memorizedInSurah >= surah.totalAyat;
    const percentage = Math.round((memorizedInSurah / surah.totalAyat) * 100);

    // Calculate avg score from setor attempts
    const attempts = setorAttempts.filter((a) => a.childId === activeProfile.id && a.surahId === surah.id);
    const avgScore = attempts.length > 0 
      ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length) 
      : (isCompleted ? 95 : 0);

    return {
      surah,
      memorizedInSurah,
      totalAyat: surah.totalAyat,
      percentage,
      isCompleted,
      avgScore,
    };
  }).filter((item) => item.memorizedInSurah > 0);

  // Overall average mutqin score
  const relevantAttempts = setorAttempts.filter((a) => a.childId === activeProfile.id);
  const averageMutqinScore = relevantAttempts.length > 0
    ? Math.round(relevantAttempts.reduce((acc, curr) => acc + curr.score, 0) / relevantAttempts.length)
    : 92;

  // Ibadah discipline score from Mutaba'ah
  const childMutabaah = mutabaahRecords.filter((m) => m.childId === activeProfile.id);
  const avgIbadahPercent = childMutabaah.length > 0
    ? Math.round(childMutabaah.reduce((acc, curr) => acc + (curr.percentage || 80), 0) / childMutabaah.length)
    : 90;

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP TOOLBAR */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500 text-white">📜</span>
            <span className="text-sm font-bold">Rapor Mutaba'ah & Prestasi Tahfiz</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT */}
        <div 
          ref={reportRef}
          className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 font-sans print:p-0 print:m-0 print:overflow-visible print:bg-white print:text-black space-y-6"
        >
          {/* KOP / OFFICIAL HEADER */}
          <div className="border-b-2 border-emerald-800 pb-5 text-center relative">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white text-2xl font-bold">
                📖
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-900 tracking-tight leading-none uppercase">
                  Pondok Tahfiz Al-Qur'an KAFA
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Sistem Informasi & Mutaba'ah Tahfizul Qur'an 30 Juz Berbasis Digital
                </p>
              </div>
            </div>
            <div className="mt-3 text-sm font-extrabold text-slate-800 tracking-wider uppercase border-t border-slate-200 pt-2">
              Laporan Hasil Belajar & Prestasi Hafalan Santri
            </div>
          </div>

          {/* SANTRI IDENTITY DETAILS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Nama Santri:</span>
              <strong className="text-sm text-slate-900">{activeProfile.name}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tingkat / Kelas:</span>
              <span className="font-bold text-slate-800">{activeProfile.grade}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Hafalan:</span>
              <span className="font-bold text-slate-800">Juz {activeProfile.currentJuz || 30}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Gelar Level:</span>
              <span className="font-bold text-emerald-700">{activeProfile.levelName}</span>
            </div>
          </div>

          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Ayat Hafal</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {memorizedAyatCount} <span className="text-xs text-slate-500 font-normal">Ayat</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nilai Mutqin Rata-rata</span>
              <div className="text-xl font-extrabold text-teal-700 mt-0.5">
                {averageMutqinScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Kedisiplinan Ibadah</span>
              <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
                {avgIbadahPercent}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Keistiqomahan (Streak)</span>
              <div className="text-xl font-extrabold text-amber-600 mt-0.5">
                {activeProfile.streak} <span className="text-xs text-slate-500 font-normal">Hari</span>
              </div>
            </div>
          </div>

          {/* SURAH MEMORIZATION BREAKDOWN TABLE */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Rincian Penguasaan Surat (Juz 'Amma)</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nama Surat</th>
                    <th className="py-2.5 px-3 text-center">Jumlah Ayat</th>
                    <th className="py-2.5 px-3 text-center">Status Penguasaan</th>
                    <th className="py-2.5 px-3 text-center">Nilai Kelancaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {surahBreakdown.length > 0 ? (
                    surahBreakdown.map((item, idx) => (
                      <tr key={item.surah.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">
                          Surat {item.surah.nameLatin} ({item.surah.nameArabic})
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.memorizedInSurah} / {item.totalAyat}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              ✓ Mutqin Penuh
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              {item.percentage}% Sedang Dipelajari
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">
                          {item.avgScore > 0 ? `${item.avgScore} (A)` : '85 (B+)'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        Belum ada surat yang disetorkan. Mulai setoran di Mode Hafalan!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADVICE & SIGNATURE SECTION */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Ustadz notes */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <strong className="block text-slate-800 mb-1">Catatan Pembimbing Tahfiz:</strong>
              <p className="text-slate-600 leading-relaxed italic">
                "Alhamdulillah ananda {activeProfile.name} menunjukkan semangat yang sangat baik dalam mempelajari dan menjaga hafalan Al-Qur'an. Pertahankan muraja'ah harian dan terus istiqomah dalam ibadah."
              </p>
            </div>

            {/* Signatures */}
            <div className="flex justify-around items-end pt-4 sm:pt-0 text-center">
              <div>
                <p className="text-[10px] text-slate-500">Mengetahui,</p>
                <p className="text-xs font-bold text-slate-800">Orang Tua / Wali Santri</p>
                <div className="h-14" />
                <p className="border-t border-slate-300 pt-1 font-bold text-slate-700">
                  ( ..................................... )
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-500">{currentDateFormatted}</p>
                <p className="text-xs font-bold text-slate-800">Ustadz / Pembimbing</p>
                <div className="h-14 flex items-center justify-center">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-500 rounded-md rotate-[-8deg]">
                    ★ KAFA MUTQIN ★
                  </span>
                </div>
                <p className="border-t border-slate-300 pt-1 font-bold text-slate-700">
                  ( Ustadz Pembimbing Tahfiz )
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          <div className="text-xs text-slate-500">
            Dapat dicetak atau disimpan format PDF untuk laporan bulanan wali santri.
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
