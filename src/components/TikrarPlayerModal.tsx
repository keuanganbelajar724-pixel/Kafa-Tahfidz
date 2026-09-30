import React, { useState, useRef, useEffect } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Volume2, 
  Sliders, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Award
} from 'lucide-react';
import { getSurahSync, fetchFullSurah, RECITERS_LIST, getAyahAudioUrlWithReciter, getAllSurahCatalog } from '../services/quranService';
import { Ayah, Surah } from '../types';

interface TikrarPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurahId?: number;
  initialAyah?: number;
}

export const TikrarPlayerModal: React.FC<TikrarPlayerModalProps> = ({
  isOpen,
  onClose,
  initialSurahId = 78,
  initialAyah = 1,
}) => {
  const { addXP, triggerCelebration, activeProfile } = useKafa();

  // Surah & Range State
  const [selectedSurahId, setSelectedSurahId] = useState<number>(initialSurahId);
  const [surah, setSurah] = useState<Surah | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState(false);

  const [startAyah, setStartAyah] = useState<number>(initialAyah);
  const [endAyah, setEndAyah] = useState<number>(initialAyah + 4);

  // Current Playback State
  const [currentAyahNumber, setCurrentAyahNumber] = useState<number>(initialAyah);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatLimit, setRepeatLimit] = useState<number>(5); // 1, 3, 5, 7, 10, 20
  const [currentRepeatCount, setCurrentRepeatCount] = useState<number>(1);
  const [pauseSeconds, setPauseSeconds] = useState<number>(2); // pause interval between repeats
  const [isPausedInterval, setIsPausedInterval] = useState(false);
  const [countdownPause, setCountdownPause] = useState<number>(0);

  // Audio settings
  const [selectedReciterId, setSelectedReciterId] = useState<string>('alafasy');
  const [speed, setSpeed] = useState<number>(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const catalogList = getAllSurahCatalog();

  // Load Surah data
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const cached = getSurahSync(selectedSurahId);
    if (cached && cached.ayat && cached.ayat.length > 0) {
      setSurah(cached);
      setStartAyah(1);
      setEndAyah(Math.min(5, cached.totalAyat));
      setCurrentAyahNumber(1);
      setCurrentRepeatCount(1);
    } else {
      setIsLoadingSurah(true);
      fetchFullSurah(selectedSurahId)
        .then((res) => {
          if (isMounted) {
            setSurah(res);
            setStartAyah(1);
            setEndAyah(Math.min(5, res.totalAyat));
            setCurrentAyahNumber(1);
            setCurrentRepeatCount(1);
            setIsLoadingSurah(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoadingSurah(false);
        });
    }

    return () => {
      isMounted = false;
      stopAudio();
    };
  }, [selectedSurahId, isOpen]);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen && initialSurahId) {
      setSelectedSurahId(initialSurahId);
      setStartAyah(initialAyah);
      setEndAyah(initialAyah + 4);
      setCurrentAyahNumber(initialAyah);
    }
  }, [isOpen, initialSurahId, initialAyah]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (pauseTimerRef.current) {
      clearInterval(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    setIsPlaying(false);
    setIsPausedInterval(false);
  };

  const playCurrentAyahAudio = () => {
    if (!audioRef.current || !surah) return;

    const audioUrl = getAyahAudioUrlWithReciter(selectedReciterId, surah.id, currentAyahNumber);
    audioRef.current.src = audioUrl;
    audioRef.current.playbackRate = speed;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsPausedInterval(false);
      })
      .catch((err) => {
        console.warn('Playback notice:', err);
        setIsPlaying(false);
      });
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playCurrentAyahAudio();
    }
  };

  // Audio Ended Handler: manages repeats and advance
  const handleAudioEnded = () => {
    if (currentRepeatCount < repeatLimit) {
      // Repeat the same ayah after pause interval
      if (pauseSeconds > 0) {
        setIsPausedInterval(true);
        setCountdownPause(pauseSeconds);

        let remaining = pauseSeconds;
        pauseTimerRef.current = setInterval(() => {
          remaining -= 1;
          setCountdownPause(remaining);
          if (remaining <= 0) {
            if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
            setIsPausedInterval(false);
            setCurrentRepeatCount((c) => c + 1);
            playCurrentAyahAudio();
          }
        }, 1000);
      } else {
        setCurrentRepeatCount((c) => c + 1);
        playCurrentAyahAudio();
      }
    } else {
      // Repetitions reached for current ayah!
      addXP(5, `Tikrar Ayat ${currentAyahNumber} Selesai`);

      if (currentAyahNumber < endAyah && currentAyahNumber < (surah?.totalAyat || 1)) {
        // Advance to next ayah in range
        const nextAyah = currentAyahNumber + 1;
        setCurrentAyahNumber(nextAyah);
        setCurrentRepeatCount(1);

        if (pauseSeconds > 0) {
          setIsPausedInterval(true);
          setCountdownPause(pauseSeconds);
          let remaining = pauseSeconds;
          pauseTimerRef.current = setInterval(() => {
            remaining -= 1;
            setCountdownPause(remaining);
            if (remaining <= 0) {
              if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
              setIsPausedInterval(false);
              playCurrentAyahAudio();
            }
          }, 1000);
        } else {
          playCurrentAyahAudio();
        }
      } else {
        // Entire range completed!
        stopAudio();
        triggerCelebration();
        addXP(25, `Selesai Tikrar Rentang Ayat!`);
      }
    }
  };

  if (!isOpen) return null;

  const currentAyahData = surah?.ayat?.find((a) => a.ayahNumber === currentAyahNumber);
  const currentReciter = RECITERS_LIST.find((r) => r.id === selectedReciterId) || RECITERS_LIST[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onEnded={handleAudioEnded}
          onError={() => setIsPlaying(false)}
        />

        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔁</span>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-emerald-100 px-2.5 py-0.5 rounded-full">
                Metode Tikrar Nabawi
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
              Pemutar Murottal Pengulang Hafalan
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium">
              Ulangi setiap ayat secara konsisten hingga menempel kuat dalam ingatan
            </p>
          </div>

          <button
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SETTINGS BAR: SURAH, RANGE & REPEAT */}
        <div className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-slate-800/50 border-b border-emerald-100 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Surah Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Pilih Surat:
              </label>
              <select
                value={selectedSurahId}
                onChange={(e) => {
                  stopAudio();
                  setSelectedSurahId(Number(e.target.value));
                }}
                className="w-full text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {catalogList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.nameLatin} ({s.nameArabic}) - {s.totalAyat} Ayat
                  </option>
                ))}
              </select>
            </div>

            {/* Range: Start to End */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Rentang Ayat ({startAyah} - {endAyah}):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={surah?.totalAyat || 1}
                  value={startAyah}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value));
                    setStartAyah(val);
                    if (val > endAyah) setEndAyah(val);
                    setCurrentAyahNumber(val);
                    setCurrentRepeatCount(1);
                  }}
                  className="w-16 text-center text-xs font-bold py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <span className="text-xs text-slate-400 font-bold">s/d</span>
                <input
                  type="number"
                  min={startAyah}
                  max={surah?.totalAyat || 1}
                  value={endAyah}
                  onChange={(e) => {
                    const val = Math.min(surah?.totalAyat || 1, Math.max(startAyah, Number(e.target.value)));
                    setEndAyah(val);
                  }}
                  className="w-16 text-center text-xs font-bold py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Repeat count per Ayah */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Ulang Tiap Ayat:
              </label>
              <div className="flex items-center gap-1.5">
                {[3, 5, 7, 10, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setRepeatLimit(num);
                      setCurrentRepeatCount(1);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      repeatLimit === num
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECOND ROW: RECITERS, PAUSE INTERVAL, SPEED */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
            {/* Qari selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Qari:</span>
              <select
                value={selectedReciterId}
                onChange={(e) => {
                  setSelectedReciterId(e.target.value);
                  if (isPlaying) {
                    stopAudio();
                  }
                }}
                className="py-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                {RECITERS_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pause duration for echo / repetition */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Jeda Santri Meniru:</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 5].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setPauseSeconds(sec)}
                    className={`px-2 py-0.5 rounded-lg font-bold ${
                      pauseSeconds === sec
                        ? 'bg-teal-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {sec === 0 ? 'Off' : `${sec}d`}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">Speed:</span>
              {[0.75, 1.0, 1.25].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    if (audioRef.current) audioRef.current.playbackRate = s;
                  }}
                  className={`px-2 py-0.5 rounded-lg font-bold ${
                    speed === s
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ACTIVE AYAH DISPLAY */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center text-center space-y-5">
          {isLoadingSurah ? (
            <div className="py-12 space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Memuat data surat...</p>
            </div>
          ) : currentAyahData ? (
            <>
              {/* Ayah Badge & Repeat Progress */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1">
                  <span>Surat {surah?.nameLatin}</span>
                  <span>•</span>
                  <span>Ayat {currentAyahNumber}</span>
                </span>

                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-extrabold flex items-center gap-1">
                  <Repeat className="w-3 h-3 animate-spin" />
                  <span>Pengulangan: {currentRepeatCount} dari {repeatLimit}x</span>
                </span>

                {isPausedInterval && (
                  <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-extrabold animate-pulse flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Giliranmu membaca ({countdownPause}s)...</span>
                  </span>
                )}
              </div>

              {/* Big Arabic Text */}
              <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-amber-50/40 dark:bg-slate-850 border border-amber-100 dark:border-slate-800 shadow-sm relative">
                <p className="font-arabic text-2xl sm:text-3xl lg:text-4xl leading-loose font-medium text-slate-900 dark:text-white select-none">
                  {currentAyahData.textArabic}
                </p>
              </div>

              {/* Transliteration */}
              <p className="max-w-lg text-xs sm:text-sm italic text-slate-600 dark:text-slate-400">
                "{currentAyahData.textLatin}"
              </p>

              {/* Translation */}
              <p className="max-w-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                {currentAyahData.translationId}
              </p>
            </>
          ) : (
            <div className="py-12 text-slate-400 text-xs">Pilih ayat untuk memulai tikrar</div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {/* Previous Ayah Button */}
          <button
            onClick={() => {
              if (currentAyahNumber > startAyah) {
                stopAudio();
                setCurrentAyahNumber((a) => a - 1);
                setCurrentRepeatCount(1);
              }
            }}
            disabled={currentAyahNumber <= startAyah}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 transition cursor-pointer"
            title="Ayat Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Central Play/Pause Big Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopAudio();
                setCurrentRepeatCount(1);
              }}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition cursor-pointer"
              title="Ulangi dari hitungan ke-1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm shadow-lg transition transform active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-white" />
                  <span>Jeda Tikrar</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                  <span>Mulai Putar Tikrar</span>
                </>
              )}
            </button>
          </div>

          {/* Next Ayah Button */}
          <button
            onClick={() => {
              if (currentAyahNumber < endAyah) {
                stopAudio();
                setCurrentAyahNumber((a) => a + 1);
                setCurrentRepeatCount(1);
              }
            }}
            disabled={currentAyahNumber >= endAyah}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 transition cursor-pointer"
            title="Ayat Berikutnya"
          >
            <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
