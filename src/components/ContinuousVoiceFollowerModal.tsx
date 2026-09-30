import React, { useState, useEffect, useRef } from 'react';
import { useKafa } from '../context/KafaContext';
import { Surah, Ayah } from '../types';
import { 
  getSurahSync, 
  fetchFullSurah, 
  getAllSurahCatalog,
  getAllJuzList,
  getAyahAudioUrlWithReciter,
  RECITERS_LIST
} from '../services/quranService';
import { soundEffects } from '../utils/soundEffects';
import { evaluateAyahVoiceRecitation, removeArabicHarakat, WordMatchStatus } from '../utils/arabicVoiceMatcher';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  Lock, 
  Unlock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight,
  Flame, 
  Check, 
  Play, 
  Pause, 
  Award,
  Sliders,
  SkipForward,
  BookOpen,
  Filter,
  CheckCheck,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ContinuousVoiceFollowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurahId?: number;
  initialAyahNumber?: number;
}

type SensitivityLevel = 'ramah_anak' | 'standar' | 'ketat';

export const ContinuousVoiceFollowerModal: React.FC<ContinuousVoiceFollowerModalProps> = ({
  isOpen,
  onClose,
  initialSurahId = 114,
  initialAyahNumber = 1,
}) => {
  const { addXP, triggerCelebration, activeProfile } = useKafa();

  // Selected Surah & Juz
  const [selectedJuz, setSelectedJuz] = useState<number>(() => (initialSurahId >= 78 ? 30 : 1));
  const [selectedSurahId, setSelectedSurahId] = useState<number>(initialSurahId || 114);
  const [selectedReciter, setSelectedReciter] = useState<string>('alafasy');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('ramah_anak');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [surah, setSurah] = useState<Surah>(() => {
    return getSurahSync(initialSurahId || 114) || {
      id: 114,
      nameId: 'An-Nas',
      nameLatin: 'An-Nas',
      nameArabic: 'الناس',
      translationName: 'Manusia',
      totalAyat: 6,
      revelationType: 'Makkiyah',
      juzNumber: 30,
      description: '',
      ayat: []
    };
  });
  const [isLoadingSurah, setIsLoadingSurah] = useState(false);

  // Active Ayah Index in the Surah
  const [activeAyahIndex, setActiveAyahIndex] = useState<number>(0);

  // Verse status tracker: Record<ayahNumber, 'pending' | 'active' | 'correct' | 'wrong'>
  const [ayahStatuses, setAyahStatuses] = useState<Record<number, 'pending' | 'active' | 'correct' | 'wrong'>>({});

  // Voice Engine State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<string>('Siap mendengarkan bacaanmu.');
  const [isWrongLocked, setIsWrongLocked] = useState<boolean>(false);
  const [consecutiveCount, setConsecutiveCount] = useState<number>(0);
  const [isSurahCompleted, setIsSurahCompleted] = useState<boolean>(false);

  // Audio Hint Sheikh State
  const [isPlayingSheikhHint, setIsPlayingSheikhHint] = useState<boolean>(false);
  const sheikhAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition reference & Auto-advance lock
  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef<boolean>(false);
  const activeAyahContainerRef = useRef<HTMLDivElement | null>(null);
  const isAdvancingRef = useRef<boolean>(false);
  const silenceTimeoutRef = useRef<any>(null);

  const catalogList = getAllSurahCatalog();
  const allJuzList = getAllJuzList();

  // Load surah data
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const initialIndex = Math.max(0, (initialAyahNumber || 1) - 1);

    const cached = getSurahSync(selectedSurahId);
    if (cached && cached.ayat && cached.ayat.length > 0) {
      setSurah(cached);
      setActiveAyahIndex(Math.min(initialIndex, cached.ayat.length - 1));
      initStatuses(cached, initialIndex);
    } else {
      setIsLoadingSurah(true);
      fetchFullSurah(selectedSurahId)
        .then((data) => {
          if (mounted) {
            setSurah(data);
            setActiveAyahIndex(Math.min(initialIndex, (data.ayat?.length || 1) - 1));
            initStatuses(data, initialIndex);
            setIsLoadingSurah(false);
          }
        })
        .catch(() => {
          if (mounted) setIsLoadingSurah(false);
        });
    }

    return () => {
      mounted = false;
      stopContinuousListening();
    };
  }, [selectedSurahId, isOpen, initialAyahNumber]);

  const initStatuses = (s: Surah, activeIdx = 0) => {
    const map: Record<number, 'pending' | 'active' | 'correct' | 'wrong'> = {};
    s.ayat.forEach((a, idx) => {
      map[a.ayahNumber] = idx === activeIdx ? 'active' : 'pending';
    });
    setAyahStatuses(map);
    setIsWrongLocked(false);
    setIsSurahCompleted(false);
    setConsecutiveCount(0);
    setLiveTranscript('');
  };

  // Scroll active ayah into view smoothly
  useEffect(() => {
    if (activeAyahContainerRef.current) {
      activeAyahContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeAyahIndex]);

  // Current active Ayah object
  const currentAyah = surah.ayat[activeAyahIndex] || surah.ayat[0] || {
    id: 1,
    surahId: selectedSurahId,
    ayahNumber: 1,
    textArabic: '',
    textLatin: '',
    translationId: '',
  };

  // Start continuous speech recognition
  const startContinuousListening = () => {
    setRecognitionError(null);
    setLiveTranscript('');
    shouldKeepListeningRef.current = true;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError(
        'Browser belum mendukung Web Speech API secara native. Anda bisa mencoba di Google Chrome / Microsoft Edge, atau gunakan tombol Simulasi Suara di bawah!'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA'; // Arabic Saudi Arabia
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        soundEffects.playListeningPing();
        setCurrentFeedback('🎤 Mikrofon aktif! Bacakan ayat yang ditandai hijau...');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentSpoken = (finalTranscript || interimTranscript).trim();
        if (currentSpoken) {
          setLiveTranscript(currentSpoken);
          const isFinal = Boolean(finalTranscript);
          handleEvaluateSpokenAyah(currentSpoken, isFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError('Izin mikrofon tidak diberikan. Silakan izinkan akses mikrofon di browser Anda.');
          shouldKeepListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // If user wants to keep reciting continuously, auto-restart speech recognition!
        if (shouldKeepListeningRef.current && isOpen && !isSurahCompleted) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setIsListening(false);
    }
  };

  const stopContinuousListening = () => {
    shouldKeepListeningRef.current = false;
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (sheikhAudioRef.current) {
      sheikhAudioRef.current.pause();
      setIsPlayingSheikhHint(false);
    }
    setIsListening(false);
  };

  // Evaluation logic:
  // 🟢 JIKA BENAR -> AYAT JALAN (Auto Advance ke ayat berikutnya)
  // 🔴 JIKA SALAH -> AYAT TIDAK JALAN (Terkunci merah di tempat sampai dibaca benar)
  const handleEvaluateSpokenAyah = (spokenText: string, isFinal = false) => {
    if (!currentAyah || isAdvancingRef.current) return;

    const evalResult = evaluateAyahVoiceRecitation(
      currentAyah.textArabic,
      currentAyah.textLatin,
      spokenText
    );

    // Apply sensitivity tolerance
    let passes = evalResult.isCorrect;
    if (sensitivity === 'ramah_anak') {
      passes = evalResult.score >= 50 || evalResult.isCorrect;
    } else if (sensitivity === 'ketat') {
      passes = evalResult.score >= 80;
    }

    if (passes) {
      // 🟢 JIKA BENAR: AYAT JALAN / LANJUT OTOMATIS KE AYAT BERIKUTNYA!
      isAdvancingRef.current = true;
      setIsWrongLocked(false);
      soundEffects.playCorrect();

      // Mark current ayah as correct
      setAyahStatuses((prev) => ({
        ...prev,
        [currentAyah.ayahNumber]: 'correct',
      }));

      setCurrentFeedback(`✨ Masya Allah Benar! Ayat ${currentAyah.ayahNumber} tuntas. Ayat meluncur maju... 🔓`);
      setConsecutiveCount((c) => c + 1);
      addXP(10, `Lancar Lisan Surat ${surah.nameLatin} Ayat ${currentAyah.ayahNumber}`);

      // Smooth brief transition before auto-scrolling to next ayah
      setTimeout(() => {
        if (activeAyahIndex + 1 < surah.ayat.length) {
          const nextIndex = activeAyahIndex + 1;
          setActiveAyahIndex(nextIndex);
          setLiveTranscript('');
          
          setAyahStatuses((prev) => ({
            ...prev,
            [surah.ayat[nextIndex].ayahNumber]: 'active',
          }));

          setCurrentFeedback(`🎤 Lanjutkan bacakan Ayat ${surah.ayat[nextIndex].ayahNumber}...`);
          isAdvancingRef.current = false;
        } else {
          // Entire surah completed!
          setIsSurahCompleted(true);
          soundEffects.playFanfare();
          triggerCelebration();
          addXP(50, `Khatam Lisan Berjalan Surat ${surah.nameLatin}!`);
          setCurrentFeedback(`🎉 Alhamdulillah! Seluruh ${surah.totalAyat} ayat Surat ${surah.nameLatin} berhasil dibaca tuntas!`);
          stopContinuousListening();
          isAdvancingRef.current = false;
        }
      }, 850);

    } else if (isFinal) {
      // 🔴 JIKA SALAH (DAN USER SUDAH SELESAI MENGUCAPKAN KALIMATNYA):
      // AYAT TERKUNCI & TIDAK AKAN JALAN!
      setIsWrongLocked(true);
      soundEffects.playIncorrect();

      setAyahStatuses((prev) => ({
        ...prev,
        [currentAyah.ayahNumber]: 'wrong',
      }));

      setCurrentFeedback(
        `⛔ BACAAN KELIRU / TERHENTI! Ayat ${currentAyah.ayahNumber} terkunci merah 🔒. Ayat tidak akan lanjut sampai kamu membacanya dengan tepat. Silakan ulangi ayat ini!`
      );
    }
  };

  // Sheikh Audio Hint
  const handlePlaySheikhHelp = (ayahNum?: number) => {
    const targetNum = ayahNum || currentAyah.ayahNumber;

    if (isPlayingSheikhHint && sheikhAudioRef.current) {
      sheikhAudioRef.current.pause();
      setIsPlayingSheikhHint(false);
      return;
    }

    const audioUrl = getAyahAudioUrlWithReciter(
      selectedReciter,
      selectedSurahId,
      targetNum
    );

    if (sheikhAudioRef.current) {
      sheikhAudioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    sheikhAudioRef.current = audio;
    setIsPlayingSheikhHint(true);
    audio.play().catch(() => {
      setIsPlayingSheikhHint(false);
    });

    audio.onended = () => {
      setIsPlayingSheikhHint(false);
    };
  };

  // Manual Skip (with gentle status)
  const handleSkipAyah = () => {
    if (activeAyahIndex + 1 < surah.ayat.length) {
      const nextIndex = activeAyahIndex + 1;
      setAyahStatuses((prev) => ({
        ...prev,
        [currentAyah.ayahNumber]: 'wrong',
        [surah.ayat[nextIndex].ayahNumber]: 'active',
      }));
      setActiveAyahIndex(nextIndex);
      setIsWrongLocked(false);
      setLiveTranscript('');
      setCurrentFeedback(`Ayat ${currentAyah.ayahNumber} dilewati. Silakan bacakan Ayat ${surah.ayat[nextIndex].ayahNumber}...`);
    }
  };

  // Reset to first verse
  const handleRestartSurah = () => {
    stopContinuousListening();
    setActiveAyahIndex(0);
    initStatuses(surah, 0);
    setLiveTranscript('');
    setCurrentFeedback('Telah direset ke Ayat 1. Tekan tombol mikrofon untuk mulai membaca!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[95vh] max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-950 text-white flex items-center justify-between shrink-0 shadow-lg border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shadow-inner border border-white/20">
                🎙️
              </div>
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  Mode Lisan Berjalan (Voice Follower)
                </span>
                <span className="text-xs text-amber-300 font-extrabold flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-amber-300" />
                  Benar = Jalan 🟢 | Salah = Berhenti 🔴
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5 flex items-center gap-2">
                <span>Surat {surah.nameLatin || surah.nameId}</span>
                <span className="font-arabic text-emerald-300 font-normal text-base sm:text-lg">({surah.nameArabic})</span>
                <span className="text-xs font-bold text-slate-300">({surah.totalAyat} Ayat)</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Surah Dropdown */}
            <div className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-2xl px-2.5 py-1 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              <select
                value={selectedSurahId}
                onChange={(e) => {
                  stopContinuousListening();
                  setSelectedSurahId(Number(e.target.value));
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                {catalogList.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                    {s.id}. {s.nameLatin} ({s.totalAyat} Ayat)
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Settings Modal */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-2xl border transition cursor-pointer ${
                showSettings 
                  ? 'bg-emerald-500 text-white border-emerald-400' 
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
              title="Pengaturan Mode Lisan (Toleransi & Qari)"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                stopContinuousListening();
                onClose();
              }}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SETTINGS DRAWER / COLLAPSIBLE */}
        {showSettings && (
          <div className="px-6 py-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-900 dark:text-emerald-300">Tingkat Ketelitian Suara:</span>
              <div className="inline-flex rounded-xl bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSensitivity('ramah_anak')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    sensitivity === 'ramah_anak'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  🌱 Ramah Anak (60%)
                </button>
                <button
                  onClick={() => setSensitivity('standar')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    sensitivity === 'standar'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  ⚖️ Standar (70%)
                </button>
                <button
                  onClick={() => setSensitivity('ketat')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    sensitivity === 'ketat'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  🎯 Teliti / Ujian (80%)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-700 dark:text-slate-300">Qari Bantuan Audio:</span>
              <select
                value={selectedReciter}
                onChange={(e) => setSelectedReciter(e.target.value)}
                className="py-1 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {RECITERS_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* REAL-TIME STATUS BAR */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-bold text-slate-500">Posisi Bacaan:</span>
            <span className="px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
              Ayat {activeAyahIndex + 1} dari {surah.totalAyat}
            </span>

            {isWrongLocked ? (
              <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-black animate-pulse border border-red-300 dark:border-red-800">
                <Lock className="w-3.5 h-3.5" />
                <span>Ayat Terhenti & Terkunci (Salah)</span>
              </span>
            ) : isListening ? (
              <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black border border-teal-300 dark:border-teal-800">
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mendengarkan Live (Hands-Free)</span>
              </span>
            ) : (
              <span className="text-slate-400 italic">Mikrofon belum diaktifkan</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-extrabold bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-xl border border-orange-200 dark:border-orange-900/50">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>{consecutiveCount} Ayat Lancar Berturut</span>
            </div>

            <button
              onClick={handleRestartSurah}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition font-bold px-2 py-1 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Ulangi dari Ayat 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK & TRANSCRIPT BANNER */}
        <div className={`px-5 sm:px-6 py-2.5 border-b text-xs transition-colors shrink-0 flex items-center justify-between gap-3 ${
          isWrongLocked 
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 font-medium'
            : isListening
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-medium'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
        }`}>
          <div className="flex items-center gap-2 truncate">
            {isWrongLocked ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
            ) : isListening ? (
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
            ) : (
              <MicOff className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="truncate font-semibold">{currentFeedback}</span>
          </div>

          {liveTranscript && (
            <div className="shrink-0 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 max-w-[240px] truncate text-[11px] font-bold shadow-xs">
              Terdengar: <span className="text-emerald-600 dark:text-emerald-400">"{liveTranscript}"</span>
            </div>
          )}
        </div>

        {/* SCROLLABLE QURAN AYAT LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-800 dark:text-slate-100 scroll-smooth">
          {isLoadingSurah ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold">Memuat Surat {surah.nameLatin || selectedSurahId}...</p>
            </div>
          ) : (
            surah.ayat.map((ayah, idx) => {
              const isActive = idx === activeAyahIndex;
              const status = ayahStatuses[ayah.ayahNumber] || (isActive ? 'active' : 'pending');
              const isCorrect = status === 'correct';
              const isWrong = isActive && isWrongLocked;

              return (
                <div
                  key={ayah.ayahNumber}
                  ref={isActive ? activeAyahContainerRef : null}
                  className={`p-5 sm:p-6 rounded-3xl border-2 transition-all duration-300 relative ${
                    isActive
                      ? isWrong
                        ? 'bg-rose-50/95 dark:bg-rose-950/40 border-rose-500 shadow-2xl shadow-rose-600/15 scale-[1.01] ring-4 ring-rose-500/20'
                        : 'bg-emerald-50/95 dark:bg-emerald-950/40 border-emerald-500 shadow-2xl shadow-emerald-600/15 scale-[1.01] ring-4 ring-emerald-500/20'
                      : isCorrect
                      ? 'bg-white dark:bg-slate-850 border-emerald-300 dark:border-emerald-800/80 opacity-90'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Status Ribbon Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                        isCorrect
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isWrong
                          ? 'bg-rose-600 text-white animate-bounce'
                          : isActive
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {ayah.ayahNumber}
                      </span>

                      <span className="text-xs font-black">
                        Ayat {ayah.ayahNumber}
                      </span>

                      {isActive && (
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          Target Sekarang
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lancar ✓ (Ayat Jalan)</span>
                        </span>
                      )}

                      {isWrong && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-extrabold text-xs border border-rose-300 dark:border-rose-800 animate-pulse">
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Terkunci 🔒 (Tidak Jalan)</span>
                        </span>
                      )}

                      {isActive && !isWrong && !isCorrect && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-extrabold text-xs animate-pulse border border-teal-300 dark:border-teal-800">
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                          <span>Silakan Baca Sekarang...</span>
                        </span>
                      )}

                      {/* Sheikh Help audio button */}
                      {isActive && (
                        <button
                          onClick={() => handlePlaySheikhHelp(ayah.ayahNumber)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                          title="Dengarkan bantuan bacaan Syaikh"
                        >
                          <Volume2 className={`w-3.5 h-3.5 text-emerald-600 ${isPlayingSheikhHint ? 'animate-pulse text-teal-600' : ''}`} />
                          <span className="hidden sm:inline">Bantuan Syaikh</span>
                        </button>
                      )}

                      {/* Skip button if stuck */}
                      {isActive && isWrong && (
                        <button
                          onClick={handleSkipAyah}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                          title="Lewati ayat ini jika sangat kesulitan"
                        >
                          <SkipForward className="w-3 h-3" />
                          <span className="hidden sm:inline">Lewati</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Arabic Text Display */}
                  <div className="text-right py-3">
                    <p className={`font-arabic text-2xl sm:text-3xl leading-loose select-none font-medium transition-colors ${
                      isWrong
                        ? 'text-rose-950 dark:text-rose-200'
                        : isCorrect
                        ? 'text-emerald-900 dark:text-emerald-200 font-semibold'
                        : isActive
                        ? 'text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {ayah.textArabic}
                    </p>
                  </div>

                  {/* Latin & Indonesian Translation */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                    <p className="text-xs sm:text-sm italic font-serif text-slate-700 dark:text-slate-300">
                      "{ayah.textLatin}"
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      {ayah.translationId}
                    </p>
                  </div>

                  {/* Wrong Ayah Explicit Instruction Box */}
                  {isWrong && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-100/90 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          <strong>Ayat tidak akan bergeser maju</strong> sampai kamu membaca lafadz ayat ini dengan tepat. Dengarkan bantuan Syaikh lalu ulangi lisanmu!
                        </span>
                      </div>
                      <button
                        onClick={() => handlePlaySheikhHelp(ayah.ayahNumber)}
                        className="shrink-0 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition cursor-pointer"
                      >
                        Dengar Syaikh 🔊
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Surah Khatam Banner */}
          {isSurahCompleted && (
            <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-center space-y-4 shadow-2xl animate-in zoom-in-95">
              <span className="text-5xl block animate-bounce">👑</span>
              <h3 className="text-2xl font-black">Alhamdulillah, Khatam Surat {surah.nameLatin}!</h3>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto leading-relaxed">
                Hebat sekali! Kamu berhasil membaca seluruh <strong>{surah.totalAyat} ayat</strong> secara berurutan dan mengalir dari awal hingga akhir dengan suaramu sendiri!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRestartSurah}
                  className="px-6 py-2.5 rounded-2xl bg-white text-emerald-800 font-black text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition cursor-pointer"
                >
                  Ulangi Surat Ini Sekali Lagi 🔄
                </button>

                {selectedSurahId < 114 && (
                  <button
                    onClick={() => {
                      setSelectedSurahId(selectedSurahId + 1);
                      setActiveAyahIndex(0);
                    }}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-900/60 hover:bg-emerald-900/80 text-white font-black text-xs sm:text-sm border border-white/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Lanjut Surat Berikutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLLER & DEMO BAR */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Main Continuous Mic Toggle Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                if (isListening) {
                  stopContinuousListening();
                } else {
                  startContinuousListening();
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition transform active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 ring-4 ring-rose-500/20 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Hentikan Mikrofon</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>Mulai Baca Berjalan (Hands-Free)</span>
                </>
              )}
            </button>

            {/* Quick Demonstration Simulation Buttons */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-extrabold text-slate-400 px-2 hidden sm:inline">
                Uji Coba:
              </span>

              <button
                onClick={() => handleEvaluateSpokenAyah(currentAyah.textArabic, true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold text-xs transition cursor-pointer border border-emerald-300/80"
                title="Simulasi: Suara membaca benar -> Ayat meluncur jalan ke ayat berikutnya"
              >
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Simulasi Benar (Ayat Jalan) 🟢</span>
              </button>

              <button
                onClick={() => handleEvaluateSpokenAyah("bacaan salah keliru", true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-extrabold text-xs transition cursor-pointer border border-rose-300/80"
                title="Simulasi: Suara membaca salah -> Ayat terkunci dan tidak jalan"
              >
                <Lock className="w-3.5 h-3.5 text-rose-700" />
                <span>Simulasi Salah (Ayat Berhenti) 🔴</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Benar = Jalan 🟢</span>
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
            <span>Salah = Tidak Jalan 🔴</span>
          </div>
        </div>
      </div>
    </div>
  );
};
