import React, { useState, useRef, useEffect } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  getSurahSync, 
  fetchFullSurah, 
  RECITERS_LIST, 
  getAyahAudioUrlWithReciter 
} from '../services/quranService';
import { Ayah, Surah } from '../types';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  Mic, 
  Sparkles, 
  CheckCircle2, 
  Target, 
  Repeat, 
  Sliders,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  Palette,
  BookMarked,
  Award,
  Layers,
  LayoutGrid,
  Search
} from 'lucide-react';
import { MemorizationStatus } from '../types';
import { TajweedGuideModal } from '../components/TajweedGuideModal';
import { MakharijulHurufModal } from '../components/MakharijulHurufModal';
import { TahfizCertificateModal } from '../components/TahfizCertificateModal';
import { TikrarPlayerModal } from '../components/TikrarPlayerModal';
import { getSurahTafsir } from '../data/tafsirData';

interface SurahDetailViewProps {
  surahId: number;
  onBack: () => void;
  onSelectSurah?: (surahId: number) => void;
  onOpenFocusStudy: (surahId: number, ayahNumber: number) => void;
  onOpenSetorModal: (surah: Surah, ayah: Ayah) => void;
  onOpenVoiceGate?: (surahId?: number, ayahNumber?: number) => void;
  onOpenContinuousVoice?: (surahId?: number, ayahNumber?: number) => void;
}

export const SurahDetailView: React.FC<SurahDetailViewProps> = ({
  surahId,
  onBack,
  onSelectSurah,
  onOpenFocusStudy,
  onOpenSetorModal,
  onOpenVoiceGate,
  onOpenContinuousVoice,
}) => {
  const { 
    activeProfile, 
    ayahProgressList, 
    updateAyahProgress, 
    getAyahProgress, 
    getSurahProgressStats,
    settings 
  } = useKafa();

  const [surah, setSurah] = useState<Surah>(() => {
    return getSurahSync(surahId) || {
      id: surahId,
      nameId: `Surat ${surahId}`,
      nameLatin: `Surat ${surahId}`,
      nameArabic: '',
      translationName: '',
      meaningId: '',
      totalAyat: 7,
      revelationType: 'Makkiyah',
      juzNumber: 1,
      description: '',
      ayat: [],
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Audio Player State & Reciter
  const [selectedReciterId, setSelectedReciterId] = useState<string>('alafasy');
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [currentRepeat, setCurrentRepeat] = useState<number>(1);
  const [showStatusMenuForAyah, setShowStatusMenuForAyah] = useState<number | null>(null);

  // View Options
  const [activeDetailTab, setActiveDetailTab] = useState<'ayat' | 'tafsir'>('ayat');
  const [viewMode, setViewMode] = useState<'card' | 'page'>('card');
  const [enableTajweedColors, setEnableTajweedColors] = useState<boolean>(true);
  const [ayahSearchQuery, setAyahSearchQuery] = useState<string>('');

  // Modals state
  const [isTajweedModalOpen, setIsTajweedModalOpen] = useState(false);
  const [isMakhrajModalOpen, setIsMakhrajModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isTikrarModalOpen, setIsTikrarModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentReciter = RECITERS_LIST.find((r) => r.id === selectedReciterId) || RECITERS_LIST[0];

  // Load full surah data (supports all 114 surahs across 30 Juz)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    // Initial sync populate
    const initial = getSurahSync(surahId);
    if (initial) {
      setSurah(initial);
      if (initial.ayat && initial.ayat.length > 0) {
        setIsLoading(false);
      }
    }

    // Fetch full data with ayat
    fetchFullSurah(surahId)
      .then((data) => {
        if (isMounted) {
          setSurah(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load full surah", err);
        if (isMounted) {
          setIsLoading(false);
          setLoadError("Gagal memuat sebagian data ayat dari server. Silakan coba kembali.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [surahId]);

  // Stop audio on unmount or surah change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [surahId]);

  const stats = getSurahProgressStats(surah.id, surah.totalAyat || surah.ayat.length);

  const playAyahAudio = (ayahNumber: number, isSequential = false) => {
    const ayah = surah.ayat.find((a) => a.ayahNumber === ayahNumber);
    if (!ayah) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = getAyahAudioUrlWithReciter(surahId, ayahNumber, currentReciter.folder);
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;
    setPlayingAyahNumber(ayahNumber);
    if (!isSequential) setIsPlayingAll(false);

    audio.play().catch(() => {
      // Audio playback catch
    });

    audio.onended = () => {
      if (currentRepeat < repeatCount) {
        setCurrentRepeat((prev) => prev + 1);
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setCurrentRepeat(1);
        if (isSequential && ayahNumber < surah.totalAyat) {
          playAyahAudio(ayahNumber + 1, true);
        } else {
          setPlayingAyahNumber(null);
          setIsPlayingAll(false);
        }
      }
    };
  };

  const togglePlayAll = () => {
    if (isPlayingAll || playingAyahNumber !== null) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAyahNumber(null);
      setIsPlayingAll(false);
    } else {
      setIsPlayingAll(true);
      playAyahAudio(1, true);
    }
  };

  const toggleSingleAyahPlay = (ayahNumber: number) => {
    if (playingAyahNumber === ayahNumber) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAyahNumber(null);
    } else {
      playAyahAudio(ayahNumber, false);
    }
  };

  const statusLabels: Record<MemorizationStatus, { label: string; bg: string; text: string; dot: string }> = {
    not_started: { label: 'Belum Dihafal', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
    in_progress: { label: 'Sedang Belajar', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
    almost_memorized: { label: 'Hampir Hafal', bg: 'bg-orange-100 dark:bg-orange-950/60', text: 'text-orange-800 dark:text-orange-300', dot: 'bg-orange-500' },
    memorized: { label: 'Sudah Hafal 🌟', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
    needs_murajaah: { label: 'Perlu Muraja\'ah 🔁', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
  };

  const filteredAyat = ayahSearchQuery.trim()
    ? surah.ayat.filter(
        (a) =>
          a.ayahNumber.toString() === ayahSearchQuery.trim() ||
          a.textLatin.toLowerCase().includes(ayahSearchQuery.toLowerCase()) ||
          a.translationId.toLowerCase().includes(ayahSearchQuery.toLowerCase())
      )
    : surah.ayat;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Top Bar with Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Daftar 114 Surat</span>
        </button>

        {/* Action badges: Tajweed, Makhraj, Cert */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenVoiceGate && (
            <button
              onClick={() => onOpenVoiceGate(surah.id, 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-sm transition hover:scale-105 cursor-pointer animate-pulse"
              title="Uji Lisan Real-Time & Gembok Lanjutan Ayat"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Uji Lisan Real-Time</span>
            </button>
          )}

          {onOpenContinuousVoice && (
            <button
              onClick={() => onOpenContinuousVoice(surahId, 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-xs font-black shadow-sm transition hover:scale-105 cursor-pointer ring-2 ring-emerald-400/30"
              title="Membaca Mengalir: Benar = Jalan 🟢 | Salah = Berhenti 🔴"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>Baca Berjalan</span>
            </button>
          )}

          <button
            onClick={() => setIsTikrarModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-sm transition hover:scale-105 cursor-pointer"
            title="Buka Mode Pengulang Tikrar Otomatis"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Mode Tikrar</span>
          </button>

          <button
            onClick={() => setIsTajweedModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition hover:scale-105 cursor-pointer"
            title="Buka Panduan Tajwid"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tajwid</span>
          </button>

          <button
            onClick={() => setIsMakhrajModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold transition hover:scale-105 cursor-pointer"
            title="Buka Peta Makharijul Huruf"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Makhraj</span>
          </button>

          <button
            onClick={() => setIsCertModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-extrabold transition hover:scale-105 cursor-pointer"
            title="Cetak Syahadah Tahfiz"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Syahadah</span>
          </button>

          {/* Prev & Next Surah Buttons */}
          <div className="flex items-center gap-1 ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
            {onSelectSurah && surahId > 1 && (
              <button
                onClick={() => onSelectSurah(surahId - 1)}
                className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                title="Surat Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {stats.memorized}/{surah.totalAyat} Ayat
            </div>

            {onSelectSurah && surahId < 114 && (
              <button
                onClick={() => onSelectSurah(surahId + 1)}
                className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                title="Surat Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Surah Banner Card */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden text-center space-y-4">
        {/* Background Islamic Motif */}
        <div className="absolute top-2 right-2 text-white/5 text-9xl font-arabic select-none pointer-events-none">
          {surah.nameArabic}
        </div>

        <div className="space-y-1 relative z-10">
          <span className="px-3.5 py-1 rounded-full bg-white/15 text-[11px] font-extrabold tracking-wider uppercase text-emerald-200 backdrop-blur-md inline-block">
            Surat Ke-{surah.id} • Juz {surah.juzNumber} • {surah.revelationType} • {surah.totalAyat} Ayat
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
            Surat {surah.nameLatin || surah.nameId}
          </h1>
          <div className="font-arabic text-4xl sm:text-5xl font-bold text-amber-300 py-1">
            {surah.nameArabic}
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-md mx-auto">
            "{surah.meaningId || surah.translationName}"
          </p>
        </div>

        {/* Bismillah Header (except Surah 9 At-Taubah) */}
        {surah.id !== 9 && (
          <div className="pt-3 border-t border-white/15 relative z-10">
            <p className="font-arabic text-2xl sm:text-3xl text-emerald-100 font-semibold tracking-wide">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        )}
      </div>

      {/* Syahadah Ready Callout if high progress */}
      {stats.percentage >= 80 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border-2 border-amber-400/60 dark:border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md">
              🏅
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Alhamdulillah! Hafalan Surat Ini Mencapai {stats.percentage}%
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Santri cilik {activeProfile.name} berhak mendapatkan Syahadah Tahfizul Qur'an!
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCertModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer shrink-0"
          >
            Buka Sertifikat
          </button>
        </div>
      )}

      {/* Tab Switcher: Ayat Al-Qur'an vs Tafsir & Tadabbur */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveDetailTab('ayat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeDetailTab === 'ayat'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Baca & Hafal Ayat ({surah.totalAyat} Ayat)</span>
        </button>

        <button
          onClick={() => setActiveDetailTab('tafsir')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeDetailTab === 'tafsir'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Tafsir & Asbabun Nuzul</span>
        </button>
      </div>

      {/* TAFSIR & TADABBUR VIEW */}
      {activeDetailTab === 'tafsir' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          {(() => {
            const tafsir = getSurahTafsir(surah.id);
            return (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center text-xl">
                      💡
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Kandungan & Mutiara Hikmah Surat {surah.nameLatin || surah.nameId}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Memahami makna membuat hafalan menancap kuat dan berbuah akhlak mulia
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsTikrarModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Mulai Mode Tikrar</span>
                  </button>
                </div>

                {/* Tema Pokok */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-1.5">
                  <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                    🌟 Tema Utama Surat
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {tafsir.theme}
                  </p>
                </div>

                {/* Asbabun Nuzul */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 space-y-1.5">
                  <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    📜 Asbabun Nuzul (Sebab Turunnya Surat)
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {tafsir.asbabunNuzul}
                  </p>
                </div>

                {/* Key Lessons */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    💎 Pelajaran & Hikmah Penting untuk Santri:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tafsir.keyLessons.map((lesson, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{lesson}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Moral Virtue */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/80 space-y-1">
                  <h4 className="text-xs font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                    🌸 Keutamaan Mengamalkan Kandungannya
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {tafsir.moralVirtue}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Sticky Audio & View Mode Control Bar (Visible when activeDetailTab === 'ayat') */}
      {activeDetailTab === 'ayat' && (
      <>
      <div className="sticky top-18 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Play All / Pause button */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayAll}
              disabled={isLoading || surah.ayat.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs transition shadow-sm cursor-pointer disabled:opacity-50 ${
                isPlayingAll
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isPlayingAll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlayingAll ? 'Jeda Murottal' : 'Putar Seluruh Surat'}</span>
            </button>

            {/* Reciter Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <select
                value={selectedReciterId}
                onChange={(e) => {
                  setSelectedReciterId(e.target.value);
                  if (playingAyahNumber) {
                    if (audioRef.current) audioRef.current.pause();
                    setPlayingAyahNumber(null);
                  }
                }}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
              >
                {RECITERS_LIST.map((rec) => (
                  <option key={rec.id} value={rec.id} className="dark:bg-slate-900">
                    🎙️ {rec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode & Repetition & Speed */}
          <div className="flex items-center gap-2 text-xs">
            {/* View Mode Switch (Card vs Continuous Mushaf Page) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-500'
                }`}
                title="Tampilan Kartu Interaktif"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('page')}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === 'page'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-500'
                }`}
                title="Tampilan Lembar Mushaf Standar"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            {/* Repeat Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Repeat className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={repeatCount}
                onChange={(e) => setRepeatCount(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-hidden cursor-pointer"
              >
                <option value={1}>1x</option>
                <option value={3}>3x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
              </select>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-hidden cursor-pointer"
              >
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Ayah / Filter row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor ayat atau terjemahan..."
              value={ayahSearchQuery}
              onChange={(e) => setAyahSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Qari: <strong className="text-emerald-700 dark:text-emerald-400">{currentReciter.name.split(' ')[0]}</strong>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && surah.ayat.length === 0 && (
        <div className="py-16 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Memuat Mushaf & Teks Arab Surat {surah.nameLatin || surah.nameId}...
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Menghubungkan dengan database standar Kemenag RI 30 Juz & Audio Syaikh.
          </p>
        </div>
      )}

      {/* MODE 1: Continuous Mushaf Page View */}
      {viewMode === 'page' && !isLoading && (
        <div className="bg-[#fffdf8] dark:bg-slate-900/90 rounded-3xl p-6 sm:p-10 border-4 border-emerald-600/20 shadow-xl space-y-6">
          <div className="text-center pb-4 border-b border-amber-200/60 dark:border-slate-800">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              TAMPILAN LEMBAR MUSHAF AL-QUR'AN
            </span>
          </div>

          <div className="font-arabic text-3xl sm:text-4xl leading-[2.6] sm:leading-[2.8] text-slate-900 dark:text-slate-100 text-justify dir-rtl">
            {filteredAyat.map((ayah) => {
              const isPlayingThis = playingAyahNumber === ayah.ayahNumber;
              return (
                <span
                  key={ayah.ayahNumber}
                  onClick={() => toggleSingleAyahPlay(ayah.ayahNumber)}
                  className={`cursor-pointer px-1 py-0.5 rounded-lg transition ${
                    isPlayingThis
                      ? 'bg-amber-300/40 text-emerald-900 dark:text-amber-300 font-bold'
                      : 'hover:bg-emerald-100/50 dark:hover:bg-slate-800'
                  }`}
                  title={`Klik untuk memutar Ayat ${ayah.ayahNumber}`}
                >
                  {ayah.textArabic}
                  <span className="inline-flex items-center justify-center font-sans text-xs sm:text-sm mx-1.5 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 select-none">
                    {ayah.ayahNumber}
                  </span>
                </span>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 font-medium">
            💡 Tips: Klik potongan ayat mana saja di atas untuk mendengarkan bacaan Syaikh secara langsung.
          </div>
        </div>
      )}

      {/* MODE 2: Card View (Default Interactive) */}
      {viewMode === 'card' && (
        <div className="space-y-4">
          {filteredAyat.map((ayah) => {
            const progress = getAyahProgress(surah.id, ayah.ayahNumber);
            const status = progress ? progress.status : 'not_started';
            const isPlayingThis = playingAyahNumber === ayah.ayahNumber;
            const statusStyle = statusLabels[status];

            return (
              <div
                key={ayah.ayahNumber}
                id={`ayah-${ayah.ayahNumber}`}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-xs space-y-4 ${
                  isPlayingThis
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Header inside card: Ayah badge, status pill, audio trigger */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
                      {ayah.ayahNumber}
                    </div>

                    {/* Status badge */}
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusMenuForAyah(showStatusMenuForAyah === ayah.ayahNumber ? null : ayah.ayahNumber)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                        <span>{statusStyle.label}</span>
                      </button>

                      {/* Status change dropdown */}
                      {showStatusMenuForAyah === ayah.ayahNumber && (
                        <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-20">
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                            Tandai Status Hafalan
                          </div>
                          {(['not_started', 'in_progress', 'almost_memorized', 'memorized', 'needs_murajaah'] as MemorizationStatus[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => {
                                updateAyahProgress(surah.id, ayah.ayahNumber, st);
                                setShowStatusMenuForAyah(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
                            >
                              <span className={`w-2 h-2 rounded-full ${statusLabels[st].dot}`} />
                              <span>{statusLabels[st].label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick actions: Play audio */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSingleAyahPlay(ayah.ayahNumber)}
                      className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isPlayingThis
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title={`Putar Suara ${currentReciter.name}`}
                    >
                      {isPlayingThis ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      <span className="hidden sm:inline">{isPlayingThis ? 'Jeda' : 'Dengar'}</span>
                    </button>
                  </div>
                </div>

                {/* Arabic Uthmani Text */}
                <div className="text-right py-2">
                  <p className="font-arabic text-2xl sm:text-3xl lg:text-4xl leading-[2.2] sm:leading-[2.4] text-slate-900 dark:text-slate-100 tracking-wide font-normal">
                    {ayah.textArabic}
                    <span className="inline-flex items-center justify-center font-sans text-sm sm:text-base mx-2 w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold">
                      {ayah.ayahNumber}
                    </span>
                  </p>
                </div>

                {/* Transliteration (Latin) */}
                <div className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 italic">
                  {ayah.textLatin}
                </div>

                {/* Indonesian Meaning */}
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  "{ayah.translationId}"
                </div>

                {/* Bottom Action buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenFocusStudy(surah.id, ayah.ayahNumber)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mode Fokus</span>
                    </button>

                    {onOpenVoiceGate && (
                      <button
                        onClick={() => onOpenVoiceGate(surah.id, ayah.ayahNumber)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-xs font-extrabold transition cursor-pointer"
                        title="Uji Lisan Real-Time untuk Ayat Ini"
                      >
                        <Mic className="w-3.5 h-3.5 text-amber-600" />
                        <span>🎤 Uji Lisan</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenSetorModal(surah, ayah)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-sm transition transform active:scale-95 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Setor Hafalan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Global Modals */}
      <TajweedGuideModal
        isOpen={isTajweedModalOpen}
        onClose={() => setIsTajweedModalOpen(false)}
      />

      <MakharijulHurufModal
        isOpen={isMakhrajModalOpen}
        onClose={() => setIsMakhrajModalOpen(false)}
      />

      <TahfizCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        surahName={surah.nameLatin || surah.nameId}
        surahId={surah.id}
        juzNumber={surah.juzNumber}
        score={stats.percentage > 0 ? Math.max(90, stats.percentage) : 95}
      />

      <TikrarPlayerModal
        isOpen={isTikrarModalOpen}
        onClose={() => setIsTikrarModalOpen(false)}
        initialSurahId={surah.id}
        initialAyah={1}
      />
    </div>
  );
};
