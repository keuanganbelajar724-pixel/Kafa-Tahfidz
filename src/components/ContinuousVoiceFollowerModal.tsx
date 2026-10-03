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
import { 
  evaluateAyahVoiceRecitation, 
  removeArabicHarakat, 
  WordMatchStatus, 
  MatchSensitivity 
} from '../utils/arabicVoiceMatcher';
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
  ChevronRight,
  ChevronLeft,
  Flame, 
  Check, 
  Play, 
  Pause, 
  Award,
  Sliders,
  SkipForward,
  BookOpen,
  Eye,
  EyeOff,
  Clock,
  Layers,
  Zap,
  HelpCircle,
  Trophy,
  ArrowRight
} from 'lucide-react';

interface ContinuousVoiceFollowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurahId?: number;
  initialAyahNumber?: number;
}

export type TarteelDisplayMode = 'blind_hidden' | 'first_word' | 'open_text';
export type SensitivityLevel = 'ramah_anak' | 'standar' | 'ketat';

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
  
  // Tarteel Modes
  const [displayMode, setDisplayMode] = useState<TarteelDisplayMode>('blind_hidden');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('ketat'); // Default strict for accurate memorization
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Peek Hint Timer (Intip Ayat selama 4 detik)
  const [isPeekingCurrentAyah, setIsPeekingCurrentAyah] = useState<boolean>(false);
  const [peekCountdown, setPeekCountdown] = useState<number>(0);
  const peekTimerRef = useRef<any>(null);

  // Surah Data
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
  const [currentFeedback, setCurrentFeedback] = useState<string>('Tekan tombol Mikrofon untuk mulai hafalan ala Tarteel AI...');
  const [isWrongLocked, setIsWrongLocked] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<{
    wordIndex: number;
    expectedWord: string;
    expectedClean: string;
    heardWord?: string;
  } | null>(null);

  // Session Stats
  const [sessionStartTime] = useState<number>(Date.now());
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [totalMemorizedInSession, setTotalMemorizedInSession] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [isSurahCompleted, setIsSurahCompleted] = useState<boolean>(false);

  // Audio Hint Sheikh State
  const [isPlayingSheikhHint, setIsPlayingSheikhHint] = useState<boolean>(false);
  const sheikhAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition reference & Auto-advance lock
  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef<boolean>(false);
  const activeAyahContainerRef = useRef<HTMLDivElement | null>(null);
  const isAdvancingRef = useRef<boolean>(false);

  const catalogList = getAllSurahCatalog();
  const allJuzList = getAllJuzList();

  // Timer for session duration
  useEffect(() => {
    if (!isOpen || isSurahCompleted) return;
    const interval = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isSurahCompleted]);

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
      if (peekTimerRef.current) clearInterval(peekTimerRef.current);
    };
  }, [selectedSurahId, isOpen, initialAyahNumber]);

  const initStatuses = (s: Surah, activeIdx = 0) => {
    const map: Record<number, 'pending' | 'active' | 'correct' | 'wrong'> = {};
    s.ayat.forEach((a, idx) => {
      map[a.ayahNumber] = idx === activeIdx ? 'active' : 'pending';
    });
    setAyahStatuses(map);
    setIsWrongLocked(false);
    setErrorDetail(null);
    setIsSurahCompleted(false);
    setConsecutiveCorrect(0);
    setTotalMemorizedInSession(0);
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
        'Browser belum mengizinkan Web Speech API secara native. Gunakan Google Chrome / Edge atau uji dengan tombol "Simulasi Lisan" di samping!'
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
        setCurrentFeedback(
          displayMode === 'blind_hidden'
            ? `🎙️ Tarteel AI aktif mendengarkan! Bacakan Ayat ${currentAyah.ayahNumber} dari ingatanmu...`
            : `🎙️ Tarteel AI aktif mendengarkan! Bacakan Ayat ${currentAyah.ayahNumber}...`
        );
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
          setRecognitionError('Izin mikrofon belum aktif. Izinkan akses mikrofon di browser Anda untuk mendeteksi hafalan suara.');
          shouldKeepListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Tarteel Continuous Loop: If user hasn't stopped, keep listening continuously
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

  // Evaluation logic: 100% accurate word-by-word Tashih
  // 🟢 JIKA BENAR -> AYAT TERBUKA & MELUNCUR MAJU KE AYAT BERIKUTNYA
  // 🔴 JIKA SALAH KATA ATAU HURUF -> TERKUNCI & TIDAK LANJUT SAMPAI DIBENARKAN
  const handleEvaluateSpokenAyah = (spokenText: string, isFinal = false) => {
    if (!currentAyah || isAdvancingRef.current) return;

    const matchSens: MatchSensitivity = sensitivity === 'ketat' ? 'strict' : sensitivity === 'standar' ? 'standard' : 'lenient';
    const evalResult = evaluateAyahVoiceRecitation(
      currentAyah.textArabic,
      currentAyah.textLatin,
      spokenText,
      matchSens
    );

    // Strictly require evalResult.isCorrect to pass!
    // Never bypass if middle words or letters are incorrect!
    if (evalResult.isCorrect) {
      // 🟢 JIKA BENAR:
      // 1. Ayat terbuka dengan kilau hijau
      // 2. Play success chime
      // 3. Auto advance ke ayat berikutnya tanpa batas 5 ayat
      isAdvancingRef.current = true;
      setIsWrongLocked(false);
      setErrorDetail(null);
      soundEffects.playCorrect();

      // Mark current ayah as correct
      setAyahStatuses((prev) => ({
        ...prev,
        [currentAyah.ayahNumber]: 'correct',
      }));

      setTotalMemorizedInSession((c) => c + 1);
      setConsecutiveCorrect((c) => c + 1);
      addXP(15, `Hafalan Tarteel AI: Surat ${surah.nameLatin} Ayat ${currentAyah.ayahNumber}`);

      setCurrentFeedback(`✨ Masya Allah Tepat & Fasih! Ayat ${currentAyah.ayahNumber} terbuka 🔓`);

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

          setCurrentFeedback(`🎤 Sambung hafalanmu ke Ayat ${surah.ayat[nextIndex].ayahNumber}...`);
          isAdvancingRef.current = false;
        } else {
          // Entire surah completed! No 5-ayah limit!
          setIsSurahCompleted(true);
          soundEffects.playFanfare();
          triggerCelebration();
          addXP(100, `Khatam Hafalan Surat ${surah.nameLatin} ala Tarteel AI!`);
          setCurrentFeedback(`🎉 Alhamdulillah! Seluruh ${surah.totalAyat} ayat Surat ${surah.nameLatin} tuntas dihafal!`);
          stopContinuousListening();
          isAdvancingRef.current = false;
        }
      }, 950);

    } else if (isFinal) {
      // 🔴 JIKA SALAH KATA/HURUF DAN SUDAH SELESAI BICARA:
      // Ayat terkunci merah, beri tahu kata yang salah, TIDAK AKAN MAJU!
      setIsWrongLocked(true);
      setErrorDetail(evalResult.errorDetail || null);
      soundEffects.playIncorrect();

      setAyahStatuses((prev) => ({
        ...prev,
        [currentAyah.ayahNumber]: 'wrong',
      }));

      setCurrentFeedback(evalResult.feedbackMessage);
    }
  };

  // Peek Feature: Intip Ayat selama 4 detik lalu sembunyikan kembali
  const handleTriggerPeek = () => {
    if (isPeekingCurrentAyah) return;
    setIsPeekingCurrentAyah(true);
    setPeekCountdown(4);

    if (peekTimerRef.current) clearInterval(peekTimerRef.current);
    peekTimerRef.current = setInterval(() => {
      setPeekCountdown((c) => {
        if (c <= 1) {
          clearInterval(peekTimerRef.current);
          setIsPeekingCurrentAyah(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
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

    audio.onplay = () => setIsPlayingSheikhHint(true);
    audio.onended = () => setIsPlayingSheikhHint(false);
    audio.onerror = () => setIsPlayingSheikhHint(false);

    audio.play().catch(() => setIsPlayingSheikhHint(false));
  };

  // Test simulation buttons for quick testing
  const handleSimulateRecitation = (type: 'correct' | 'wrong_word' | 'ending_only') => {
    if (!currentAyah) return;

    if (type === 'correct') {
      setLiveTranscript(currentAyah.textArabic);
      handleEvaluateSpokenAyah(currentAyah.textArabic, true);
    } else if (type === 'wrong_word') {
      // Intentionally substitute a word in the middle
      const words = currentAyah.textArabic.split(' ');
      if (words.length > 2) {
        words[1] = 'الظالمين'; // intentionally wrong middle word
      }
      const fakeText = words.join(' ');
      setLiveTranscript(fakeText);
      handleEvaluateSpokenAyah(fakeText, true);
    } else if (type === 'ending_only') {
      // Only the last word (rhyme only)
      const words = currentAyah.textArabic.split(' ');
      const lastWord = words[words.length - 1];
      setLiveTranscript(lastWord);
      handleEvaluateSpokenAyah(lastWord, true);
    }
  };

  // Manual Skip
  const handleSkipAyah = () => {
    if (activeAyahIndex + 1 < surah.ayat.length) {
      const nextIndex = activeAyahIndex + 1;
      setActiveAyahIndex(nextIndex);
      setAyahStatuses((prev) => ({
        ...prev,
        [currentAyah.ayahNumber]: 'wrong',
        [surah.ayat[nextIndex].ayahNumber]: 'active',
      }));
      setIsWrongLocked(false);
      setErrorDetail(null);
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
    setCurrentFeedback('Telah direset ke Ayat 1. Tekan tombol Mikrofon untuk mulai menghafal!');
  };

  // Format session time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[95vh] max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER: TARTEEL AI BRANDING & NAVIGATION */}
        <div className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between shrink-0 shadow-lg border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            {/* Tarteel Logo & Animated Mic */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 font-bold overflow-hidden">
                <span className="text-xl">🎙️</span>
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
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Tarteel AI Hafalan Qur'an
                </span>
                <span className="text-xs text-amber-300 font-extrabold hidden sm:flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-amber-300" />
                  Deteksi Suara Real-Time • Tanpa Batas Ayat
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Surat {surah.nameLatin || surah.nameId}</span>
                  <span className="font-arabic text-emerald-300 font-normal text-base sm:text-lg">({surah.nameArabic})</span>
                </h2>
                <span className="text-xs font-bold text-slate-300">
                  • Ayat {activeAyahIndex + 1} dari {surah.totalAyat}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Selectors & Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Juz Selector */}
            <div className="hidden lg:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-2xl px-2.5 py-1 text-xs">
              <span className="text-emerald-300 font-bold">Juz:</span>
              <select
                value={selectedJuz}
                onChange={(e) => {
                  const jNum = Number(e.target.value);
                  setSelectedJuz(jNum);
                  const surahsInJuz = catalogList.filter((s) => s.juzNumber === jNum);
                  if (surahsInJuz.length > 0) {
                    stopContinuousListening();
                    setSelectedSurahId(surahsInJuz[0].id);
                  }
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                {allJuzList.map((j) => (
                  <option key={j.juzNumber} value={j.juzNumber} className="text-slate-900 bg-white">
                    Juz {j.juzNumber} ({j.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Surah Selector */}
            <div className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-2xl px-2.5 py-1 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              <select
                value={selectedSurahId}
                onChange={(e) => {
                  stopContinuousListening();
                  setSelectedSurahId(Number(e.target.value));
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs max-w-[140px] truncate"
              >
                {catalogList.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                    {s.id}. {s.nameLatin} ({s.totalAyat} Ayat)
                  </option>
                ))}
              </select>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-2xl border transition cursor-pointer ${
                showSettings 
                  ? 'bg-emerald-500 text-white border-emerald-400' 
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
              title="Pengaturan Mode Tarteel (Sembunyi Ayat, Sensitivitas Tashih & Qari)"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Close Button */}
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

        {/* TARTEEL CONTROL BAR: 3 DISPLAY MODES & LIVE WAVEFORM */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Display Mode Tabs (like Tarteel) */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={() => setDisplayMode('blind_hidden')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                displayMode === 'blind_hidden'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ayat disembunyikan. Terbuka otomatis saat dibaca benar!"
            >
              <EyeOff className="w-3.5 h-3.5 text-emerald-300" />
              <span>Sembunyikan Ayat (Hafalan)</span>
            </button>

            <button
              onClick={() => setDisplayMode('first_word')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                displayMode === 'first_word'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hanya kata pertama yang tampak untuk memicu ingatan"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-300" />
              <span>Kata Pertama Saja</span>
            </button>

            <button
              onClick={() => setDisplayMode('open_text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                displayMode === 'open_text'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Teks terbuka penuh, disorot secara live saat dibaca"
            >
              <Eye className="w-3.5 h-3.5 text-blue-300" />
              <span>Teks Terbuka (Mushaf)</span>
            </button>
          </div>

          {/* Audio Waveform & Status Indicator */}
          <div className="flex items-center gap-4">
            {/* Live Animated Waveform */}
            <div className="flex items-center gap-1 h-6 px-2 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <span className={`w-1 rounded-full transition-all duration-150 ${isListening ? 'h-5 bg-emerald-400 animate-pulse' : 'h-1.5 bg-slate-600'}`} />
              <span className={`w-1 rounded-full transition-all duration-200 ${isListening ? 'h-3.5 bg-teal-400 animate-bounce' : 'h-1.5 bg-slate-600'}`} />
              <span className={`w-1 rounded-full transition-all duration-150 ${isListening ? 'h-6 bg-emerald-300 animate-pulse' : 'h-1.5 bg-slate-600'}`} />
              <span className={`w-1 rounded-full transition-all duration-300 ${isListening ? 'h-4 bg-teal-300 animate-bounce' : 'h-1.5 bg-slate-600'}`} />
              <span className={`w-1 rounded-full transition-all duration-150 ${isListening ? 'h-2 bg-emerald-400 animate-pulse' : 'h-1.5 bg-slate-600'}`} />
              <span className="text-[10px] font-bold text-slate-300 ml-1">
                {isListening ? 'Mendengarkan...' : 'Siaga'}
              </span>
            </div>

            {/* Session Stats */}
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatTime(sessionSeconds)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Award className="w-3.5 h-3.5" />
                {totalMemorizedInSession} Terhafal
              </span>
            </div>
          </div>
        </div>

        {/* SETTINGS DRAWER (Sensitivitas, Qari, Toleransi) */}
        {showSettings && (
          <div className="px-6 py-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-emerald-950 dark:text-emerald-300">Akurasi & Tashih AI:</span>
              <div className="inline-flex rounded-xl bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSensitivity('ketat')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    sensitivity === 'ketat'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                  title="Wajib tepat seluruh huruf & kata (Akurasi 90%+ ala Tarteel Strict)"
                >
                  🎯 Ujian Ketat (Tarteel 90%+)
                </button>
                <button
                  onClick={() => setSensitivity('standar')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    sensitivity === 'standar'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                  title="Akurasi standar seimbang (80%)"
                >
                  ⚖️ Standar (80%)
                </button>
                <button
                  onClick={() => setSensitivity('ramah_anak')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    sensitivity === 'ramah_anak'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                  title="Toleransi pengucapan anak-anak pemula (70%)"
                >
                  👶 Ramah Santri Cilik (70%)
                </button>
              </div>
            </div>

            {/* Reciter for Audio Reference */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-950 dark:text-emerald-300">Ustadz / Qari:</span>
              <select
                value={selectedReciter}
                onChange={(e) => setSelectedReciter(e.target.value)}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none"
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

        {/* PRIMARY ACTION BAR: MIC TOGGLE & PEEK BUTTON */}
        <div className="px-5 sm:px-6 py-3 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          {/* Mic Button & Start Reciting */}
          <div className="flex items-center gap-3">
            <button
              onClick={isListening ? stopContinuousListening : startContinuousListening}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-sm shadow-md transition transform active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/20 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white ring-4 ring-emerald-500/20'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 text-rose-200" />
                  <span>Jeda Mikrofon</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-amber-300 animate-bounce" />
                  <span>Mulai Hafalan Suara 🎙️</span>
                </>
              )}
            </button>

            {/* PEEK BUTTON (Intip Ayat - Tarteel Signature Feature) */}
            {displayMode === 'blind_hidden' && (
              <button
                onClick={handleTriggerPeek}
                disabled={isPeekingCurrentAyah}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer border ${
                  isPeekingCurrentAyah
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-700'
                }`}
                title="Intip ayat selama 4 detik jika lupa hafalan"
              >
                <Eye className="w-4 h-4 text-amber-500" />
                <span>
                  {isPeekingCurrentAyah ? `Mengintip (${peekCountdown}s)...` : 'Intip Ayat (4 Detik)'}
                </span>
              </button>
            )}

            {/* Listen to Sheikh */}
            <button
              onClick={() => handlePlaySheikhHelp()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-800 dark:text-teal-300 text-xs font-bold transition border border-teal-200 dark:border-teal-800 cursor-pointer"
              title="Dengarkan murottal Ustadz sebagai panduan makhraj"
            >
              <Volume2 className={`w-4 h-4 text-teal-600 ${isPlayingSheikhHint ? 'animate-pulse' : ''}`} />
              <span>{isPlayingSheikhHint ? 'Hentikan Audio' : 'Dengar Ustadz'}</span>
            </button>
          </div>

          {/* Quick Simulation Menu (For Fast Testing or Desktop Browsers) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 hidden xl:inline">Uji Coba:</span>
            <button
              onClick={() => handleSimulateRecitation('correct')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold transition border border-emerald-300 dark:border-emerald-800 cursor-pointer"
              title="Simulasikan bacaan benar: ayat terbuka & lanjut otomatis"
            >
              ▶️ Baca Benar (Buka Ayat)
            </button>

            <button
              onClick={() => handleSimulateRecitation('wrong_word')}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-800 dark:text-rose-300 text-[11px] font-bold transition border border-rose-300 dark:border-rose-800 cursor-pointer"
              title="Simulasikan salah kata tengah: terkunci & beri koreksi"
            >
              ▶️ Salah Kata (Terkunci)
            </button>

            <button
              onClick={() => handleSimulateRecitation('ending_only')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-[11px] font-bold transition border border-amber-300 dark:border-amber-800 cursor-pointer"
              title="Simulasikan hanya baca akhiran: harus ditolak tidak boleh lanjut"
            >
              ▶️ Baca Akhir Saja (Tolak)
            </button>

            <button
              onClick={handleRestartSurah}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              title="Reset ke Ayat 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FEEDBACK & TRANSCRIPT BANNER */}
        <div className={`px-5 sm:px-6 py-2.5 border-b text-xs transition-colors shrink-0 flex items-center justify-between gap-3 ${
          isWrongLocked 
            ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
            : isListening
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
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
            <div className="shrink-0 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 max-w-[280px] truncate text-[11px] font-bold shadow-xs">
              Terdengar: <span className="text-emerald-600 dark:text-emerald-400">"{liveTranscript}"</span>
            </div>
          )}
        </div>

        {/* ERROR DIAGNOSTICS CARD (If User Made a Mistake) */}
        {isWrongLocked && errorDetail && (
          <div className="px-5 sm:px-6 py-3 bg-rose-100/90 dark:bg-rose-950/70 border-b border-rose-300 dark:border-rose-800 text-xs shrink-0 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-150">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-rose-900 dark:text-rose-200">
                  🔴 KOREKSI KATA KE-{errorDetail.wordIndex + 1}:
                </span>
                <span className="font-arabic font-bold text-base text-rose-950 dark:text-white bg-white/70 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-rose-300">
                  {errorDetail.expectedWord}
                </span>
                {errorDetail.heardWord && (
                  <span className="text-rose-700 dark:text-rose-300">
                    (Yang diucapkan: <span className="font-bold underline">"{errorDetail.heardWord}"</span>)
                  </span>
                )}
              </div>
              <p className="text-rose-800 dark:text-rose-300 text-[11px]">
                Ayat terkunci dan tidak akan lanjut sampai kamu membacakan seluruh ayat dari awal sampai akhir dengan makhraj yang tepat.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlaySheikhHelp(currentAyah.ayahNumber)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-rose-900 dark:text-rose-200 font-bold border border-rose-300 hover:bg-rose-50 transition cursor-pointer"
              >
                🔊 Dengarkan Contoh Benar
              </button>
              <button
                onClick={handleSkipAyah}
                className="px-3 py-1.5 rounded-xl bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-bold hover:bg-rose-300 transition cursor-pointer"
              >
                Lewati Ayat Ini
              </button>
            </div>
          </div>
        )}

        {/* SCROLLABLE QURAN AYAT LIST (TARTEEL AI REVEAL & BLIND MECHANIC) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-800 dark:text-slate-100 scroll-smooth">
          {isLoadingSurah ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold">Memuat Surat {surah.nameLatin || selectedSurahId}...</p>
            </div>
          ) : isSurahCompleted ? (
            /* KHATAM / COMPLETED SCREEN */
            <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center text-5xl">
                  🏆
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest font-black px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                  🎉 Khatam Hafalan Surat
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Alhamdulillah! Selesai Surat {surah.nameLatin}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Masya Allah, seluruh {surah.totalAyat} ayat berhasil kamu hafal dan lafalkan dengan tartil dan lancar!
                </p>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Ayat Terhafal</span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{surah.totalAyat} / {surah.totalAyat}</p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Durasi Hafalan</span>
                  <p className="text-xl font-black text-teal-600 dark:text-teal-400">{formatTime(sessionSeconds)}</p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Bonus XP</span>
                  <p className="text-xl font-black text-amber-500">+100 XP</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={handleRestartSurah}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-sm transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ulangi Surat Ini</span>
                </button>

                {selectedSurahId < 114 && (
                  <button
                    onClick={() => {
                      setSelectedSurahId((id) => id + 1);
                      setActiveAyahIndex(0);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                  >
                    <span>Lanjut Surat Berikutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            surah.ayat.map((ayah, idx) => {
              const isActive = idx === activeAyahIndex;
              const status = ayahStatuses[ayah.ayahNumber] || (isActive ? 'active' : 'pending');
              const isCorrect = status === 'correct';
              const isWrong = isActive && isWrongLocked;

              // Determine text visibility based on displayMode
              // In Blind mode:
              // - If correct: ALWAYS VISIBLE (revealed)
              // - If active & peeking: VISIBLE
              // - If not correct & hidden mode: VEILED / CONCEALED
              const isHidden = 
                displayMode === 'blind_hidden' && 
                !isCorrect && 
                !(isActive && isPeekingCurrentAyah);

              const isFirstWordOnly = 
                displayMode === 'first_word' && 
                !isCorrect && 
                !(isActive && isPeekingCurrentAyah);

              const words = ayah.textArabic.split(' ');
              const firstWord = words[0] || '';
              const remainingWordsCount = Math.max(0, words.length - 1);

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
                      ? 'bg-white dark:bg-slate-850 border-emerald-300 dark:border-emerald-800/80'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Status Ribbon Header */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
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

                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        Ayat {ayah.ayahNumber}
                      </span>

                      {isActive && (
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          Target Sekarang
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Terbuka & Lancar ✓</span>
                        </span>
                      )}

                      {isWrong && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-extrabold text-xs border border-rose-300 dark:border-rose-800 animate-pulse">
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Terkunci 🔒 (Perbaiki Lafadz)</span>
                        </span>
                      )}

                      {isActive && !isWrong && !isCorrect && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-extrabold text-xs animate-pulse border border-teal-300 dark:border-teal-800">
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                          <span>
                            {displayMode === 'blind_hidden'
                              ? 'Lafalkan dari Ingatan...'
                              : 'Silakan Baca Sekarang...'}
                          </span>
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
                          <span className="hidden sm:inline">Bantuan Ustadz</span>
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

                  {/* ARABIC TEXT DISPLAY (BLIND / REVEAL MECHANIC) */}
                  <div className="py-4 relative">
                    {isHidden ? (
                      /* BLIND VEIL: Hidden Ayah with Mystery Card & Lock */
                      <div className="py-8 px-6 rounded-2xl bg-gradient-to-r from-emerald-950/10 via-teal-950/15 to-emerald-950/10 dark:from-slate-900/80 dark:to-slate-900/80 border border-emerald-500/20 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-2 select-none group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-xl shadow-inner border border-emerald-500/30">
                          <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                          Ayat {ayah.ayahNumber} Disembunyikan (Uji Hafalan)
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                          Bacakan ayat ini dengan suara lantang ke mikrofon. Ketika bacaanmu benar, ayat akan <strong>terbuka otomatis dengan kilau keemasan</strong>!
                        </p>
                        {isActive && (
                          <button
                            onClick={handleTriggerPeek}
                            className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lupa ayatnya? Klik untuk intip 4 detik</span>
                          </button>
                        )}
                      </div>
                    ) : isFirstWordOnly ? (
                      /* FIRST WORD CLUE MODE */
                      <div className="py-4 px-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                          +{remainingWordsCount} kata selanjutnya disembunyikan
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-arabic">...</span>
                          <span className="font-arabic text-2xl sm:text-3xl text-emerald-700 dark:text-emerald-400 font-bold">
                            {firstWord}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* OPEN / REVEALED TEXT */
                      <div className="text-right">
                        <p className={`font-arabic text-2xl sm:text-3xl leading-loose select-none font-medium transition-all ${
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
                    )}
                  </div>

                  {/* LATIN & TRANSLATION (Only if revealed or open mode) */}
                  {!isHidden && (
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                      <p className="text-xs sm:text-sm italic font-serif text-slate-700 dark:text-slate-300">
                        "{ayah.textLatin}"
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {ayah.translationId}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER: PROGRESS COUNTER & PROMPT */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Progres Hafalan Surat:
            </span>
            <div className="w-28 sm:w-44 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((activeAyahIndex + (isSurahCompleted ? 1 : 0)) / (surah.ayat.length || 1)) * 100)}%` }}
              />
            </div>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {Math.round(((activeAyahIndex + (isSurahCompleted ? 1 : 0)) / (surah.ayat.length || 1)) * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-slate-400">
              Mode: <strong className="text-slate-700 dark:text-slate-300">{displayMode === 'blind_hidden' ? 'Teks Sembunyi' : displayMode === 'first_word' ? 'Kata Awal' : 'Teks Terbuka'}</strong>
            </span>
            <button
              onClick={() => {
                stopContinuousListening();
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
            >
              Selesai Sesi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
