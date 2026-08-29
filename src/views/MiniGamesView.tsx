import React, { useState, useEffect } from 'react';
import { useKafa } from '../context/KafaContext';
import { JUZ_30_SURAHS, QURAN_SURAHS, Ayah, Surah } from '../data/quranData';
import { ALL_114_SURAHS, JUZ_30_INFO_LIST } from '../data/quran30JuzData';
import { getAllSurahCatalog, getSurahSync, fetchFullSurah, getAllJuzList } from '../services/quranService';
import { 
  Gamepad2, 
  Sparkles, 
  RotateCcw, 
  Check, 
  X, 
  Volume2, 
  Award, 
  ArrowRight, 
  Trophy, 
  Star,
  Play,
  Mic,
  Lock,
  Unlock,
  Settings,
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';

type GameMode = 'menu' | 'susun_ayat' | 'tebak_surat' | 'lanjutkan_ayat' | 'tebak_audio';

interface MiniGamesViewProps {
  onOpenVoiceGate?: (surahId?: number, ayahNumber?: number, juzNumber?: number) => void;
}

export const MiniGamesView: React.FC<MiniGamesViewProps> = ({ onOpenVoiceGate }) => {
  const { activeProfile, addXP, triggerCelebration, quests, completeQuest } = useKafa();

  // Active Juz Setting (1 to 30) - Defaults to Juz 30 or user profile preference
  const [selectedJuz, setSelectedJuz] = useState<number>(30);
  const [activeGame, setActiveGame] = useState<GameMode>('menu');
  const [score, setScore] = useState(0);
  const [gameFeedback, setGameFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [isLoadingGameData, setIsLoadingGameData] = useState(false);

  // GAME 1: Susun Ayat State
  const [targetAyahForArrange, setTargetAyahForArrange] = useState<Ayah | null>(null);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  // GAME 2: Tebak Surat State
  const [tebakSurahQuestion, setTebakSurahQuestion] = useState<{
    ayahText: string;
    correctSurah: { id: number; nameLatin: string; nameArabic: string };
    options: { id: number; nameLatin: string; nameArabic: string }[];
  } | null>(null);

  // GAME 3: Lanjutkan Ayat State
  const [lanjutkanQuestion, setLanjutkanQuestion] = useState<{
    firstPart: string;
    correctEnding: string;
    options: string[];
  } | null>(null);

  // GAME 4: Tebak Audio State
  const [audioQuestion, setAudioQuestion] = useState<{
    audioUrl: string;
    correctAyah: Ayah;
    options: Ayah[];
  } | null>(null);

  const allJuzList = getAllJuzList();
  const surahsInSelectedJuz = getAllSurahCatalog(selectedJuz);

  // Helper to get surah with ayat for the chosen Juz
  const getPlayableSurahForJuz = async (juzNum: number): Promise<Surah> => {
    const catalog = getAllSurahCatalog(juzNum);
    const randomCatalogItem = catalog[Math.floor(Math.random() * catalog.length)] || catalog[0];

    // Check cached or bundled
    const cached = getSurahSync(randomCatalogItem.id);
    if (cached && cached.ayat && cached.ayat.length > 0) {
      return cached;
    }

    try {
      const fetched = await fetchFullSurah(randomCatalogItem.id);
      if (fetched && fetched.ayat && fetched.ayat.length > 0) {
        return fetched;
      }
    } catch {
      // fallback
    }

    // Fallback to bundled Juz 30 surahs or Al-Fatihah
    return JUZ_30_SURAHS.find((s) => s.id === 114) || JUZ_30_SURAHS[0];
  };

  // Setup Susun Ayat
  const initSusunAyat = async (juzNum = selectedJuz) => {
    setIsLoadingGameData(true);
    const surah = await getPlayableSurahForJuz(juzNum);
    setIsLoadingGameData(false);

    if (!surah.ayat || surah.ayat.length === 0) return;

    // Pick an ayah that has between 3 and 10 words for ideal game experience
    const suitableAyat = surah.ayat.filter((a) => {
      const wCount = a.textArabic.split(/\s+/).filter(Boolean).length;
      return wCount >= 3 && wCount <= 10;
    });

    const ayah = suitableAyat.length > 0 
      ? suitableAyat[Math.floor(Math.random() * suitableAyat.length)] 
      : surah.ayat[0];

    const words = ayah.textArabic.split(/\s+/).filter(Boolean);
    const shuffled = [...words].sort(() => Math.random() - 0.5);

    setTargetAyahForArrange(ayah);
    setScrambledWords(shuffled);
    setSelectedWords([]);
    setGameFeedback(null);
  };

  // Setup Tebak Surat
  const initTebakSurah = async (juzNum = selectedJuz) => {
    setIsLoadingGameData(true);
    const surahsInJuz = getAllSurahCatalog(juzNum);
    const chosenCatalog = surahsInJuz[Math.floor(Math.random() * surahsInJuz.length)] || surahsInJuz[0];
    
    // Fetch surah for ayah text
    let activeSurah = getSurahSync(chosenCatalog.id);
    if (!activeSurah || !activeSurah.ayat || activeSurah.ayat.length === 0) {
      try {
        activeSurah = await fetchFullSurah(chosenCatalog.id);
      } catch {}
    }
    setIsLoadingGameData(false);

    const randomAyah = activeSurah && activeSurah.ayat && activeSurah.ayat.length > 0 
      ? activeSurah.ayat[Math.floor(Math.random() * activeSurah.ayat.length)]
      : { textArabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' };

    // Pick 3 wrong options from all 114 surahs
    const wrongSurahs = ALL_114_SURAHS
      .filter((s) => s.id !== chosenCatalog.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((s) => ({ id: s.id, nameLatin: s.nameLatin, nameArabic: s.nameArabic }));

    const correctSurahObj = {
      id: chosenCatalog.id,
      nameLatin: chosenCatalog.nameLatin,
      nameArabic: chosenCatalog.nameArabic,
    };

    const options = [correctSurahObj, ...wrongSurahs].sort(() => Math.random() - 0.5);

    setTebakSurahQuestion({
      ayahText: randomAyah.textArabic,
      correctSurah: correctSurahObj,
      options,
    });
    setGameFeedback(null);
  };

  // Setup Lanjutkan Ayat
  const initLanjutkanAyat = async (juzNum = selectedJuz) => {
    setIsLoadingGameData(true);
    const surah = await getPlayableSurahForJuz(juzNum);
    setIsLoadingGameData(false);

    if (!surah.ayat || surah.ayat.length === 0) return;

    // Pick an ayah with at least 4 words
    const suitableAyat = surah.ayat.filter((a) => a.textArabic.split(/\s+/).filter(Boolean).length >= 4);
    const ayah = suitableAyat.length > 0 
      ? suitableAyat[Math.floor(Math.random() * suitableAyat.length)] 
      : surah.ayat[0];

    const words = ayah.textArabic.split(/\s+/).filter(Boolean);
    const half = Math.max(1, Math.floor(words.length / 2));
    const firstPart = words.slice(0, half).join(' ');
    const correctEnding = words.slice(half).join(' ');

    // Generate wrong options from other ayat or predefined phrases
    const otherAyatEndings = surah.ayat
      .filter((a) => a.ayahNumber !== ayah.ayahNumber)
      .map((a) => {
        const w = a.textArabic.split(/\s+/).filter(Boolean);
        return w.slice(Math.max(1, Math.floor(w.length / 2))).join(' ');
      })
      .filter((txt) => txt && txt !== correctEnding);

    const fallbackWrong = [
      "مِن شَرِّ مَا خَلَقَ",
      "إِلَٰهِ النَّاسِ",
      "فِي صُدُورِ النَّاسِ",
      "وَاللَّهُ سَمِيعٌ عَلِيمٌ",
      "إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ"
    ];

    const wrongPool = [...otherAyatEndings, ...fallbackWrong].filter((t) => t !== correctEnding);
    const wrongOptions = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3);

    const options = [correctEnding, ...wrongOptions].sort(() => Math.random() - 0.5);

    setLanjutkanQuestion({
      firstPart,
      correctEnding,
      options,
    });
    setGameFeedback(null);
  };

  // Setup Tebak Audio
  const initTebakAudio = async (juzNum = selectedJuz) => {
    setIsLoadingGameData(true);
    const surah = await getPlayableSurahForJuz(juzNum);
    setIsLoadingGameData(false);

    if (!surah.ayat || surah.ayat.length === 0) return;

    const correct = surah.ayat[Math.floor(Math.random() * Math.min(surah.ayat.length, 5))];
    const wrong = surah.ayat.filter((a) => a.ayahNumber !== correct.ayahNumber).slice(0, 3);
    
    // Ensure we have 4 options
    const options = [correct, ...wrong].sort(() => Math.random() - 0.5);

    setAudioQuestion({
      audioUrl: correct.audioUrl,
      correctAyah: correct,
      options,
    });
    setGameFeedback(null);
  };

  const checkSusunAyat = () => {
    if (!targetAyahForArrange) return;
    const constructed = selectedWords.join(' ');
    if (constructed === targetAyahForArrange.textArabic) {
      setGameFeedback({ correct: true, msg: `🌟 Masya Allah Benar! Urutan ayat tepat (Juz ${selectedJuz}).` });
      addXP(15, `Menang Game Susun Ayat (Juz ${selectedJuz})`);
      triggerCelebration();
    } else {
      setGameFeedback({ correct: false, msg: "🌱 Masih belum tepat, yuk coba susun kembali!" });
    }
  };

  const handleSelectWord = (word: string, index: number) => {
    setSelectedWords((prev) => [...prev, word]);
    setScrambledWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeselectWord = (word: string, index: number) => {
    setScrambledWords((prev) => [...prev, word]);
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnswerTebakSurah = (selectedSurahId: number) => {
    if (!tebakSurahQuestion) return;
    if (selectedSurahId === tebakSurahQuestion.correctSurah.id) {
      setGameFeedback({ correct: true, msg: `🌟 Benar! Ini adalah Surat ${tebakSurahQuestion.correctSurah.nameLatin}` });
      addXP(15, `Menang Game Tebak Surat (Juz ${selectedJuz})`);
      triggerCelebration();
    } else {
      setGameFeedback({ correct: false, msg: `🌱 Jawaban yang benar adalah Surat ${tebakSurahQuestion.correctSurah.nameLatin}` });
    }
  };

  const handleAnswerLanjutkanAyat = (chosen: string) => {
    if (!lanjutkanQuestion) return;
    if (chosen === lanjutkanQuestion.correctEnding) {
      setGameFeedback({ correct: true, msg: `🌟 Masya Allah Benar! Sambungan hafalan Juz ${selectedJuz} sangat teliti.` });
      addXP(15, `Menang Game Lanjutkan Ayat (Juz ${selectedJuz})`);
      triggerCelebration();
    } else {
      setGameFeedback({ correct: false, msg: "🌱 Masih kurang tepat, terus semangat ya!" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-purple-100 backdrop-blur-md">
              Zona Game Edukasi Qur'an
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-extrabold border border-amber-400/30">
              30 Juz Lengkap
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Tantangan & Mini-Game 🎮
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 max-w-md">
            Pilih Juz 1 s/d 30 yang ingin kamu mainkan dan uji ketajaman hafalanmu.
          </p>
        </div>

        {/* Global Juz Selector Pill in Banner */}
        <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 space-y-1.5 shrink-0">
          <label className="text-[11px] font-extrabold text-purple-100 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-300" />
            <span>Target Juz Game:</span>
          </label>
          <select
            value={selectedJuz}
            onChange={(e) => {
              const newJuz = Number(e.target.value);
              setSelectedJuz(newJuz);
              if (activeGame === 'susun_ayat') initSusunAyat(newJuz);
              else if (activeGame === 'tebak_surat') initTebakSurah(newJuz);
              else if (activeGame === 'lanjutkan_ayat') initLanjutkanAyat(newJuz);
              else if (activeGame === 'tebak_audio') initTebakAudio(newJuz);
            }}
            className="w-full bg-white text-slate-900 font-extrabold text-xs rounded-xl px-3 py-2 border-0 shadow-md focus:outline-hidden cursor-pointer"
          >
            {allJuzList.map((j) => (
              <option key={j.juzNumber} value={j.juzNumber}>
                Juz {j.juzNumber}: {j.name} ({j.startSurahName} - {j.endSurahName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUICK JUZ HORIZONTAL SCROLL BAR */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pilih Cepat Juz (1 - 30):</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {allJuzList.find((j) => j.juzNumber === selectedJuz)?.name} ({surahsInSelectedJuz.length} Surat)
          </span>
        </div>

        {/* Scrollable Juz badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((jNum) => {
            const isSelected = selectedJuz === jNum;
            return (
              <button
                key={jNum}
                onClick={() => {
                  setSelectedJuz(jNum);
                  if (activeGame === 'susun_ayat') initSusunAyat(jNum);
                  else if (activeGame === 'tebak_surat') initTebakSurah(jNum);
                  else if (activeGame === 'lanjutkan_ayat') initLanjutkanAyat(jNum);
                  else if (activeGame === 'tebak_audio') initTebakAudio(jNum);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md scale-105 ring-2 ring-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>Juz {jNum}</span>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* GAME MENU */}
      {activeGame === 'menu' && (
        <div className="space-y-6">
          {/* Featured Voice Gate Game Card with Chosen Juz */}
          {onOpenVoiceGate && (
            <div
              onClick={() => {
                const firstSurahInJuz = surahsInSelectedJuz[0]?.id || 114;
                onOpenVoiceGate(firstSurahInJuz, 1, selectedJuz);
              }}
              className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/40 hover:border-emerald-400 hover:shadow-2xl transition cursor-pointer group space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-emerald-300 flex items-center justify-center text-2xl group-hover:scale-110 transition border border-white/20">
                    🎙️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg text-white group-hover:text-emerald-300 transition">
                        Uji Lisan & Gembok Suara Real-Time (Juz {selectedJuz})
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30">
                        ⭐ Voice Gate
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/80 mt-0.5">
                      Salah lafadz = <span className="text-red-300 font-bold">Merah 🔴 (Terkunci)</span> • Benar = <span className="text-emerald-300 font-bold">Hijau 🟢 (Maju Otomatis)</span>
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-md">
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Mainkan Juz {selectedJuz}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-bold text-emerald-200">
                <span>Target: Surat di Juz {selectedJuz} • Hadiah: +30 XP</span>
                <span className="flex items-center gap-1 text-emerald-300 font-extrabold">
                  <span>Mulai Uji Suara</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Game 1: Susun Ayat */}
            <div
              onClick={() => {
                setActiveGame('susun_ayat');
                initSusunAyat(selectedJuz);
              }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 hover:shadow-lg transition cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                🧩
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-purple-600 transition">
                    Susun Kata Ayat
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold">
                    Juz {selectedJuz}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Susun kembali kata-kata Arab yang diacak dari surat di Juz {selectedJuz}.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-purple-600">
                <span>Hadiah: +15 XP</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Game 2: Tebak Surat */}
            <div
              onClick={() => {
                setActiveGame('tebak_surat');
                initTebakSurah(selectedJuz);
              }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 hover:shadow-lg transition cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                    Tebak Nama Surat
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold">
                    Juz {selectedJuz}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lihat cuplikan ayat dari Juz {selectedJuz}, lalu tebak nama surat yang tepat.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-indigo-600">
                <span>Hadiah: +15 XP</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Game 3: Lanjutkan Ayat */}
            <div
              onClick={() => {
                setActiveGame('lanjutkan_ayat');
                initLanjutkanAyat(selectedJuz);
              }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 hover:shadow-lg transition cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                ➡️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                    Lanjutkan Ayat
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold">
                    Juz {selectedJuz}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lengkapi sambungan ayat yang terpotong dari Juz {selectedJuz}.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-blue-600">
                <span>Hadiah: +15 XP</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Game 4: Tebak Audio */}
            <div
              onClick={() => {
                setActiveGame('tebak_audio');
                initTebakAudio(selectedJuz);
              }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 hover:shadow-lg transition cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                🎧
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                    Tebak Audio Murottal
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                    Juz {selectedJuz}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Dengarkan lantunan suara merdu qari dan pilih ayat yang sesuai di Juz {selectedJuz}.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600">
                <span>Hadiah: +15 XP</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME 1: SUSUN AYAT VIEW */}
      {activeGame === 'susun_ayat' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveGame('menu')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              ← Kembali ke Menu Game
            </button>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-extrabold">
                Juz {selectedJuz}
              </span>
              <button
                onClick={() => initSusunAyat(selectedJuz)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Acak Ayat Lain</span>
              </button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Susun Potongan Kata Ayat Berikut 🧩
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klik kata-kata di bawah sesuai dengan urutan bacaan yang tepat.
            </p>
          </div>

          {/* Area Kata Terpilih */}
          <div className="p-6 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border-2 border-dashed border-purple-200 dark:border-purple-800 min-h-[90px] flex flex-wrap items-center justify-center gap-2 dir-rtl">
            {selectedWords.length === 0 ? (
              <span className="text-xs font-semibold text-slate-400">
                (Klik kata di bawah untuk menyusun di sini)
              </span>
            ) : (
              selectedWords.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleDeselectWord(word, index)}
                  className="px-3 py-2 rounded-xl bg-purple-600 text-white font-arabic text-xl font-bold shadow-md hover:bg-purple-500 transition cursor-pointer"
                >
                  {word}
                </button>
              ))
            )}
          </div>

          {/* Area Pilihan Kata Acak */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 dir-rtl">
            {scrambledWords.map((word, index) => (
              <button
                key={index}
                onClick={() => handleSelectWord(word, index)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-slate-800 dark:text-slate-200 font-arabic text-xl font-bold border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer hover:scale-105"
              >
                {word}
              </button>
            ))}
          </div>

          {gameFeedback && (
            <div
              className={`p-4 rounded-2xl text-center text-xs font-bold ${
                gameFeedback.correct
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
              }`}
            >
              {gameFeedback.msg}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={checkSusunAyat}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              Periksa Susunan
            </button>
          </div>
        </div>
      )}

      {/* GAME 2: TEBAK SURAT VIEW */}
      {activeGame === 'tebak_surat' && tebakSurahQuestion && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveGame('menu')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              ← Kembali ke Menu Game
            </button>
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold">
              Juz {selectedJuz}
            </span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Ayat Ini Berasal dari Surat Apa? 🎯
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perhatikan potongan ayat berikut dan pilih nama surat yang benar:
            </p>
          </div>

          {/* Kotak Ayat */}
          <div className="p-6 sm:p-8 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 text-center">
            <p className="font-arabic text-3xl sm:text-4xl text-slate-900 dark:text-white leading-relaxed dir-rtl">
              {tebakSurahQuestion.ayahText}
            </p>
          </div>

          {/* Opsi Pilihan Surat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {tebakSurahQuestion.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleAnswerTebakSurah(opt.id)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 font-extrabold text-slate-800 dark:text-slate-200 text-sm transition cursor-pointer flex items-center justify-between group"
              >
                <span>{opt.nameLatin}</span>
                <span className="font-arabic text-base text-slate-400 group-hover:text-indigo-600">
                  {opt.nameArabic}
                </span>
              </button>
            ))}
          </div>

          {gameFeedback && (
            <div
              className={`p-4 rounded-2xl text-center text-xs font-bold ${
                gameFeedback.correct
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
              }`}
            >
              {gameFeedback.msg}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              onClick={() => initTebakSurah(selectedJuz)}
              className="px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Soal Selanjutnya →
            </button>
          </div>
        </div>
      )}

      {/* GAME 3: LANJUTKAN AYAT VIEW */}
      {activeGame === 'lanjutkan_ayat' && lanjutkanQuestion && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveGame('menu')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              ← Kembali ke Menu Game
            </button>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-extrabold">
              Juz {selectedJuz}
            </span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Sambung Potongan Ayat Berikut ➡️
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih kelanjutan ayat yang tepat:
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-center space-y-2">
            <p className="font-arabic text-3xl sm:text-4xl text-slate-900 dark:text-white leading-relaxed dir-rtl">
              {lanjutkanQuestion.firstPart} ... ❓
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {lanjutkanQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerLanjutkanAyat(opt)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/40 font-arabic text-xl font-bold text-slate-800 dark:text-slate-200 text-center transition cursor-pointer dir-rtl"
              >
                {opt}
              </button>
            ))}
          </div>

          {gameFeedback && (
            <div
              className={`p-4 rounded-2xl text-center text-xs font-bold ${
                gameFeedback.correct
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
              }`}
            >
              {gameFeedback.msg}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              onClick={() => initLanjutkanAyat(selectedJuz)}
              className="px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Soal Selanjutnya →
            </button>
          </div>
        </div>
      )}

      {/* GAME 4: TEBAK AUDIO VIEW */}
      {activeGame === 'tebak_audio' && audioQuestion && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveGame('menu')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              ← Kembali ke Menu Game
            </button>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">
              Juz {selectedJuz}
            </span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Dengarkan Audio Murottal Ini 🎧
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Putar suaranya, lalu pilih teks ayat yang sedang dilantunkan:
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center gap-3">
            <audio controls src={audioQuestion.audioUrl} className="w-full max-w-md" autoPlay />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {audioQuestion.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  if (opt.id === audioQuestion.correctAyah.id) {
                    setGameFeedback({ correct: true, msg: "🌟 Masya Allah Pendengaranmu Sangat Tajam!" });
                    addXP(15, `Menang Game Tebak Audio (Juz ${selectedJuz})`);
                    triggerCelebration();
                  } else {
                    setGameFeedback({ correct: false, msg: "🌱 Kurang tepat, coba dengarkan lagi ya!" });
                  }
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 font-arabic text-xl font-bold text-slate-800 dark:text-slate-200 text-center transition cursor-pointer dir-rtl"
              >
                {opt.textArabic}
              </button>
            ))}
          </div>

          {gameFeedback && (
            <div
              className={`p-4 rounded-2xl text-center text-xs font-bold ${
                gameFeedback.correct
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
              }`}
            >
              {gameFeedback.msg}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              onClick={() => initTebakAudio(selectedJuz)}
              className="px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Soal Selanjutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
