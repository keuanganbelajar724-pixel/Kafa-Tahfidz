import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Sun, 
  Moon, 
  BookOpen, 
  Heart, 
  Award, 
  Flame, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Check,
  Clock
} from 'lucide-react';
import { MutabaahDailyItem } from '../types';

interface MutabaahYaumiyahModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDzikir?: () => void;
}

export const MutabaahYaumiyahModal: React.FC<MutabaahYaumiyahModalProps> = ({
  isOpen,
  onClose,
  onOpenDzikir,
}) => {
  const { activeProfile, getMutabaahForDate, updateMutabaahRecord, triggerCelebration } = useKafa();

  // Selected date state (defaults to today in YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  if (!isOpen) return null;

  const currentRecord = getMutabaahForDate(activeProfile.id, selectedDate);

  // Handle toggling fields
  const handleToggle = (field: keyof MutabaahDailyItem, value?: boolean) => {
    const currentVal = Boolean(currentRecord[field]);
    const newVal = value !== undefined ? value : !currentVal;
    updateMutabaahRecord({
      childId: activeProfile.id,
      dateStr: selectedDate,
      [field]: newVal,
    });
  };

  const handleTextChange = (field: 'tilawahPageOrAyat' | 'ziyadahSurahAyah' | 'notes', text: string) => {
    updateMutabaahRecord({
      childId: activeProfile.id,
      dateStr: selectedDate,
      [field]: text,
    });
  };

  // Date navigation
  const changeDateByDays = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Format date readable in Indonesian
  const formattedDateTitle = new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const percentage = currentRecord.percentage || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕌</span>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-emerald-100 px-2.5 py-0.5 rounded-full">
                Jurnal Ibadah Santri
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
              Mutaba'ah Yaumiyah
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium">
              Santri: <strong className="text-white">{activeProfile.name}</strong> • Disiplin Ibadah, Berkah Hafalan
            </p>
          </div>

          <button
            onClick={onClose}
            className="z-10 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DATE SELECTOR & PROGRESS STRIP */}
        <div className="px-6 py-3.5 bg-emerald-50/60 dark:bg-slate-800/60 border-b border-emerald-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Date Switcher */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-2 py-1 shadow-xs">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formattedDateTitle}</span>
              {selectedDate === todayStr && (
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold px-1.5 py-0.2 rounded-md">
                  Hari Ini
                </span>
              )}
            </div>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Completion Progress Gauge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pencapaian: <strong className="text-emerald-600 dark:text-emerald-400">{percentage}%</strong>
              </span>
              <p className="text-[10px] text-slate-400">
                {currentRecord.completedCount || 0} dari {currentRecord.totalCount || 12} amalan
              </p>
            </div>
            <div className="w-20 sm:w-28 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            {percentage === 100 && (
              <button 
                onClick={triggerCelebration}
                className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl hover:scale-110 transition cursor-pointer"
                title="Sempurna 100%! Rayakan!"
              >
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              </button>
            )}
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-slate-800 dark:text-slate-100">
          
          {/* SECTION 1: SHALAT WAJIB 5 WAKTU */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  🕌
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Shalat Fardhu 5 Waktu
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tiang agama dan syarat utama keberkahan hafalan Al-Qur'an
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { key: 'subuh', jamaahKey: 'subuhJamaah', label: 'Subuh', icon: '🌅' },
                { key: 'dzuhur', jamaahKey: 'dzuhurJamaah', label: 'Dzuhur', icon: '☀️' },
                { key: 'ashar', jamaahKey: 'asharJamaah', label: 'Ashar', icon: '🌤️' },
                { key: 'maghrib', jamaahKey: 'maghribJamaah', label: 'Maghrib', icon: '🌆' },
                { key: 'isya', jamaahKey: 'isyaJamaah', label: 'Isya', icon: '🌙' },
              ].map((item) => {
                const isDone = Boolean(currentRecord[item.key as keyof MutabaahDailyItem]);
                const isJamaah = Boolean(currentRecord[item.jamaahKey as keyof MutabaahDailyItem]);

                return (
                  <div
                    key={item.key}
                    className={`p-3 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      <button
                        onClick={() => handleToggle(item.key as keyof MutabaahDailyItem)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>

                    {/* Sub-option: Berjamaah */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Berjama'ah</span>
                      <button
                        disabled={!isDone}
                        onClick={() => handleToggle(item.jamaahKey as keyof MutabaahDailyItem)}
                        className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                          !isDone
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                            : isJamaah
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isJamaah ? '✓ Di Masjid/Rumah' : '+ Berjama\'ah'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: SHALAT SUNNAH */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                ✨
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Shalat Sunnah & Qiyamul Lail
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Menghidupkan hati di sepertiga malam dan waktu pagi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Dhuha */}
              <div 
                onClick={() => handleToggle('dhuha')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentRecord.dhuha
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Shalat Dhuha (2 - 8 Rakaat)</h4>
                    <p className="text-[10px] text-slate-400">Sedekah untuk seluruh persendian tubuh</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  currentRecord.dhuha ? 'bg-amber-500 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                }`}>
                  {currentRecord.dhuha && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* Tahajjud */}
              <div 
                onClick={() => handleToggle('tahajjud')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentRecord.tahajjud
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Tahajjud & Witir</h4>
                    <p className="text-[10px] text-slate-400">Kebiasaan orang-orang shalih penghafal Qur'an</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  currentRecord.tahajjud ? 'bg-indigo-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                }`}>
                  {currentRecord.tahajjud && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: TAHFIZ & TILAWAH */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
                📖
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Ziyadah, Muraja'ah & Tilawah Al-Qur'an
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target harian Al-Qur'an santri agar hafalan mutqin dan tidak hilang
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Ziyadah Hafalan Baru */}
              <div className={`p-3.5 rounded-2xl border transition ${
                currentRecord.ziyadahDone
                  ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800/80 shadow-xs'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌱</span>
                    <div>
                      <h4 className="text-xs font-bold">Ziyadah (Menambah Ayat Baru)</h4>
                      <p className="text-[10px] text-slate-400">Menyetor ayat baru ke ustadz atau orang tua</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('ziyadahDone')}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      currentRecord.ziyadahDone ? 'bg-teal-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {currentRecord.ziyadahDone && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Contoh: Surat An-Naba' Ayat 1 s/d 5"
                    value={currentRecord.ziyadahSurahAyah || ''}
                    onChange={(e) => handleTextChange('ziyadahSurahAyah', e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Murajaah Harian */}
              <div className={`p-3.5 rounded-2xl border transition ${
                currentRecord.murajaahDone
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔁</span>
                    <div>
                      <h4 className="text-xs font-bold">Muraja'ah Hafalan Lama</h4>
                      <p className="text-[10px] text-slate-400">Mengulang surat yang sudah dihafal minimal 1/2 Juz atau 3 Surat</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('murajaahDone')}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      currentRecord.murajaahDone ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {currentRecord.murajaahDone && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                </div>
              </div>

              {/* Tilawah Harian */}
              <div className={`p-3.5 rounded-2xl border transition ${
                currentRecord.tilawahDone
                  ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/80 shadow-xs'
                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📚</span>
                    <div>
                      <h4 className="text-xs font-bold">Tilawah Harian (Tadarus)</h4>
                      <p className="text-[10px] text-slate-400">Membaca Al-Qur'an dengan tartil</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('tilawahDone')}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      currentRecord.tilawahDone ? 'bg-blue-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {currentRecord.tilawahDone && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Contoh: Juz 30 / 2 Lembar / Surat Al-Mulk"
                    value={currentRecord.tilawahPageOrAyat || ''}
                    onChange={(e) => handleTextChange('tilawahPageOrAyat', e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: DZIKIR & AKHLAK */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                  📿
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Dzikir & Akhlak Santri
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Membentengi diri dengan adzkar nabawi dan berbakti kepada orang tua
                  </p>
                </div>
              </div>

              {onOpenDzikir && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDzikir();
                  }}
                  className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 px-3 py-1 rounded-xl transition border border-purple-200 dark:border-purple-800/80 cursor-pointer"
                >
                  Buka Bacaan Dzikir & Doa →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Dzikir Pagi */}
              <div 
                onClick={() => handleToggle('dzikirPagi')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentRecord.dzikirPagi
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">Dzikir Pagi (Al-Ma'tsurat)</h4>
                  <p className="text-[10px] text-slate-400">Pelindung diri dari fajar sampai sore</p>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  currentRecord.dzikirPagi ? 'bg-purple-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                }`}>
                  {currentRecord.dzikirPagi && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* Dzikir Petang */}
              <div 
                onClick={() => handleToggle('dzikirPetang')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentRecord.dzikirPetang
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">Dzikir Petang (Sore)</h4>
                  <p className="text-[10px] text-slate-400">Benteng perlindungan malam hari</p>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  currentRecord.dzikirPetang ? 'bg-purple-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                }`}>
                  {currentRecord.dzikirPetang && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* Sedekah Subuh */}
              <div 
                onClick={() => handleToggle('sedekahSubuh')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentRecord.sedekahSubuh
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">Sedekah Subuh / Infaq</h4>
                  <p className="text-[10px] text-slate-400">Didatangi 2 malaikat yang mendoakan ganti berlipat</p>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  currentRecord.sedekahSubuh ? 'bg-rose-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                }`}>
                  {currentRecord.sedekahSubuh && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* Birrul Walidain */}
              <div 
                onClick={() => handleToggle('birrulWalidain')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentRecord.birrulWalidain
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">Birrul Walidain (Bantu Orang Tua)</h4>
                  <p className="text-[10px] text-slate-400">Mencium tangan, patuh, dan mendoakan ayah ibu</p>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  currentRecord.birrulWalidain ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                }`}>
                  {currentRecord.birrulWalidain && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: CATATAN HARIAN */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan Khusus Santri / Ustadz (Opsional):
            </label>
            <textarea
              rows={2}
              value={currentRecord.notes || ''}
              onChange={(e) => handleTextChange('notes', e.target.value)}
              placeholder="Tuliskan catatan kemajuan hafalan atau pesan motivasi hari ini..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tersimpan otomatis & tersinkron ke Firebase</span>
          </div>

          <button
            onClick={() => {
              triggerCelebration();
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
