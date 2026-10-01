import React, { useState, useMemo, useRef } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  getSurahSync, 
  getSurahCatalogItem, 
  getAllJuzList, 
  getAllSurahCatalog,
  RECITERS_LIST, 
  getAyahAudioUrlWithReciter 
} from '../services/quranService';
import { getSurahById } from '../data/quranData';
import { 
  RotateCcw, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Pause,
  Volume2, 
  Flame, 
  Star,
  ChevronRight,
  Clock,
  Mic,
  BookOpen,
  Filter,
  Check,
  UserCheck,
  Layers,
  Sparkle
} from 'lucide-react';
import { AyahProgress } from '../types';

interface MurajaahViewProps {
  onOpenSurah: (surahId: number) => void;
  onOpenFocusStudy: (surahId: number, ayahNumber: number) => void;
  onOpenContinuousVoice?: (surahId?: number, ayahNumber?: number) => void;
}

type MurajaahViewMode = 'by_juz' | 'by_status';
type MurajaahStatusTab = 'today' | 'weak' | 'mastered' | 'all';

export const MurajaahView: React.FC<MurajaahViewProps> = ({
  onOpenSurah,
  onOpenFocusStudy,
  onOpenContinuousVoice,
}) => {
  const { 
    activeProfile, 
    ayahProgressList, 
    updateAyahProgress, 
    getSurahProgressStats,
    addXP, 
    triggerCelebration 
  } = useKafa();

  // Mode Selection: By Juz 1-30 vs By Memory Status
  const [viewMode, setViewMode] = useState<MurajaahViewMode>('by_juz');
  const [selectedJuz, setSelectedJuz] = useState<number>(30);
  const [juzFilterGroup, setJuzFilterGroup] = useState<'all' | '1-10' | '11-20' | '21-30'>('21-30');
  const [statusTab, setStatusTab] = useState<MurajaahStatusTab>('today');

  // Reciter Selection (18 Ustadz / Qari)
  const [selectedReciterId, setSelectedReciterId] = useState<string>('alafasy');
  const currentReciter = RECITERS_LIST.find((r) => r.id === selectedReciterId) || RECITERS_LIST[0];

  // Audio Playback
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Metadata
  const allJuzList = useMemo(() => getAllJuzList(), []);
  const allSurahs = useMemo(() => getAllSurahCatalog(), []);

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

  const getFilteredStatusList = () => {
    switch (statusTab) {
      case 'today':
        return todayItems.length > 0 ? todayItems : userProgress.slice(0, 6);
      case 'weak':
        return weakItems;
      case 'mastered':
        return masteredItems;
      case 'all':
      default:
        return userProgress;
    }
  };

  const currentStatusList = getFilteredStatusList();

  // Surahs in selected Juz
  const surahsInSelectedJuz = useMemo(() => {
    return allSurahs.filter(
      (s) => s.juzList.includes(selectedJuz) || s.juzNumber === selectedJuz
    );
  }, [allSurahs, selectedJuz]);

  const selectedJuzInfo = useMemo(() => {
    return allJuzList.find((j) => j.juzNumber === selectedJuz) || allJuzList[29];
  }, [allJuzList, selectedJuz]);

  const totalAyatInSelectedJuz = useMemo(() => {
    return surahsInSelectedJuz.reduce((acc, s) => acc + s.totalAyat, 0);
  }, [surahsInSelectedJuz]);

  // Audio Handler with selected Ustadz
  const playAudio = (surahId: number, ayahNumber: number) => {
    const key = `${surahId}_${ayahNumber}`;

    if (playingAyahKey === key && audioRef.current) {
      audioRef.current.pause();
      setPlayingAyahKey(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = getAyahAudioUrlWithReciter(surahId, ayahNumber, currentReciter.folder);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAyahKey(key);

    audio.play().catch(() => {
      // Fallback
      const fallbackUrl = getSurahById(surahId)?.ayat.find((a) => a.ayahNumber === ayahNumber)?.audioUrl;
      if (fallbackUrl && fallbackUrl !== audioUrl) {
        const fallbackAudio = new Audio(fallbackUrl);
        audioRef.current = fallbackAudio;
        fallbackAudio.play().catch(() => {});
        fallbackAudio.onended = () => setPlayingAyahKey(null);
      }
    });

    audio.onended = () => setPlayingAyahKey(null);
  };

  const handleMarkReviewed = (item: AyahProgress) => {
    updateAyahProgress(item.surahId, item.ayahNumber, 'memorized', Math.min(100, (item.score || 85) + 5));
    addXP(15, `Muraja'ah Surat ${item.surahId} Ayat ${item.ayahNumber}`);
    triggerCelebration();
  };

  // Filtered Juz buttons based on quick group
  const displayedJuzButtons = useMemo(() => {
    if (juzFilterGroup === '1-10') return allJuzList.slice(0, 10);
    if (juzFilterGroup === '11-20') return allJuzList.slice(10, 20);
    if (juzFilterGroup === '21-30') return allJuzList.slice(20, 30);
    return allJuzList;
  }, [allJuzList, juzFilterGroup]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 pb-28">
      {/* 1. HEADER BANNER */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-black backdrop-blur-md flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Sistem Muraja'ah Lengkap 30 Juz
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              18 Pilihan Ustadz / Qari
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Pusat Muraja'ah Hafalan 🔁
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Pilih Juz 1 s/d 30 dengan mudah, dengarkan lantunan ustadz favorit, atau uji hafalanmu secara hands-free dengan mode baca berjalan.
          </p>
        </div>

        {/* Global Ustadz Selector in Banner */}
        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 space-y-1.5 shrink-0 z-10 self-start md:self-center w-full md:w-auto min-w-[260px]">
          <label className="text-[11px] font-black text-emerald-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Pilihan Ustadz / Qari Murottal:</span>
            </span>
            <span className="text-[10px] text-amber-300 font-bold">18 Qari</span>
          </label>
          <select
            value={selectedReciterId}
            onChange={(e) => setSelectedReciterId(e.target.value)}
            className="w-full bg-white text-slate-900 font-extrabold text-xs rounded-xl px-3 py-2 border-0 shadow-md focus:outline-none cursor-pointer"
          >
            {RECITERS_LIST.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-emerald-200/90 truncate font-medium">
            Khas: {currentReciter.sub}
          </div>
        </div>
      </div>

      {/* 2. MODE SELECTOR: JUZ 1-30 vs STATUS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('by_juz')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs transition cursor-pointer ${
              viewMode === 'by_juz'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📖 Pilih Juz 1 s/d 30 (Paling Mudah)</span>
          </button>

          <button
            onClick={() => setViewMode('by_status')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs transition cursor-pointer ${
              viewMode === 'by_status'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>🎯 Target Harian & Status Hafalan ({todayItems.length})</span>
          </button>
        </div>

        {onOpenContinuousVoice && (
          <button
            onClick={() => onOpenContinuousVoice(surahsInSelectedJuz[0]?.id || 114, 1)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-sm transition hover:scale-105 cursor-pointer shrink-0"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Mulai Baca Berjalan 🚀</span>
          </button>
        )}
      </div>

      {/* 3. MODE A: JUZ 1-30 EXPLORER */}
      {viewMode === 'by_juz' && (
        <div className="space-y-6">
          {/* Quick Group Tabs & 30 Juz Buttons */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  🧭
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    Pilih Target Juz Muraja'ah
                  </h3>
                  <p className="text-xs text-slate-500">
                    Klik nomor Juz yang ingin dimuraja'ah (Juz 1 s/d Juz 30):
                  </p>
                </div>
              </div>

              {/* Quick Jump Groups */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: '21-30', label: 'Juz 21–30 (Termasuk Juz Amma)' },
                  { id: '11-20', label: 'Juz 11–20' },
                  { id: '1-10', label: 'Juz 1–10' },
                  { id: 'all', label: 'Tampilkan Semua 30 Juz' },
                ].map((grp) => (
                  <button
                    key={grp.id}
                    onClick={() => setJuzFilterGroup(grp.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                      juzFilterGroup === grp.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Juz 1-30 Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 sm:gap-2.5">
              {displayedJuzButtons.map((j) => {
                const isSelected = selectedJuz === j.juzNumber;
                return (
                  <button
                    key={j.juzNumber}
                    onClick={() => setSelectedJuz(j.juzNumber)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 group relative ${
                      isSelected
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-emerald-500 shadow-md shadow-emerald-600/30 scale-105'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-80">
                      Juz
                    </span>
                    <span className="text-lg sm:text-xl font-black">
                      {j.juzNumber}
                    </span>
                    <span className="text-[9px] font-bold truncate max-w-full opacity-75">
                      {j.name.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Juz Spotlight Card */}
          <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 font-black text-xs border border-emerald-400/30">
                  Target Aktif: Juz {selectedJuz}
                </span>
                <span className="text-xs text-amber-300 font-extrabold">
                  {selectedJuzInfo.name} ({surahsInSelectedJuz.length} Surat • {totalAyatInSelectedJuz} Ayat)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                Juz {selectedJuz}: Surat {selectedJuzInfo.startSurahName} s/d {selectedJuzInfo.endSurahName}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
                Suara Murottal saat ini: <strong className="text-amber-300">{currentReciter.name}</strong> ({currentReciter.sub}). Klik surat di bawah untuk mulai muraja'ah!
              </p>
            </div>

            {/* Quick Action Buttons for Selected Juz */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              {onOpenContinuousVoice && (
                <button
                  onClick={() => onOpenContinuousVoice(surahsInSelectedJuz[0]?.id || 114, 1)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg transition transform hover:scale-105 cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-emerald-950 animate-pulse" />
                  <span>Muraja'ah Lisan Juz {selectedJuz} 🚀</span>
                </button>
              )}

              <button
                onClick={() => {
                  const firstSurah = surahsInSelectedJuz[0];
                  if (firstSurah) onOpenSurah(firstSurah.id);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>Buka Surat Pertama</span>
              </button>
            </div>
          </div>

          {/* Surahs in this Juz Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>📚</span>
                <span>Daftar {surahsInSelectedJuz.length} Surat dalam Juz {selectedJuz}</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Pilih surat untuk mulai muraja'ah ayat
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {surahsInSelectedJuz.map((s) => {
                const stats = getSurahProgressStats(s.id, s.totalAyat);
                const isPlaying = playingAyahKey?.startsWith(`${s.id}_`);

                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                            {s.id}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                              {s.nameLatin}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              {s.totalAyat} Ayat • {s.revelationType}
                            </span>
                          </div>
                        </div>

                        <span className="font-arabic text-xl font-bold text-slate-800 dark:text-slate-200">
                          {s.nameArabic}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Kemajuan Muraja'ah</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {stats.percentage}% ({stats.memorized}/{s.totalAyat})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(4, stats.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {onOpenContinuousVoice && (
                        <button
                          onClick={() => onOpenContinuousVoice(s.id, 1)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                          title="Muraja'ah dengan Suara Mengalir"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Lisan 🎙️</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenSurah(s.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
                        title="Buka Halaman Surat"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buka Surat</span>
                      </button>

                      <button
                        onClick={() => onOpenFocusStudy(s.id, 1)}
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/80 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-emerald-600" />
                        <span>Mode Belajar Per Ayat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODE B: TARGET HARIAN & STATUS FILTER */}
      {viewMode === 'by_status' && (
        <div className="space-y-6">
          {/* Status Sub-Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'today', label: `🔥 Perlu Hari Ini (${todayItems.length})` },
              { id: 'weak', label: `⚠️ Perlu Penguatan (${weakItems.length})` },
              { id: 'mastered', label: `⭐ Sudah Mutqin (${masteredItems.length})` },
              { id: 'all', label: `📚 Semua Hafalan (${userProgress.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusTab(t.id as MurajaahStatusTab)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap shadow-xs cursor-pointer ${
                  statusTab === t.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Cards List for Status Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {currentStatusList.map((item) => {
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
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-400 transition flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-900">
                          Surat {surah.nameLatin}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          Ayat {item.ayahNumber} dari {surah.totalAyat}
                        </span>
                      </div>

                      {item.score > 0 && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                          Skor: {item.score}
                        </span>
                      )}
                    </div>

                    {ayah && (
                      <p className="font-arabic text-xl sm:text-2xl text-slate-900 dark:text-slate-100 text-right py-2 leading-[2.2]">
                        {ayah.textArabic}
                      </p>
                    )}

                    {ayah && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        "{ayah.translationId}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playAudio(item.surahId, item.ayahNumber)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isPlaying
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title={`Dengar Lantunan ${currentReciter.name}`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{isPlaying ? 'Jeda' : currentReciter.name.split(' ')[1] || 'Qari'}</span>
                      </button>

                      <button
                        onClick={() => onOpenFocusStudy(item.surahId, item.ayahNumber)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Fokus</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleMarkReviewed(item)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selesai Muraja'ah (+15 XP)</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {currentStatusList.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg">
                  Alhamdulillah, Belum Ada Ayat Menumpuk!
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Semua hafalan dalam kategori ini sudah diulang dengan baik. Kamu dapat memilih <strong>Mode Pilih Juz 1 s/d 30</strong> di atas untuk memuraja'ah seluruh juz secara berurutan.
                </p>
                <button
                  onClick={() => setViewMode('by_juz')}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md transition cursor-pointer"
                >
                  Buka Pilihan Juz 1 s/d 30 &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
