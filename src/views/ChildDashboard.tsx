import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  Sparkles, 
  Flame, 
  Star, 
  BookOpen, 
  RotateCcw, 
  ChevronRight, 
  Play, 
  Award, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkle,
  Mic,
  Lock,
  Unlock,
  Repeat,
  Target,
  FileText
} from 'lucide-react';
import { ChildTab } from '../components/ChildBottomNav';
import { getSurahSync, getSurahCatalogItem } from '../services/quranService';
import { JUZ_30_SURAHS } from '../data/quranData';
import { MutabaahYaumiyahModal } from '../components/MutabaahYaumiyahModal';
import { DzikirDoaModal } from '../components/DzikirDoaModal';
import { TikrarPlayerModal } from '../components/TikrarPlayerModal';
import { TahfizTargetPlannerModal } from '../components/TahfizTargetPlannerModal';
import { TahfizReportCardModal } from '../components/TahfizReportCardModal';

interface ChildDashboardProps {
  onNavigateTab: (tab: ChildTab) => void;
  onOpenSurah: (surahId: number) => void;
  onOpenFocusStudy: (surahId: number, ayahNumber: number) => void;
  onOpenAssistant: () => void;
  onOpenVoiceGate?: (surahId?: number, ayahNumber?: number) => void;
  onOpenContinuousVoice?: (surahId?: number, ayahNumber?: number) => void;
}

export const ChildDashboard: React.FC<ChildDashboardProps> = ({
  onNavigateTab,
  onOpenSurah,
  onOpenFocusStudy,
  onOpenAssistant,
  onOpenVoiceGate,
  onOpenContinuousVoice,
}) => {
  const { 
    activeProfile, 
    quests, 
    completeQuest, 
    ayahProgressList,
    getSurahProgressStats,
    getMutabaahForDate
  } = useKafa();

  // Modals state
  const [isMutabaahModalOpen, setIsMutabaahModalOpen] = useState(false);
  const [isDzikirModalOpen, setIsDzikirModalOpen] = useState(false);
  const [isTikrarModalOpen, setIsTikrarModalOpen] = useState(false);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);

  // Today's Mutaba'ah state
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMutabaah = getMutabaahForDate(activeProfile.id, todayStr);

  // Find target surah details across 30 Juz
  const targetSurah = getSurahSync(activeProfile.currentSurahId) || {
    id: activeProfile.currentSurahId || 78,
    nameId: getSurahCatalogItem(activeProfile.currentSurahId)?.nameId || 'An-Naba\'',
    nameLatin: getSurahCatalogItem(activeProfile.currentSurahId)?.nameLatin || 'An-Naba\'',
    nameArabic: getSurahCatalogItem(activeProfile.currentSurahId)?.nameArabic || 'النبأ',
    translationName: '',
    meaningId: getSurahCatalogItem(activeProfile.currentSurahId)?.meaningId || 'Berita Besar',
    totalAyat: getSurahCatalogItem(activeProfile.currentSurahId)?.totalAyat || 40,
    revelationType: getSurahCatalogItem(activeProfile.currentSurahId)?.revelationType || 'Makkiyah',
    juzNumber: getSurahCatalogItem(activeProfile.currentSurahId)?.juzNumber || 30,
    description: '',
    ayat: [],
  };
  const targetStats = getSurahProgressStats(targetSurah.id, targetSurah.totalAyat);

  // Today's target ayat calculation
  const targetDailyAyat = activeProfile.targetDailyAyat || 3;
  const currentMemorizedInTarget = targetStats.memorized;
  const nextAyahToLearn = Math.min(targetSurah.totalAyat, currentMemorizedInTarget + 1);

  // Calculate items needing muraja'ah
  const itemsNeedingMurajaah = ayahProgressList.filter(
    (ap) => ap.childId === activeProfile.id && (ap.status === 'needs_murajaah' || ap.status === 'almost_memorized')
  );

  // Total memorized ayat for active profile
  const totalMemorizedAyat = ayahProgressList.filter(
    (ap) => ap.childId === activeProfile.id && ap.status === 'memorized'
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* 1. GREETING & ENCOURAGEMENT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-700/15 relative overflow-hidden">
        {/* Subtle geometric background decoration */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <span className="font-arabic text-9xl">📖</span>
        </div>

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeProfile.avatar}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 backdrop-blur-md">
              {activeProfile.grade} • {activeProfile.levelName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Assalamu'alaikum, {activeProfile.name}! 👋
          </h1>
          <p className="text-sm text-emerald-100/90 font-medium max-w-md">
            Hari yang berkah untuk menambah dan menjaga hafalan Al-Qur'an.
          </p>
        </div>

        {/* Quick Kak Kafa AI Mentor callout */}
        <button
          onClick={onOpenAssistant}
          className="self-start sm:self-center z-10 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-emerald-800 font-bold text-xs shadow-lg hover:bg-emerald-50 transition transform active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>Tanya Kak Kafa AI</span>
        </button>
      </div>

      {/* 2. TARGET HAFALAN HARI INI (PRIMARY FOCUS AS MANDATED) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-xl shadow-emerald-950/5 relative overflow-hidden">
        {/* Top ribbon */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Target Hafalan Hari Ini
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Target Harian: {targetDailyAyat} Ayat
          </span>
        </div>

        {/* Main Target Content Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Surat {targetSurah.nameLatin}
              </h2>
              <span className="font-arabic text-2xl text-emerald-600 dark:text-emerald-400 font-bold">
                {targetSurah.nameArabic}
              </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Fokus sekarang: <span className="font-bold text-emerald-600 dark:text-emerald-400">Ayat {nextAyahToLearn}</span> dari {targetSurah.totalAyat} ayat ({targetSurah.meaningId})
            </p>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Progres Surat</span>
                <span className="text-emerald-600 dark:text-emerald-400">{targetStats.percentage}% ({targetStats.memorized}/{targetSurah.totalAyat} Ayat)</span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, targetStats.percentage)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-2.5">
            <button
              onClick={() => onOpenFocusStudy(targetSurah.id, nextAyahToLearn)}
              className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition transform active:scale-98 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Mulai Hafalan Ayat {nextAyahToLearn}</span>
            </button>

            {onOpenVoiceGate && (
              <button
                onClick={() => onOpenVoiceGate(targetSurah.id, nextAyahToLearn)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>🎤 Uji Lisan Real-Time (Voice Gate)</span>
              </button>
            )}

            <button
              onClick={() => onOpenSurah(targetSurah.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Buka Daftar Seluruh Ayat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2.5 SPECIAL FEATURE BANNER: VOICE FOLLOWER & VOICE GATE */}
      {(onOpenContinuousVoice || onOpenVoiceGate) && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border-2 border-emerald-500/40 shadow-xl relative overflow-hidden">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-10 font-arabic text-8xl pointer-events-none">
            🎙️
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 z-10 relative">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-black text-[11px] border border-emerald-400/30">
                  ✨ Mode Lisan Interaktif
                </span>
                <span className="text-xs font-bold text-amber-300">
                  Benar = Jalan 🟢 | Salah = Berhenti 🔴
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Membaca Mengalir dengan Suara (Voice Follower) 🎙️
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Bacakan ayat terus menerus tanpa henti (hands-free)! Jika bacaanmu benar, <strong>ayat otomatis jalan / meluncur ke ayat berikutnya</strong> 🟢. Namun jika salah, <strong>ayat langsung terkunci dan tidak jalan</strong> 🔴 sampai kamu membaca dengan makhraj yang tepat!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {onOpenContinuousVoice && (
                <button 
                  onClick={() => onOpenContinuousVoice(targetSurah.id, nextAyahToLearn)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 cursor-pointer"
                >
                  <Mic className="w-4 h-4 animate-pulse text-amber-300" />
                  <span>Mulai Baca Berjalan 🚀</span>
                </button>
              )}

              {onOpenVoiceGate && (
                <button 
                  onClick={() => onOpenVoiceGate(targetSurah.id, nextAyahToLearn)}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Uji Lisan Per Ayat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2.6 JURNAL MUTABA'AH YAUMIYAH HARI INI */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-3xl p-5 sm:p-6 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-600/20">
              🕌
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Mutaba'ah Yaumiyah Hari Ini
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
                  {todayMutabaah.percentage || 0}% Selesai
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Disiplin Ibadah & Amalan Kebaikan
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsMutabaahModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition cursor-pointer self-start sm:self-center"
          >
            <span>Buka Jurnal Ibadah</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick status checklist preview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div 
            onClick={() => setIsMutabaahModalOpen(true)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition"
          >
            <span className="text-base">{todayMutabaah.subuh && todayMutabaah.dzuhur && todayMutabaah.ashar ? '✅' : '🕌'}</span>
            <div className="truncate">
              <span className="font-bold block truncate">Shalat 5 Waktu</span>
              <span className="text-[10px] text-slate-400">Subuh, Dzuhur, Ashar...</span>
            </div>
          </div>

          <div 
            onClick={() => setIsMutabaahModalOpen(true)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition"
          >
            <span className="text-base">{todayMutabaah.ziyadahDone ? '✅' : '🌱'}</span>
            <div className="truncate">
              <span className="font-bold block truncate">Ziyadah Ayat Baru</span>
              <span className="text-[10px] text-slate-400">{todayMutabaah.ziyadahDone ? 'Sudah Setor' : 'Belum Setor'}</span>
            </div>
          </div>

          <div 
            onClick={() => setIsMutabaahModalOpen(true)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition"
          >
            <span className="text-base">{todayMutabaah.murajaahDone ? '✅' : '🔁'}</span>
            <div className="truncate">
              <span className="font-bold block truncate">Muraja'ah Harian</span>
              <span className="text-[10px] text-slate-400">{todayMutabaah.murajaahDone ? 'Sudah Diulang' : 'Perlu Diulang'}</span>
            </div>
          </div>

          <div 
            onClick={() => setIsDzikirModalOpen(true)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition"
          >
            <span className="text-base">{todayMutabaah.dzikirPagi && todayMutabaah.dzikirPetang ? '✅' : '📿'}</span>
            <div className="truncate">
              <span className="font-bold block truncate">Dzikir & Tasbih</span>
              <span className="text-[10px] text-slate-400">Pagi & Petang</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.7 FITUR UNGGULAN TAHFIZ & ROADMAP GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Pusat Fitur & Alat Tahfiz Unggulan
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Bermanfaat Setiap Hari</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tikrar Player */}
          <div
            onClick={() => setIsTikrarModalOpen(true)}
            className="p-4 rounded-3xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800/80 hover:border-teal-400 transition cursor-pointer group shadow-xs space-y-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-lg group-hover:scale-110 transition shadow-sm">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Mode Tikrar
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Ulang ayat 3x, 5x, 10x otomatis dengan jeda menirukan
              </p>
            </div>
          </div>

          {/* Dzikir & Tasbih */}
          <div
            onClick={() => setIsDzikirModalOpen(true)}
            className="p-4 rounded-3xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/80 hover:border-purple-400 transition cursor-pointer group shadow-xs space-y-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg group-hover:scale-110 transition shadow-sm">
              <span>📿</span>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Dzikir & Tasbih
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Al-Matsurat pagi petang & doa kemudahan menghafal
              </p>
            </div>
          </div>

          {/* Target Roadmap */}
          <div
            onClick={() => setIsPlannerModalOpen(true)}
            className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-950/40 dark:to-cyan-950/40 border border-blue-200 dark:border-blue-800/80 hover:border-blue-400 transition cursor-pointer group shadow-xs space-y-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg group-hover:scale-110 transition shadow-sm">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Roadmap Target
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hitung estimasi tanggal khatam & jadwal hafalan
              </p>
            </div>
          </div>

          {/* Rapor Prestasi Santri */}
          <div
            onClick={() => setIsReportCardOpen(true)}
            className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/80 hover:border-amber-400 transition cursor-pointer group shadow-xs space-y-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-lg group-hover:scale-110 transition shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Rapor Santri
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Cetak lembar evaluasi resmi & nilai mutqin santri
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK STATS SUMMARY */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Streak */}
        <div 
          onClick={() => onNavigateTab('profil')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-300 transition group"
        >
          <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
            <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {activeProfile.streak}
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Hari Beruntun 🔥
          </span>
        </div>

        {/* Total Memorized */}
        <div 
          onClick={() => onNavigateTab('hafalan')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-300 transition group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalMemorizedAyat}
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Ayat Dikuasai 📖
          </span>
        </div>

        {/* Level / XP */}
        <div 
          onClick={() => onNavigateTab('prestasi')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-300 transition group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Lv. {activeProfile.level}
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-full">
            {activeProfile.xp} XP ⭐
          </span>
        </div>
      </div>

      {/* 4. SMART MURAJA'AH ALERT (IF ANY) */}
      {itemsNeedingMurajaah.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center text-xl shrink-0">
              🔁
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                {itemsNeedingMurajaah.length} Ayat Perlu Diulang Hari Ini
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Muraja'ah rutin membuat hafalan semakin kuat dan tidak mudah hilang.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('murajaah')}
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition shadow-md shadow-amber-500/20"
          >
            Mulai Muraja'ah
          </button>
        </div>
      )}

      {/* 5. DAILY QUESTS / MISI HARIAN */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Misi Harian & Tantangan
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('games')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua Game</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {quests.slice(0, 3).map((q) => (
            <div
              key={q.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                q.isCompleted
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{q.icon}</div>
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {q.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {q.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60">
                  +{q.xpReward} XP
                </span>
                {q.isCompleted ? (
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                  </div>
                ) : (
                  <button
                    onClick={() => completeQuest(q.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                  >
                    Kerjakan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. POPULAR SHORT SURAHS SHORTCUTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>📚</span>
            <span>Surat Pilihan Juz Amma</span>
          </h3>
          <button
            onClick={() => onNavigateTab('hafalan')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Buka Semua Surat (37 Surat)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {JUZ_30_SURAHS.slice(0, 4).map((s) => {
            const stats = getSurahProgressStats(s.id, s.totalAyat);
            return (
              <div
                key={s.id}
                onClick={() => onOpenSurah(s.id)}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition shadow-xs flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm flex items-center justify-center border border-emerald-200 dark:border-emerald-900">
                    {s.id}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                      {s.nameLatin}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {s.totalAyat} Ayat • {s.meaningId}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-arabic text-lg text-slate-800 dark:text-slate-200 font-bold">
                    {s.nameArabic}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.percentage}% Selesai
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. MOTIVATION OF THE DAY */}
      <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1.5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Mutiara Hadits
        </p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 italic">
          "Sebaik-baik kalian adalah orang yang mempelajari Al-Qur'an dan mengajarkannya."
        </p>
        <p className="text-[11px] text-slate-400 font-medium">
          (HR. Bukhari No. 5027)
        </p>
      </div>

      {/* Global Modals Mounted for Child Dashboard */}
      <MutabaahYaumiyahModal
        isOpen={isMutabaahModalOpen}
        onClose={() => setIsMutabaahModalOpen(false)}
        onOpenDzikir={() => setIsDzikirModalOpen(true)}
      />

      <DzikirDoaModal
        isOpen={isDzikirModalOpen}
        onClose={() => setIsDzikirModalOpen(false)}
      />

      <TikrarPlayerModal
        isOpen={isTikrarModalOpen}
        onClose={() => setIsTikrarModalOpen(false)}
        initialSurahId={targetSurah.id}
        initialAyah={nextAyahToLearn}
      />

      <TahfizTargetPlannerModal
        isOpen={isPlannerModalOpen}
        onClose={() => setIsPlannerModalOpen(false)}
      />

      <TahfizReportCardModal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
      />
    </div>
  );
};
