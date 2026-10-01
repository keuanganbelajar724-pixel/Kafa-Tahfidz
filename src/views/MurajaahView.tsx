import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { getSurahSync, getSurahCatalogItem } from '../services/quranService';
import { JUZ_30_SURAHS, getSurahById } from '../data/quranData';
import { 
  RotateCcw, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Volume2, 
  Flame, 
  Star,
  ChevronRight,
  Clock,
  Sparkle,
  Mic
} from 'lucide-react';
import { AyahProgress } from '../types';

interface MurajaahViewProps {
  onOpenSurah: (surahId: number) => void;
  onOpenFocusStudy: (surahId: number, ayahNumber: number) => void;
  onOpenContinuousVoice?: (surahId?: number, ayahNumber?: number) => void;
}

type MurajaahTab = 'today' | 'weak' | 'mastered' | 'all';

export const MurajaahView: React.FC<MurajaahViewProps> = ({
  onOpenSurah,
  onOpenFocusStudy,
  onOpenContinuousVoice,
}) => {
  const { 
    activeProfile, 
    ayahProgressList, 
    updateAyahProgress, 
    addXP, 
    triggerCelebration 
  } = useKafa();

  const [activeTab, setActiveTab] = useState<MurajaahTab>('today');
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter progress items
  const userProgress = ayahProgressList.filter((ap) => ap.childId === activeProfile.id);

  const todayItems = userProgress.filter(
    (ap) => ap.status === 'needs_murajaah' || ap.nextReviewDate <= todayStr || ap.status === 'almost_memorized'
  );

  const weakItems = userProgress.filter(
    (ap) => ap.status === 'needs_murajaah' || (ap.score > 0 && ap.score < 80)
  );

  const masteredItems = userProgress.filter(
    (ap) => ap.status === 'memorized' && ap.score >= 90
  );

  const getFilteredList = () => {
    switch (activeTab) {
      case 'today':
        return todayItems.length > 0 ? todayItems : userProgress.slice(0, 5);
      case 'weak':
        return weakItems;
      case 'mastered':
        return masteredItems;
      case 'all':
      default:
        return userProgress;
    }
  };

  const currentList = getFilteredList();

  const handleMarkReviewed = (item: AyahProgress) => {
    updateAyahProgress(item.surahId, item.ayahNumber, 'memorized', Math.min(100, (item.score || 85) + 5));
    addXP(15, `Muraja'ah Surat ${item.surahId} Ayat ${item.ayahNumber}`);
    triggerCelebration();
  };

  const playAudio = (surahId: number, ayahNumber: number) => {
    const surah = getSurahById(surahId);
    const ayah = surah?.ayat.find((a) => a.ayahNumber === ayahNumber);
    if (!ayah) return;

    const key = `${surahId}_${ayahNumber}`;
    const audio = new Audio(ayah.audioUrl);
    setPlayingAyahKey(key);
    audio.play().catch(() => {});
    audio.onended = () => setPlayingAyahKey(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-teal-100 backdrop-blur-md">
              Sistem Muraja'ah Pintar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pusat Muraja'ah Hafalan 🔁
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 max-w-md">
            Mengulang ayat secara berkala membuat hafalan kuat, mutqin, dan tidak mudah terlupakan.
          </p>
        </div>

        {/* Total muraja'ah stats */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <div className="text-2xl font-black">{todayItems.length}</div>
          <div className="text-[11px] font-bold text-teal-100">Ayat Target Hari Ini</div>
        </div>
      </div>

      {/* Quick Launch Continuous Voice Follower for Murajaah */}
      {onOpenContinuousVoice && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 rounded-3xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-emerald-400/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                Muraja'ah Mengalir
              </span>
              <span className="text-xs text-amber-300 font-extrabold">
                Benar = Jalan 🟢 | Salah = Berhenti 🔴
              </span>
            </div>
            <h3 className="font-black text-base sm:text-lg">
              Muraja'ah Lisan Berjalan Tanpa Henti 🎙️
            </h3>
            <p className="text-xs text-emerald-100 max-w-lg">
              Uji kelancaran muraja'ahmu langsung dengan lisan! Jika lancar ayat meluncur maju, jika ragu atau keliru ayat berhenti seketika.
            </p>
          </div>

          <button
            onClick={() => onOpenContinuousVoice(activeProfile.currentSurahId || 114, 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-emerald-900 font-black text-xs shadow-md hover:bg-emerald-50 transition cursor-pointer self-start sm:self-center shrink-0 hover:scale-105"
          >
            <Mic className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Mulai Muraja'ah Lisan 🚀</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'today', label: `🔥 Perlu Hari Ini (${todayItems.length})` },
          { id: 'weak', label: `⚠️ Perlu Penguatan (${weakItems.length})` },
          { id: 'mastered', label: `⭐ Sudah Mutqin (${masteredItems.length})` },
          { id: 'all', label: `📚 Semua Hafalan (${userProgress.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as MurajaahTab)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap shadow-xs ${
              activeTab === t.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Muraja'ah Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {currentList.map((item) => {
          const catalogItem = getSurahCatalogItem(item.surahId);
          const surah = getSurahSync(item.surahId) || {
            id: item.surahId,
            nameId: catalogItem?.nameId || `Surat ${item.surahId}`,
            nameLatin: catalogItem?.nameLatin || `Surat ${item.surahId}`,
            nameArabic: catalogItem?.nameArabic || '',
            translationName: '',
            meaningId: catalogItem?.meaningId || '',
            totalAyat: catalogItem?.totalAyat || 7,
            revelationType: catalogItem?.revelationType || 'Makkiyah',
            juzNumber: catalogItem?.juzNumber || 1,
            description: '',
            ayat: [],
          };
          const ayah = surah.ayat.find((a) => a.ayahNumber === item.ayahNumber);
          const isPlaying = playingAyahKey === `${item.surahId}_${item.ayahNumber}`;

          return (
            <div
              key={`${item.surahId}-${item.ayahNumber}`}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-400 transition duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-900">
                    Surat {surah.nameLatin}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Ayat {item.ayahNumber}
                  </span>
                  {item.score > 0 && (
                    <span className="text-xs font-bold text-amber-600">
                      Skor Terakhir: {item.score}
                    </span>
                  )}
                </div>

                {ayah && (
                  <p className="font-arabic text-xl sm:text-2xl text-slate-900 dark:text-slate-100 text-right py-1 leading-[2]">
                    {ayah.textArabic}
                  </p>
                )}

                {ayah && (
                  <p className="text-xs text-slate-500 italic">
                    "{ayah.translationId}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => playAudio(item.surahId, item.ayahNumber)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center ${
                      isPlaying
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Dengar Audio Ayat"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenFocusStudy(item.surahId, item.ayahNumber)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 text-xs font-bold transition"
                    title="Buka Mode Belajar"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleMarkReviewed(item)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesai Ulang (+15 XP)</span>
                </button>
              </div>
            </div>
          );
        })}

        {currentList.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
              Alhamdulillah, Tidak Ada Ayat Menumpuk!
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Semua hafalan dalam kategori ini sudah diulang dengan baik. Kamu bisa melanjutkan hafalan ayat baru.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
