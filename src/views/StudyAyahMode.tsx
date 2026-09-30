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
  RotateCcw, 
  Volume2, 
  Mic, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Repeat, 
  Eye, 
  EyeOff,
  Sparkle,
  Loader2,
  Square,
  Radio,
  BookMarked,
  HelpCircle,
  Award
} from 'lucide-react';
import { TajweedGuideModal } from '../components/TajweedGuideModal';
import { MakharijulHurufModal } from '../components/MakharijulHurufModal';
import { TikrarPlayerModal } from '../components/TikrarPlayerModal';

interface StudyAyahModeProps {
  surahId: number;
  ayahNumber: number;
  onBack: () => void;
  onNavigateAyah: (ayahNumber: number) => void;
  onOpenSetorModal: (surah: Surah, ayah: Ayah) => void;
  onOpenVoiceGate?: (surahId?: number, ayahNumber?: number) => void;
  onOpenContinuousVoice?: (surahId?: number, ayahNumber?: number) => void;
}

export const StudyAyahMode: React.FC<StudyAyahModeProps> = ({
  surahId,
  ayahNumber,
  onBack,
  onNavigateAyah,
  onOpenSetorModal,
  onOpenVoiceGate,
  onOpenContinuousVoice,
}) => {
  const { activeProfile, addXP } = useKafa();
  
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

  const [isLoading, setIsLoading] = useState(false);

  // Reciter & Audio state
  const [selectedReciterId, setSelectedReciterId] = useState<string>('alafasy');
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatLimit, setRepeatLimit] = useState(3);
  const [repeatCounter, setRepeatCounter] = useState(0);

  // Practice Recording State (Compare with Sheikh)
  const [isRecordingPractice, setIsRecordingPractice] = useState(false);
  const [practiceAudioUrl, setPracticeAudioUrl] = useState<string | null>(null);
  const [isPlayingPracticeAudio, setIsPlayingPracticeAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const practiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // Display toggles
  const [showTranslation, setShowTranslation] = useState(true);
  const [showLatin, setShowLatin] = useState(true);
  const [hideArabicForTesting, setHideArabicForTesting] = useState(false);

  // Learning Tools Modal
  const [isTajweedModalOpen, setIsTajweedModalOpen] = useState(false);
  const [isMakhrajModalOpen, setIsMakhrajModalOpen] = useState(false);
  const [isTikrarModalOpen, setIsTikrarModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentReciter = RECITERS_LIST.find((r) => r.id === selectedReciterId) || RECITERS_LIST[0];

  useEffect(() => {
    let mounted = true;
    const initial = getSurahSync(surahId);
    if (initial && initial.ayat && initial.ayat.length > 0) {
      setSurah(initial);
    } else {
      setIsLoading(true);
      fetchFullSurah(surahId)
        .then((res) => {
          if (mounted) {
            setSurah(res);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (mounted) setIsLoading(false);
        });
    }

    return () => {
      mounted = false;
    };
  }, [surahId]);

  const ayah = surah.ayat.find((a) => a.ayahNumber === ayahNumber) || surah.ayat[0] || {
    id: surahId * 1000 + ayahNumber,
    surahId,
    ayahNumber,
    textArabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    textLatin: `Ayat ${ayahNumber}`,
    translationId: `Ayat ${ayahNumber} Surat ${surah.nameLatin || surah.nameId}`,
    audioUrl: '',
  };

  useEffect(() => {
    // Reset state on ayah change
    setRepeatCounter(0);
    setIsPlaying(false);
    setPracticeAudioUrl(null);
    setIsRecordingPractice(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [ayahNumber, surahId]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (practiceAudioRef.current) practiceAudioRef.current.pause();
    };
  }, []);

  const playAudio = () => {
    const audioUrl = getAyahAudioUrlWithReciter(surahId, ayahNumber, currentReciter.folder);
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.play().catch(() => {});

    audio.onended = () => {
      setRepeatCounter((prev) => {
        const next = prev + 1;
        if (next < repeatLimit) {
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          }, 800);
          return next;
        } else {
          setIsPlaying(false);
          addXP(5, `Mendengarkan repetisi ayat`);
          return next;
        }
      });
    };
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  // Self Practice Voice Recording
  const startPracticeRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setPracticeAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingPractice(true);
    } catch (err) {
      console.warn("Mikrofon belum diizinkan atau tidak tersedia.");
      // Simulated practice recording
      setIsRecordingPractice(true);
      setTimeout(() => {
        setIsRecordingPractice(false);
        setPracticeAudioUrl("simulated_url");
      }, 3000);
    }
  };

  const stopPracticeRecording = () => {
    if (mediaRecorderRef.current && isRecordingPractice) {
      mediaRecorderRef.current.stop();
      setIsRecordingPractice(false);
    } else {
      setIsRecordingPractice(false);
    }
  };

  const togglePlayPracticeVoice = () => {
    if (!practiceAudioUrl || practiceAudioUrl === "simulated_url") return;

    if (isPlayingPracticeAudio && practiceAudioRef.current) {
      practiceAudioRef.current.pause();
      setIsPlayingPracticeAudio(false);
    } else {
      const audio = new Audio(practiceAudioUrl);
      practiceAudioRef.current = audio;
      setIsPlayingPracticeAudio(true);
      audio.play().catch(() => {});
      audio.onended = () => setIsPlayingPracticeAudio(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Surat</span>
        </button>

        <div className="text-center">
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Surat {surah.nameLatin || surah.nameId} (Juz {surah.juzNumber})
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ayat {ayah.ayahNumber} dari {surah.totalAyat}
          </p>
        </div>

        {/* Visibility and learning tools */}
        <div className="flex items-center gap-1.5">
          {onOpenContinuousVoice && (
            <button
              onClick={() => onOpenContinuousVoice(surahId, ayahNumber)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-xs font-black transition hover:scale-105 cursor-pointer shadow-xs"
              title="Baca Mengalir: Benar = Jalan 🟢 | Salah = Berhenti 🔴"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span className="hidden sm:inline">Baca Berjalan</span>
            </button>
          )}

          <button
            onClick={() => setIsTikrarModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold transition hover:scale-105 cursor-pointer shadow-xs"
            title="Buka Pemutar Pengulang Ayat (Mode Tikrar)"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mode Tikrar</span>
          </button>

          <button
            onClick={() => setIsTajweedModalOpen(true)}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 text-xs transition cursor-pointer"
            title="Cek Tajwid"
          >
            <BookMarked className="w-4 h-4" />
          </button>

          <button
            onClick={() => setHideArabicForTesting(!hideArabicForTesting)}
            className={`p-2 rounded-full border text-xs transition cursor-pointer ${
              hideArabicForTesting
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 border-amber-300'
                : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
            }`}
            title={hideArabicForTesting ? "Tampilkan Teks Arab" : "Sembunyikan Teks Arab (Uji Ingatan)"}
          >
            {hideArabicForTesting ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Focus Study Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl space-y-7 text-center relative overflow-hidden">
        {/* Step Indicator & Reciter */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-4 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
            Mode Fokus • Ayat {ayah.ayahNumber}
          </span>

          {/* Reciter Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-xs">
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedReciterId}
              onChange={(e) => setSelectedReciterId(e.target.value)}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              {RECITERS_LIST.map((r) => (
                <option key={r.id} value={r.id} className="dark:bg-slate-900">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {repeatCounter > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-xs animate-pulse">
              Pengulangan ke-{Math.min(repeatLimit, repeatCounter + 1)} dari {repeatLimit}
            </span>
          )}
        </div>

        {/* Central Arabic Canvas */}
        <div className="min-h-[160px] flex items-center justify-center py-4 px-2">
          {isLoading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Memuat teks ayat...</p>
            </div>
          ) : hideArabicForTesting ? (
            <div className="p-8 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 max-w-md w-full space-y-2">
              <span className="text-3xl">🙈</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Teks Arab Disembunyikan
              </p>
              <p className="text-xs text-slate-400">
                Coba lafalkan hafalanmu dari ingatan, lalu klik ikon mata di pojok kanan atas untuk memeriksa kebenarannya!
              </p>
            </div>
          ) : (
            <p className="font-arabic text-3xl sm:text-4xl lg:text-5xl leading-[2.2] sm:leading-[2.4] text-slate-900 dark:text-white font-normal">
              {ayah.textArabic}
            </p>
          )}
        </div>

        {/* Transliteration and Translation */}
        <div className="space-y-2 max-w-lg mx-auto">
          {showLatin && !hideArabicForTesting && (
            <p className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-emerald-400 italic">
              {ayah.textLatin}
            </p>
          )}

          {showTranslation && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
              "{ayah.translationId}"
            </p>
          )}
        </div>

        {/* Audio Repetition Controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Target Repetisi:</span>
            <div className="flex gap-1">
              {[1, 3, 5, 7, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setRepeatLimit(num)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                    repeatLimit === num
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={isPlaying ? pauseAudio : playAudio}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm shadow-md transition transform active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              <span>{isPlaying ? 'Jeda Repetisi' : `Putar Audio Syaikh (${repeatLimit}x)`}</span>
            </button>
          </div>
        </div>

        {/* Interactive Self-Practice Box (Rekam Suara Mandiri & Bandingkan) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Latihan Mandiri: Rekam & Bandingkan Suaramu
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Praktik Mandiri
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isRecordingPractice ? (
              <button
                onClick={startPracticeRecording}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Mulai Rekam Suaraku</span>
              </button>
            ) : (
              <button
                onClick={stopPracticeRecording}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-sm transition animate-pulse cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Selesai Merekam (Stop)</span>
              </button>
            )}

            {practiceAudioUrl && practiceAudioUrl !== "simulated_url" && (
              <button
                onClick={togglePlayPracticeVoice}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isPlayingPracticeAudio ? 'Jeda Suaraku' : 'Dengar Suaraku'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          disabled={ayah.ayahNumber <= 1}
          onClick={() => onNavigateAyah(ayah.ayahNumber - 1)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Ayat Sebelumnya</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenVoiceGate && (
            <button
              onClick={() => onOpenVoiceGate(surah.id, ayah.ayahNumber)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md transition transform active:scale-95 cursor-pointer"
              title="Uji Lisan Real-Time & Gembok Lanjutan Ayat"
            >
              <Mic className="w-4 h-4" />
              <span>🎤 Uji Lisan (Voice Gate)</span>
            </button>
          )}

          <button
            onClick={() => onOpenSetorModal(surah, ayah)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition transform active:scale-95 cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Setor Hafalan Ayat {ayah.ayahNumber}</span>
          </button>
        </div>

        <button
          disabled={ayah.ayahNumber >= surah.totalAyat}
          onClick={() => onNavigateAyah(ayah.ayahNumber + 1)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span>Ayat Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modals */}
      <TajweedGuideModal
        isOpen={isTajweedModalOpen}
        onClose={() => setIsTajweedModalOpen(false)}
      />

      <MakharijulHurufModal
        isOpen={isMakhrajModalOpen}
        onClose={() => setIsMakhrajModalOpen(false)}
      />

      <TikrarPlayerModal
        isOpen={isTikrarModalOpen}
        onClose={() => setIsTikrarModalOpen(false)}
        initialSurahId={surah.id}
        initialAyah={ayah.ayahNumber}
      />
    </div>
  );
};
