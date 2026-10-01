import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  User, 
  Flame, 
  Star, 
  BookOpen, 
  Calendar, 
  RotateCcw, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Award,
  Volume2,
  Clock
} from 'lucide-react';

const AVATAR_LIST = ['👦', '👧', '🧒', '🧕', '🧑', '🦸‍♂️', '🌟', '📖', '🧕', '👑'];

export const ChildProfileView: React.FC = () => {
  const { 
    activeProfile, 
    ayahProgressList, 
    setorAttempts, 
    profiles, 
    switchProfile,
    settings,
    updateSettings 
  } = useKafa();

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Statistics
  const userProgress = ayahProgressList.filter((ap) => ap.childId === activeProfile.id);
  const memorizedAyatCount = userProgress.filter((ap) => ap.status === 'memorized').length;
  const userSetorAttempts = setorAttempts.filter((att) => att.childId === activeProfile.id);

  // Calendar days generation (Last 14 days)
  const pastDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const isStudied = activeProfile.historyDates.includes(dateStr);
    const isMurajaah = activeProfile.murajaahDates.includes(dateStr);
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
    const dateNum = d.getDate();
    return { dateStr, dayLabel, dateNum, isStudied, isMurajaah };
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 pb-28">
      {/* Profile Card Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-4xl border-2 border-emerald-500/40 shadow-md">
                {activeProfile.avatar}
              </div>
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold shadow-xs hover:bg-slate-800"
              >
                Ubah
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {activeProfile.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  {activeProfile.grade}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Umur: {activeProfile.age} Tahun • Target Harian: {activeProfile.targetDailyAyat} Ayat
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Level {activeProfile.level}: {activeProfile.levelName} ({activeProfile.xp} XP)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Picker Drawer */}
        {showAvatarPicker && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Pilih Karakter Avatar Favorit:
            </span>
            <div className="flex flex-wrap gap-2">
              {AVATAR_LIST.map((av, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    activeProfile.avatar = av;
                    setShowAvatarPicker(false);
                  }}
                  className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 text-2xl flex items-center justify-center hover:scale-110 transition"
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="text-xs text-slate-500 font-medium">Ayat Dikuasai</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {memorizedAyatCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="text-xs text-slate-500 font-medium">Streak Belajar</div>
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-0.5">
              {activeProfile.streak} Hari
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="text-xs text-slate-500 font-medium">Total Setoran</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {userSetorAttempts.length}x
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="text-xs text-slate-500 font-medium">Rata-rata Skor</div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {userSetorAttempts.length > 0
                ? Math.round(userSetorAttempts.reduce((a, b) => a + b.score, 0) / userSetorAttempts.length)
                : 90}
            </div>
          </div>
        </div>
      </div>

      {/* KALENDER BELAJAR & KONSISTENSI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Kalender Keaktifan Belajar (14 Hari Terakhir)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Istiqomah adalah kunci
          </span>
        </div>

        {/* 14 Days Row */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 text-center">
          {pastDays.map((day) => (
            <div
              key={day.dateStr}
              className={`p-2.5 rounded-2xl border transition flex flex-col items-center justify-center gap-1 ${
                day.isStudied
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-950 dark:text-emerald-100 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold">{day.dayLabel}</span>
              <span className="text-sm font-extrabold">{day.dateNum}</span>
              <span className="text-xs">
                {day.isStudied ? '🟢' : '⚪'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 pt-2">
          <div className="flex items-center gap-1">
            <span>🟢</span>
            <span>Aktif Belajar / Setor</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚪</span>
            <span>Istirahat</span>
          </div>
        </div>
      </div>

      {/* RECENT SETORAN HISTORY LOG */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Riwayat Setoran Hafalan
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {userSetorAttempts.length} Catatan
          </span>
        </div>

        <div className="space-y-3">
          {userSetorAttempts.slice(0, 5).map((att) => (
            <div
              key={att.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Surat {att.surahName} • Ayat {att.ayahNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                    Skor: {att.score}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {att.feedback}
                </p>
              </div>

              <div className="text-xs text-slate-400 sm:text-right shrink-0">
                {new Date(att.timestamp).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}

          {userSetorAttempts.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              Belum ada riwayat setoran hafalan untuk profil ini.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
