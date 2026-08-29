import React, { useState, useMemo } from 'react';
import { useKafa } from '../context/KafaContext';
import { getAllSurahCatalog, getAllJuzList, getPopularSurahs } from '../services/quranService';
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  Flame,
  Layers,
  Star,
  Compass,
  Filter,
  Info
} from 'lucide-react';

interface QuranLibraryProps {
  onSelectSurah: (surahId: number) => void;
}

type FilterStatus = 'all' | 'memorized' | 'in_progress' | 'needs_murajaah';
type RevelationFilter = 'all' | 'Makkiyah' | 'Madaniyah';

export const QuranLibrary: React.FC<QuranLibraryProps> = ({ onSelectSurah }) => {
  const { activeProfile, getSurahProgressStats, ayahProgressList } = useKafa();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJuz, setSelectedJuz] = useState<number | 'all' | 'popular'>(30);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [revelationFilter, setRevelationFilter] = useState<RevelationFilter>('all');
  const [showJuzGrid, setShowJuzGrid] = useState(false);

  const allJuzList = useMemo(() => getAllJuzList(), []);
  const allSurahs = useMemo(() => getAllSurahCatalog(), []);
  const popularSurahs = useMemo(() => getPopularSurahs(), []);

  // Filter surahs based on selected Juz, search, status, and revelation
  const filteredSurahs = useMemo(() => {
    let list = allSurahs;

    if (selectedJuz === 'popular') {
      list = popularSurahs;
    } else if (selectedJuz !== 'all') {
      list = allSurahs.filter(
        (s) => s.juzList.includes(selectedJuz) || s.juzNumber === selectedJuz
      );
    }

    if (revelationFilter !== 'all') {
      list = list.filter((s) => s.revelationType === revelationFilter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.nameLatin.toLowerCase().includes(q) ||
          s.meaningId.toLowerCase().includes(q) ||
          s.nameArabic.includes(q) ||
          s.id.toString() === q ||
          `juz ${s.juzNumber}`.includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((s) => {
        const stats = getSurahProgressStats(s.id, s.totalAyat);
        if (statusFilter === 'memorized') return stats.percentage === 100;
        if (statusFilter === 'in_progress') return stats.percentage > 0 && stats.percentage < 100;
        if (statusFilter === 'needs_murajaah') {
          return ayahProgressList.some(
            (ap) => ap.childId === activeProfile.id && ap.surahId === s.id && ap.status === 'needs_murajaah'
          );
        }
        return true;
      });
    }

    return list;
  }, [
    allSurahs, 
    popularSurahs, 
    selectedJuz, 
    searchQuery, 
    statusFilter, 
    revelationFilter, 
    getSurahProgressStats, 
    ayahProgressList, 
    activeProfile.id
  ]);

  const currentJuzInfo = useMemo(() => {
    if (typeof selectedJuz === 'number') {
      return allJuzList.find((j) => j.juzNumber === selectedJuz);
    }
    return null;
  }, [selectedJuz, allJuzList]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold backdrop-blur-md flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Mushaf Lengkap 30 Juz & 114 Surat
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Perpustakaan Al-Qur'an 30 Juz 📖
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
            Jelajahi seluruh 114 surat dari Juz 1 hingga Juz 30. Dilengkapi audio murottal per ayat, terjemahan resmi, uji daya ingat, dan setoran hafalan.
          </p>
        </div>

        {/* Quick 30 Juz Switcher Button */}
        <div className="z-10 flex flex-wrap gap-2">
          <button
            onClick={() => setShowJuzGrid(!showJuzGrid)}
            className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition flex items-center gap-2 shadow-xs"
          >
            <Compass className="w-4 h-4 text-emerald-300" />
            <span>{showJuzGrid ? 'Tutup Pilihan Juz' : 'Pilih dari 30 Juz'}</span>
          </button>
        </div>
      </div>

      {/* 30 Juz Grid Modal / Panel (Toggleable) */}
      {showJuzGrid && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-emerald-200 dark:border-emerald-900/60 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                30 JUZ
              </span>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                Pilih Juz Al-Qur'an
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedJuz('all');
                setShowJuzGrid(false);
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
            >
              Lihat Semua 114 Surat
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2">
            {allJuzList.map((juz) => {
              const isSelected = selectedJuz === juz.juzNumber;
              return (
                <button
                  key={juz.juzNumber}
                  onClick={() => {
                    setSelectedJuz(juz.juzNumber);
                    setShowJuzGrid(false);
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <span className="text-xs font-black">Juz {juz.juzNumber}</span>
                  <span className="text-[10px] opacity-80 truncate max-w-full font-arabic">
                    {juz.arabicName.split(' ')[1] || `ج${juz.juzNumber}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Navigation Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari surat atau juz... (Contoh: Al-Baqarah, Yasin, Al-Mulk, An-Naba', 36, Juz 30)"
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Quick Preset Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedJuz('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedJuz === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Semua 30 Juz (114 Surat)</span>
          </button>

          <button
            onClick={() => setSelectedJuz(30)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedJuz === 30
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Juz 30 (Juz 'Amma)</span>
          </button>

          <button
            onClick={() => setSelectedJuz(29)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedJuz === 29
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Juz 29 (Tabarak)</span>
          </button>

          <button
            onClick={() => setSelectedJuz(1)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedJuz === 1
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Juz 1</span>
          </button>

          <button
            onClick={() => setSelectedJuz('popular')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedJuz === 'popular'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Surat Populer / Pilihan</span>
          </button>

          <button
            onClick={() => setShowJuzGrid(true)}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
          >
            Juz Lainnya (1-28)...
          </button>
        </div>

        {/* Secondary Filters: Status & Revelation */}
        <div className="flex flex-wrap gap-2 justify-between items-center pt-1">
          {/* Status filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'Semua Status' },
                { id: 'in_progress', label: 'Sedang Dihafal' },
                { id: 'memorized', label: 'Selesai 100%' },
                { id: 'needs_murajaah', label: 'Perlu Muraja\'ah' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                  statusFilter === filter.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Revelation filters */}
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Semua Tempat Turun' },
                { id: 'Makkiyah', label: 'Makkiyah' },
                { id: 'Madaniyah', label: 'Madaniyah' },
              ] as const
            ).map((rev) => (
              <button
                key={rev.id}
                onClick={() => setRevelationFilter(rev.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  revelationFilter === rev.id
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {rev.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Juz Banner Info (if specific Juz selected) */}
      {currentJuzInfo && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
              {currentJuzInfo.juzNumber}
            </div>
            <div>
              <p className="font-extrabold text-emerald-900 dark:text-emerald-200">
                {currentJuzInfo.name} ({currentJuzInfo.arabicName})
              </p>
              <p className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px]">
                Dimulai: QS. {currentJuzInfo.startSurahName} ayat {currentJuzInfo.startAyah} • Berakhir: QS. {currentJuzInfo.endSurahName} ayat {currentJuzInfo.endAyah} ({currentJuzInfo.totalAyat} ayat total)
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold shrink-0">
            {filteredSurahs.length} Surat
          </span>
        </div>
      )}

      {/* Surah List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSurahs.map((surah) => {
          const stats = getSurahProgressStats(surah.id, surah.totalAyat);
          const isComplete = stats.percentage === 100;
          const isInProgress = stats.percentage > 0 && !isComplete;

          return (
            <div
              key={surah.id}
              onClick={() => onSelectSurah(surah.id)}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 hover:shadow-md transition duration-150 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                      {surah.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                          {surah.nameLatin}
                        </h3>
                        {isComplete && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                            ✓ Lulus
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {surah.meaningId}
                      </p>
                    </div>
                  </div>

                  <div className="font-arabic text-2xl text-emerald-700 dark:text-emerald-400 font-bold text-right shrink-0">
                    {surah.nameArabic}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    Juz {surah.juzList?.join(', ') || surah.juzNumber}
                  </span>
                  <span>•</span>
                  <span>{surah.totalAyat} Ayat</span>
                  <span>•</span>
                  <span>{surah.revelationType}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Hafalan</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {stats.memorized}/{surah.totalAyat} Ayat ({stats.percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isComplete
                        ? 'bg-emerald-500'
                        : isInProgress
                        ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                        : 'bg-transparent'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSurahs.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-base">
            Tidak ada surat yang sesuai kriteria
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Coba ganti pilihan Juz, ubah kata kunci pencarian, atau reset filter status.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedJuz('all');
              setStatusFilter('all');
              setRevelationFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
          >
            Tampilkan Seluruh 30 Juz
          </button>
        </div>
      )}
    </div>
  );
};
