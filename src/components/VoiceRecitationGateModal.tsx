import React, { useState, useEffect, useRef } from 'react';
import { useKafa } from '../context/KafaContext';
import { Surah, Ayah, JuzInfo } from '../types';
import { 
  getSurahSync, 
  fetchFullSurah, 
  getAyahAudioUrlWithReciter, 
  getAllSurahCatalog, 
  getAllJuzList, 
  getJuzInfo 
} from '../services/quranService';
import { ALL_114_SURAHS, JUZ_30_INFO_LIST } from '../data/quran30JuzData';
import { soundEffects } from '../utils/soundEffects';
import { 
  evaluateAyahVoiceRecitation, 
  removeArabicHarakat, 
  WordMatchStatus, 
  MatchSensitivity 
} from '../utils/arabicVoiceMatcher';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Lock, 
  Unlock, 
  Sparkles, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  X, 
  Award,
  Layers,
  Flame,
  Star,
  Play,
  Pause,
  Loader2,
  Settings,
  BookOpen,
  Filter,
  Check,
  Compass,
  Eye,
  EyeOff
} from 'lucide-react';

interface VoiceRecitationGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurahId?: number;
  initialAyahNumber?: number;
  initialJuz?: number;
  onOpenContinuousVoice?: (surahId?: number, ayahNumber?: number) => void;
}

type GateMode = 'verse_by_verse' | 'finish_ayah';

export const VoiceRecitationGateModal: React.FC<VoiceRecitationGateModalProps> = ({
  isOpen,
  onClose,
  initialSurahId = 114,
  initialAyahNumber = 1,
  initialJuz = 30,
  onOpenContinuousVoice,
}) => {
  const { activeProfile, addXP, triggerCelebration } = useKafa();

  // Settings / Setup Screen State
  const [showSettingsView, setShowSettingsView] = useState<boolean>(false);

  // Selected Juz (1 to 30)
  const [selectedJuz, setSelectedJuz] = useState<number>(initialJuz || 30);
  // Selected Surah and Ayah
  const [selectedSurahId, setSelectedSurahId] = useState<number>(initialSurahId || 114);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [surah, setSurah] = useState<Surah>(() => {
    return getSurahSync(initialSurahId || 114) || {
      id: 114,
      nameId: 'An-Nas',
      nameLatin: 'An-Nas',
      nameArabic: 'الناس',
      translationName: 'Manusia',
      meaningId: 'Manusia',
      totalAyat: 6,
      revelationType: 'Makkiyah',
      juzNumber: 30,
      description: '',
      ayat: []
    };
  });
  const [isLoadingSurah, setIsLoadingSurah] = useState(false);

  // Gate Game Mode
  const [gateMode, setGateMode] = useState<GateMode>('verse_by_verse');

  // Blind Mode (Ayat Tidak Tampak, Terbuka Jika Benar) - Default TRUE as requested
  const [isBlindMode, setIsBlindMode] = useState<boolean>(true);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);

  // Auto-Continue Next Surah Mode (Lanjut Terus Tanpa Berhenti di 5 Ayat / Selesai Surat)
  const [autoContinueNextSurah, setAutoContinueNextSurah] = useState<boolean>(true);

  // Match Sensitivity (Default strict / teliti 90% so wrong letters won't pass!)
  const [sensitivity, setSensitivity] = useState<MatchSensitivity>('strict');

  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Evaluation & Gating State
  const [gateState, setGateState] = useState<'idle' | 'listening' | 'correct' | 'wrong'>('idle');
  const [wordStatuses, setWordStatuses] = useState<WordMatchStatus[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [mistakeCountInCurrentAyah, setMistakeCountInCurrentAyah] = useState<number>(0);
  const [consecutiveCorrectCount, setConsecutiveCorrectCount] = useState<number>(0);
  const [isFinishedSurah, setIsFinishedSurah] = useState<boolean>(false);

  // Audio Assistant (Sheikh)
  const [isPlayingSheikh, setIsPlayingSheikh] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // SpeechRecognition reference
  const recognitionRef = useRef<any>(null);
  const autoAdvanceTimeoutRef = useRef<any>(null);

  // Surahs filtered by selected Juz
  const surahsInSelectedJuz = getAllSurahCatalog(selectedJuz);
  const allJuzList = getAllJuzList();

  // Next Surah Information for continuous flow
  const nextSurahId = selectedSurahId < 114 ? selectedSurahId + 1 : 1;
  const nextSurahCatalog = getAllSurahCatalog().find((s) => s.id === nextSurahId);

  // Initialize or update Surah when selectedSurahId changes
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const cached = getSurahSync(selectedSurahId);
    if (cached && cached.ayat && cached.ayat.length > 0) {
      setSurah(cached);
      setCurrentAyahIndex(Math.max(0, Math.min((initialAyahNumber || 1) - 1, cached.ayat.length - 1)));
    } else {
      setIsLoadingSurah(true);
      fetchFullSurah(selectedSurahId)
        .then((data) => {
          if (mounted) {
            setSurah(data);
            setCurrentAyahIndex(Math.max(0, Math.min((initialAyahNumber || 1) - 1, (data.ayat?.length || 1) - 1)));
            setIsLoadingSurah(false);
          }
        })
        .catch(() => {
          if (mounted) setIsLoadingSurah(false);
        });
    }

    // Reset states
    setGateState('idle');
    setLiveTranscript('');
    setMistakeCountInCurrentAyah(0);
    setIsFinishedSurah(false);
    setIsPeeking(false);

    return () => {
      mounted = false;
    };
  }, [selectedSurahId, isOpen, initialAyahNumber]);

  // When Juz changes, automatically select the first surah in that Juz if current surah not in it
  const handleSelectJuz = (juzNum: number) => {
    setSelectedJuz(juzNum);
    const surahsInJuz = getAllSurahCatalog(juzNum);
    if (surahsInJuz.length > 0) {
      const isCurrentInJuz = surahsInJuz.some((s) => s.id === selectedSurahId);
      if (!isCurrentInJuz) {
        setSelectedSurahId(surahsInJuz[0].id);
        setCurrentAyahIndex(0);
      }
    }
  };

  // Current active Ayah
  const currentAyah: Ayah = surah.ayat && surah.ayat.length > 0 ? (surah.ayat[currentAyahIndex] || surah.ayat[0]) : {
    id: 1,
    surahId: selectedSurahId,
    ayahNumber: 1,
    textArabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    textLatin: 'Qul huwal-laahu ahad',
    translationId: 'Katakanlah: Dialah Allah, Yang Maha Esa.',
    audioUrl: '',
  };

  // Reset Ayah evaluation when changing verse
  useEffect(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingSheikh(false);
    }

    if (currentAyah?.textArabic) {
      const words = currentAyah.textArabic.split(/\s+/).filter(Boolean);
      setWordStatuses(
        words.map((w) => ({
          word: w,
          cleanWord: removeArabicHarakat(w),
          status: 'pending',
        }))
      );
    }
    setGateState('idle');
    setLiveTranscript('');
    setIsPeeking(false);
    setFeedbackMessage(
      isBlindMode
        ? '🙈 Mode Uji Gaib Aktif: Ayat disembunyikan. Bacakan langsung dari ingatan!'
        : 'Klik tombol mikrofon di bawah lalu bacakan ayat ini!'
    );
  }, [currentAyahIndex, surah, isBlindMode]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Web Speech API Voice Recognition
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError(
        'Browser Anda belum mendukung input suara Web Speech API. Gunakan Google Chrome atau Edge, atau gunakan tombol simulasi suara di bawah.'
      );
      return;
    }

    try {
      setRecognitionError(null);
      setLiveTranscript('');
      setGateState('listening');
      setIsListening(true);

      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
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
          handleVoiceEvaluation(currentSpoken);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError('Izin akses mikrofon ditolak. Mohon izinkan mikrofon di browser.');
          stopListening();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  // Evaluate the spoken recitation against current target verse with strict accuracy
  const handleVoiceEvaluation = (spokenText: string) => {
    let targetArabic = currentAyah.textArabic;
    let targetLatin = currentAyah.textLatin;

    if (gateMode === 'finish_ayah') {
      const words = currentAyah.textArabic.split(/\s+/).filter(Boolean);
      const halfIndex = Math.max(1, Math.floor(words.length / 2));
      targetArabic = words.slice(halfIndex).join(' ');
      targetLatin = currentAyah.textLatin.split(/\s+/).slice(halfIndex).join(' ');
    }

    const evalResult = evaluateAyahVoiceRecitation(
      targetArabic,
      targetLatin,
      spokenText,
      sensitivity
    );

    if (evalResult.isCorrect) {
      // 🟢 SUCCESS: TURN GREEN, PLAY SUCCESS CHIME, REVEAL AYAT, UNLOCK & ADVANCE!
      setGateState('correct');
      soundEffects.playCorrect();
      setFeedbackMessage(evalResult.feedbackMessage);
      setConsecutiveCorrectCount((prev) => prev + 1);
      addXP(10, `Lancar membaca Juz ${selectedJuz} - Ayat ${currentAyah.ayahNumber}`);

      // Highlight all words as green
      setWordStatuses((prev) =>
        prev.map((w) => ({
          ...w,
          status: 'correct',
        }))
      );

      stopListening();

      // Check if this was the last ayah of the Surah
      if (currentAyahIndex + 1 >= (surah.ayat?.length || 0)) {
        if (autoContinueNextSurah) {
          // 🎉 Selesai surat! Auto-advance to next Surah in 1.8s!
          soundEffects.playFanfare();
          triggerCelebration();
          addXP(30, `Khatam Uji Lisan Surat ${surah.nameLatin || surah.nameId}!`);
          setFeedbackMessage(`🎉 Surat ${surah.nameLatin || surah.nameId} Tuntas! Melanjutkan otomatis ke surat berikutnya... 🚀`);

          autoAdvanceTimeoutRef.current = setTimeout(() => {
            handleAdvanceToNextSurah();
          }, 1800);
        } else {
          setIsFinishedSurah(true);
          soundEffects.playFanfare();
          triggerCelebration();
          addXP(30, `Khatam Uji Lisan Surat ${surah.nameLatin || surah.nameId}!`);
        }
      } else {
        // Auto advance to next verse after 1.6 seconds!
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          advanceToNextAyah();
        }, 1600);
      }
    } else {
      // 🔴 MISTAKE: TURN RED, LOCK GATE, PLAY MISTAKE BUZZER!
      setGateState('wrong');
      soundEffects.playIncorrect();
      setMistakeCountInCurrentAyah((prev) => prev + 1);
      setFeedbackMessage(
        evalResult.feedbackMessage ||
        '⛔ LAFADZ SALAH / TERLEWAT! Ayat terkunci berwarna merah 🔴. Dengarkan audio Syaikh atau ulangi lafadz yang benar untuk membuka gembok!'
      );

      // Highlight target words with error status
      setWordStatuses((prev) =>
        prev.map((w, idx) => {
          if (evalResult.wordStatuses[idx]?.status === 'correct') {
            return { ...w, status: 'correct' };
          }
          return { ...w, status: 'wrong' };
        })
      );
    }
  };

  const advanceToNextAyah = () => {
    if (currentAyahIndex + 1 < (surah.ayat?.length || 0)) {
      setCurrentAyahIndex((prev) => prev + 1);
    } else {
      handleAdvanceToNextSurah();
    }
  };

  const handleAdvanceToNextSurah = (targetSurahId?: number) => {
    const nextId = targetSurahId || (selectedSurahId < 114 ? selectedSurahId + 1 : 1);
    setSelectedSurahId(nextId);
    setCurrentAyahIndex(0);
    setIsFinishedSurah(false);
    setGateState('idle');
    setLiveTranscript('');
    setMistakeCountInCurrentAyah(0);
    setIsPeeking(false);

    // Update Juz if needed
    const nextCat = getAllSurahCatalog().find((s) => s.id === nextId);
    if (nextCat && nextCat.juzNumber !== selectedJuz) {
      setSelectedJuz(nextCat.juzNumber);
    }
  };

  const retryCurrentAyah = () => {
    setGateState('idle');
    setLiveTranscript('');
    setIsPeeking(false);
    setFeedbackMessage('Silakan klik mikrofon dan baca kembali dengan benar!');
    if (currentAyah?.textArabic) {
      const words = currentAyah.textArabic.split(/\s+/).filter(Boolean);
      setWordStatuses(
        words.map((w) => ({
          word: w,
          cleanWord: removeArabicHarakat(w),
          status: 'pending',
        }))
      );
    }
  };

  // Play Sheikh reference audio
  const togglePlaySheikhAudio = () => {
    if (isPlayingSheikh && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingSheikh(false);
      return;
    }

    const audioUrl = getAyahAudioUrlWithReciter(
      selectedSurahId,
      currentAyah.ayahNumber,
      'Alafasy_128kbps'
    );

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setIsPlayingSheikh(true);

    audio.play().catch(() => {});
    audio.onended = () => {
      setIsPlayingSheikh(false);
    };
  };

  // Simulated Voice Input
  const triggerSimulatedRecitation = (type: 'correct' | 'wrong') => {
    stopListening();
    if (type === 'correct') {
      setLiveTranscript(currentAyah.textArabic);
      handleVoiceEvaluation(currentAyah.textArabic);
    } else {
      setLiveTranscript('بِسْمِ شَيْءٍ خَاطِئٍ (Lafadz Keliru)');
      handleVoiceEvaluation('lafadz yang salah');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-300 font-bold border border-white/20">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">
                  Uji Lisan & Gembok Suara (30 Juz Lengkap)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30">
                  Juz {selectedJuz}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Salah = <span className="text-red-300 font-extrabold">Merah (Terkunci 🔒)</span> • Benar ={' '}
                <span className="text-emerald-300 font-extrabold">Hijau (Terbuka 🔓 & Ayat Tampak)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsView(!showSettingsView)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition border border-white/15 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{showSettingsView ? 'Kembali' : 'Pilih Juz 1-30'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {showSettingsView ? (
          /* JUZ & SURAH SELECTOR SCREEN */
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  Pilih Juz & Surat Target
                </h4>
                <p className="text-xs text-slate-500">
                  Pilih dari Juz 1 sampai 30 untuk diuji lisannya:
                </p>
              </div>
              <button
                onClick={() => setShowSettingsView(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition cursor-pointer"
              >
                Mulai Uji Lisan &rarr;
              </button>
            </div>

            {/* 30 Juz Grid */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                1. Pilih Juz (1 - 30):
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                  const isSelected = selectedJuz === juzNum;
                  return (
                    <button
                      key={juzNum}
                      onClick={() => handleSelectJuz(juzNum)}
                      className={`py-2 px-1 rounded-xl font-extrabold text-xs transition cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md scale-105 ring-2 ring-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] opacity-75">Juz</span>
                      <span className="text-sm font-black">{juzNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Surahs in the selected Juz */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>2. Pilih Surat di Juz {selectedJuz}:</span>
                <span className="text-[11px] text-slate-500">
                  {surahsInSelectedJuz.length} Surat Tersedia
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {surahsInSelectedJuz.map((s) => {
                  const isSelected = selectedSurahId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSurahId(s.id);
                        setCurrentAyahIndex(0);
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/40 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {s.id}
                        </div>
                        <div>
                          <p className="font-extrabold text-xs">{s.nameLatin || s.nameId}</p>
                          <p className="text-[10px] text-slate-500">{s.totalAyat} Ayat</p>
                        </div>
                      </div>
                      <span className="font-arabic font-bold text-sm text-emerald-700 dark:text-emerald-400">
                        {s.nameArabic}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mode & Starting Ayah selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  3. Mode Uji Suara:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGateMode('verse_by_verse')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      gateMode === 'verse_by_verse'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Ayat Beruntun (Utuh)
                  </button>
                  <button
                    onClick={() => setGateMode('finish_ayah')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      gateMode === 'finish_ayah'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Sambung Ayat
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  4. Mulai Dari Ayat:
                </label>
                <select
                  value={currentAyahIndex + 1}
                  onChange={(e) => setCurrentAyahIndex(Number(e.target.value) - 1)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 font-bold text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  {Array.from({ length: surah.totalAyat || 1 }, (_, i) => i + 1).map((aNum) => (
                    <option key={aNum} value={aNum}>
                      Ayat ke-{aNum}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsView(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition transform active:scale-98 cursor-pointer"
            >
              <Mic className="w-5 h-5" />
              <span>Simpan & Mulai Uji Lisan Sekarang</span>
            </button>
          </div>
        ) : (
          <>
            {/* Subheader: Quick Bar for Current Juz, Surah Selector & Options */}
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Juz & Surah Quick Dropdown */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Juz Selector */}
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Juz:</span>
                  <select
                    value={selectedJuz}
                    onChange={(e) => handleSelectJuz(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 font-black text-emerald-700 dark:text-emerald-300 focus:outline-hidden cursor-pointer"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((jNum) => (
                      <option key={jNum} value={jNum}>
                        Juz {jNum}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Surah Dropdown */}
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Surat:</span>
                  <select
                    value={selectedSurahId}
                    onChange={(e) => {
                      setSelectedSurahId(Number(e.target.value));
                      setCurrentAyahIndex(0);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-300 focus:outline-hidden cursor-pointer max-w-[150px] sm:max-w-none truncate"
                  >
                    {surahsInSelectedJuz.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}. {s.nameLatin || s.nameId} ({s.totalAyat} Ayat)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Tool Toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Blind Mode Toggle */}
                <button
                  onClick={() => setIsBlindMode(!isBlindMode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition text-[11px] cursor-pointer shadow-xs ${
                    isBlindMode 
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Mode Uji Hafalan Gaib: Teks ayat disembunyikan sampai dibaca dengan benar!"
                >
                  {isBlindMode ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{isBlindMode ? '🙈 Mode Gaib: Aktif' : '👁️ Teks Tampak'}</span>
                </button>

                {/* Auto-Continue Next Surah Toggle */}
                <button
                  onClick={() => setAutoContinueNextSurah(!autoContinueNextSurah)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition text-[11px] cursor-pointer shadow-xs ${
                    autoContinueNextSurah
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Lanjut otomatis ke surat berikutnya tanpa berhenti"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{autoContinueNextSurah ? '🚀 Lanjut Terus Antar Surat' : '⏹️ Stop per Surat'}</span>
                </button>

                {/* Sensitivity Selector */}
                <select
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value as MatchSensitivity)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 font-bold text-[11px] text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  title="Tingkat Ketelitian Penilaian Suara"
                >
                  <option value="strict">🎯 Sangat Teliti (90%)</option>
                  <option value="standard">⚖️ Standar (80%)</option>
                  <option value="lenient">🌱 Ramah Anak (70%)</option>
                </select>

                {onOpenContinuousVoice && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenContinuousVoice(selectedSurahId, currentAyah.ayahNumber);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-[11px] shadow-xs hover:scale-105 transition cursor-pointer"
                    title="Beralih ke Mode Baca Berjalan (Hands-Free: Benar = Jalan, Salah = Berhenti)"
                  >
                    <Mic className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>Baca Berjalan 🚀</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Testing View */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">
              {isLoadingSurah ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">
                    Memuat data Surat {surah.nameLatin || selectedSurahId}...
                  </p>
                </div>
              ) : isFinishedSurah ? (
                /* FINISHED CELEBRATION CARD WITH NEXT SURAH ADVANCE BUTTON */
                <div className="py-8 text-center space-y-5 animate-in zoom-in-95">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center text-4xl shadow-xl mx-auto animate-bounce">
                    🏆
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      Masya Allah, Sempurna! 🎉
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                      Kamu berhasil membaca seluruh {surah.totalAyat} ayat Surat{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {surah.nameLatin || surah.nameId}
                      </strong>{' '}
                      (Juz {selectedJuz}) tanpa ada gembok yang tersisa!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {/* Next Surah Action Button */}
                    <button
                      onClick={() => handleAdvanceToNextSurah()}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-lg hover:from-emerald-500 hover:to-teal-500 transition transform hover:scale-105 cursor-pointer"
                    >
                      <span>Lanjut ke Surat Berikutnya ({nextSurahCatalog?.nameLatin || `Surat ${nextSurahId}`})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setCurrentAyahIndex(0);
                        setIsFinishedSurah(false);
                      }}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <RotateCcw className="w-4 h-4 text-emerald-600" />
                      <span>Ulangi Surat Ini</span>
                    </button>

                    <button
                      onClick={() => setShowSettingsView(true)}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-white font-extrabold text-xs shadow-md hover:bg-amber-400 transition cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Pilih Juz / Surat Lain</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ACTIVE AYAH VOICE GATE CARD */
                <div className="space-y-5">
                  {/* Ayah Progress Counter and Gate Status Badge */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
                        Juz {selectedJuz} - Ayat {currentAyah.ayahNumber} dari {surah.totalAyat}
                      </span>
                      {consecutiveCorrectCount > 1 && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-extrabold text-xs">
                          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                          <span>Streak: {consecutiveCorrectCount} Lancar</span>
                        </span>
                      )}
                    </div>

                    {/* Lock Status Pill */}
                    <div className="flex items-center gap-1.5">
                      {gateState === 'correct' ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow-md animate-pulse">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>TERBUKA (BENAR ✓)</span>
                        </span>
                      ) : gateState === 'wrong' ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black shadow-md animate-bounce">
                          <Lock className="w-3.5 h-3.5" />
                          <span>TERKUNCI (SALAH ✗)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Menunggu Suara</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CENTRAL BOX: BLIND MODE CARD OR REVEALED VERSE */}
                  {isBlindMode && gateState !== 'correct' && !isPeeking ? (
                    /* 1. BLIND MODE: AYAT TIDAK TAMPAK (GAIB) */
                    <div className={`p-8 sm:p-10 rounded-3xl text-center border-3 transition-all duration-300 space-y-4 relative overflow-hidden ${
                      gateState === 'wrong'
                        ? 'bg-red-950/40 border-red-500 shadow-xl shadow-red-500/20 ring-4 ring-red-400/20 animate-shake'
                        : 'bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/40 shadow-xl'
                    }`}>
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner transition ${
                        gateState === 'wrong'
                          ? 'bg-red-500/20 text-red-400 border border-red-400/40 animate-bounce'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 animate-pulse'
                      }`}>
                        🔒
                      </div>

                      <div className="space-y-1.5">
                        <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-400/30">
                          Mode Uji Hafalan Gaib (Ayat Tidak Tampak)
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          Bacakan Ayat ke-{currentAyah.ayahNumber} dari Hafalan Ingatanmu!
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                          Teks ayat disembunyikan. Bacakan langsung dengan suaramu! Jika bacaanmu <strong>benar 🟢</strong>, ayat akan seketika <strong>tampak terbuka</strong> dan meluncur ke ayat berikutnya!
                        </p>
                      </div>

                      {/* Peek button */}
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setIsPeeking(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-bold transition border border-white/20 cursor-pointer"
                          title="Klik untuk mengintip jika lupa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Intip Teks Ayat (Bantuan)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 2. AYAT TAMPAK: REVEALED WHEN CORRECT, OR WHEN PEEKING, OR WHEN BLIND MODE OFF */
                    <div
                      className={`p-6 sm:p-8 rounded-3xl text-center border-3 transition-all duration-300 space-y-4 relative ${
                        gateState === 'correct'
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-500/20 animate-in zoom-in-95 duration-200'
                          : gateState === 'wrong'
                          ? 'bg-red-500/10 dark:bg-red-950/40 border-red-500 shadow-lg shadow-red-500/10 ring-4 ring-red-400/20 animate-shake'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Banner when unlocked in blind mode */}
                      {isBlindMode && gateState === 'correct' && (
                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs shadow-md animate-bounce mb-1">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>✨ MASYA ALLAH BENAR! AYAT BERHASIL TAMPAK TERBUKA!</span>
                        </div>
                      )}

                      {/* Peek indicator */}
                      {isPeeking && gateState !== 'correct' && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold mb-1">
                          <span>👁️ Mode Mengintip Aktif (Bantuan Ingatan)</span>
                          <button
                            onClick={() => setIsPeeking(false)}
                            className="text-xs font-black underline hover:text-amber-500 cursor-pointer"
                          >
                            Sembunyikan Kembali &times;
                          </button>
                        </div>
                      )}

                      {gateMode === 'finish_ayah' && (
                        <div className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold mb-1">
                          🧩 Lanjutkan potongan ayat di bawah dengan suaramu:
                        </div>
                      )}

                      {/* Word Chips in Arabic */}
                      <div className="font-arabic text-3xl sm:text-4xl lg:text-5xl leading-[2.2] sm:leading-[2.4] text-slate-900 dark:text-white flex flex-wrap items-center justify-center gap-2 dir-rtl">
                        {wordStatuses.map((item, idx) => {
                          let wordClass = 'px-2 py-1 rounded-2xl transition-all duration-200';
                          if (item.status === 'correct') {
                            wordClass +=
                              ' bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300 scale-105';
                          } else if (item.status === 'wrong') {
                            wordClass +=
                              ' bg-red-600 text-white shadow-md ring-2 ring-red-300 scale-105 animate-shake';
                          } else {
                            wordClass += ' hover:bg-slate-200/50 dark:hover:bg-slate-700/50';
                          }

                          return (
                            <span key={idx} className={wordClass}>
                              {item.word}
                            </span>
                          );
                        })}
                        <span className="inline-flex items-center justify-center font-sans text-sm sm:text-base mx-2 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 select-none">
                          {currentAyah.ayahNumber}
                        </span>
                      </div>

                      {/* Latin Transliteration */}
                      <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 italic">
                        {currentAyah.textLatin}
                      </p>

                      {/* Meaning */}
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        "{currentAyah.translationId}"
                      </p>
                    </div>
                  )}

                  {/* Feedback and Alert Box */}
                  <div
                    className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold ${
                      gateState === 'correct'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
                        : gateState === 'wrong'
                        ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200 border border-red-300 animate-shake'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {gateState === 'correct' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : gateState === 'wrong' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                    ) : (
                      <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold">{feedbackMessage || 'Uji bacaanmu sekarang'}</p>
                      {liveTranscript && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Suara terdengar: <span className="font-extrabold italic">"{liveTranscript}"</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Error Notification */}
                  {recognitionError && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 text-amber-800 dark:text-amber-300 text-xs">
                      {recognitionError}
                    </div>
                  )}

                  {/* Primary Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    {/* Mic Button */}
                    {!isListening ? (
                      <button
                        onClick={startListening}
                        className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition transform active:scale-95 cursor-pointer"
                      >
                        <Mic className="w-5 h-5" />
                        <span>Mulai Bacakan Ayat Ini</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopListening}
                        className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm shadow-xl shadow-red-500/25 transition animate-pulse cursor-pointer"
                      >
                        <MicOff className="w-5 h-5" />
                        <span>Sedang Menyimak... (Klik untuk Selesai)</span>
                      </button>
                    )}

                    {/* Sheikh Reference Audio */}
                    <button
                      onClick={togglePlaySheikhAudio}
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                        isPlayingSheikh
                          ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                      title="Dengarkan bacaan Syaikh jika ragu"
                    >
                      {isPlayingSheikh ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                      <span>{isPlayingSheikh ? 'Jeda Audio Syaikh' : 'Dengar Contoh Syaikh'}</span>
                    </button>

                    {/* Retry button */}
                    {gateState === 'wrong' && (
                      <button
                        onClick={retryCurrentAyah}
                        className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                        <span>Coba Ulangi</span>
                      </button>
                    )}
                  </div>

                  {/* Simulated Voice Tester (For fast demonstration & testing) */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-bold text-[11px]">Tes Cepat Suara:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => triggerSimulatedRecitation('correct')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-[11px] font-black hover:bg-emerald-100 transition cursor-pointer shadow-xs"
                      >
                        🧪 Simulasi Bacaan Benar (Hijau 🔓)
                      </button>
                      <button
                        onClick={() => triggerSimulatedRecitation('wrong')}
                        className="px-3.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 text-[11px] font-black hover:bg-red-100 transition cursor-pointer shadow-xs"
                      >
                        🧪 Simulasi Bacaan Salah (Merah 🔒)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
              <button
                disabled={currentAyahIndex <= 0}
                onClick={() => setCurrentAyahIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Ayat Sebelumnya</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium hidden sm:inline">
                  {surah.nameLatin || surah.nameId} • Ayat {currentAyah.ayahNumber} dari {surah.totalAyat}
                </span>

                <button
                  disabled={gateState !== 'correct' && currentAyahIndex >= (surah.ayat?.length || 1) - 1}
                  onClick={() => advanceToNextAyah()}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold transition cursor-pointer ${
                    gateState === 'correct'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>{currentAyahIndex + 1 >= (surah.ayat?.length || 1) ? 'Surat Berikutnya 🚀' : 'Ayat Berikutnya'}</span>
                  {gateState !== 'correct' && <Lock className="w-3.5 h-3.5" />}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
