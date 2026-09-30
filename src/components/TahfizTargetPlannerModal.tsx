import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  X, 
  Target, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  CalendarCheck
} from 'lucide-react';
import { getAllSurahCatalog } from '../services/quranService';

interface TahfizTargetPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanApplied?: () => void;
}

export const TahfizTargetPlannerModal: React.FC<TahfizTargetPlannerModalProps> = ({
  isOpen,
  onClose,
  onPlanApplied,
}) => {
  const { activeProfile, createStudyPlan, triggerCelebration, addXP } = useKafa();

  // Target Preset
  const [targetType, setTargetType] = useState<'juz30' | 'juz29' | 'juz28_30' | 'surah'>('juz30');
  const [customSurahId, setCustomSurahId] = useState<number>(78);
  const [dailyAyat, setDailyAyat] = useState<number>(3);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(6); // 5 or 6 or 7

  if (!isOpen) return null;

  const catalogList = getAllSurahCatalog();

  // Determine total ayat based on selection
  let targetName = "Juz 30 (Juz 'Amma)";
  let totalAyatInTarget = 564;
  let targetSurahIdForPlan = 78;

  if (targetType === 'juz30') {
    targetName = "Juz 30 (Juz 'Amma)";
    totalAyatInTarget = 564;
    targetSurahIdForPlan = 78;
  } else if (targetType === 'juz29') {
    targetName = "Juz 29 (Tabarak)";
    totalAyatInTarget = 431;
    targetSurahIdForPlan = 67;
  } else if (targetType === 'juz28_30') {
    targetName = "3 Juz Terakhir (Juz 28, 29, 30)";
    totalAyatInTarget = 1132;
    targetSurahIdForPlan = 58;
  } else {
    const s = catalogList.find((item) => item.id === customSurahId) || catalogList[0];
    targetName = `Surat ${s.nameLatin} (${s.nameArabic})`;
    totalAyatInTarget = s.totalAyat;
    targetSurahIdForPlan = s.id;
  }

  // Calculations
  const studyDaysNeeded = Math.ceil(totalAyatInTarget / dailyAyat);
  const totalWeeks = Math.ceil(studyDaysNeeded / daysPerWeek);
  const totalCalendarDays = totalWeeks * 7;

  // Calculate completion date
  const targetDateObj = new Date();
  targetDateObj.setDate(targetDateObj.getDate() + totalCalendarDays);
  const completionDateFormatted = targetDateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const targetDateISO = targetDateObj.toISOString().split('T')[0];

  const handleApplyToStudyPlan = () => {
    createStudyPlan(targetSurahIdForPlan, targetName, targetDateISO, dailyAyat);
    triggerCelebration();
    addXP(30, 'Menetapkan Rencana Target Hafalan Baru');
    if (onPlanApplied) onPlanApplied();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-emerald-100 px-2.5 py-0.5 rounded-full">
                Perencana Target Otomatis
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
              Kalkulator & Roadmap Target Tahfiz
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium">
              Hitung estimasi waktu khatam secara presisi berdasarkan kecepatan santri
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-100">
          
          {/* STEP 1: TARGET SELECTION */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Pilih Sasaran Hafalan:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'juz30', label: 'Juz 30 (Amma)', sub: '564 Ayat', icon: '🌟' },
                { id: 'juz29', label: 'Juz 29 (Tabarak)', sub: '431 Ayat', icon: '🌙' },
                { id: 'juz28_30', label: '3 Juz Terakhir', sub: '1.132 Ayat', icon: '👑' },
                { id: 'surah', label: 'Surat Pilihan', sub: 'Kustom', icon: '📖' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTargetType(item.id as typeof targetType)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    targetType === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg">{item.icon}</div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{item.label}</h4>
                  <p className="text-[10px] text-slate-400">{item.sub}</p>
                </button>
              ))}
            </div>

            {targetType === 'surah' && (
              <div className="mt-2">
                <select
                  value={customSurahId}
                  onChange={(e) => setCustomSurahId(Number(e.target.value))}
                  className="w-full text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {catalogList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}. {s.nameLatin} ({s.nameArabic}) - {s.totalAyat} Ayat
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* STEP 2: SPEED / DAILY AYAT */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>2. Kecepatan Hafalan Harian (Ziyadah):</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold normal-case">
                {dailyAyat} Ayat / Hari
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { val: 1, label: '1 Ayat', desc: 'Santai' },
                { val: 2, label: '2 Ayat', desc: 'Konsisten' },
                { val: 3, label: '3 Ayat', desc: 'Ideal Pemula' },
                { val: 5, label: '5 Ayat', desc: 'Standar Santri' },
                { val: 10, label: '10 Ayat', desc: 'Intensif' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setDailyAyat(item.val)}
                  className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                    dailyAyat === item.val
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-extrabold">{item.label}</div>
                  <div className={`text-[10px] ${dailyAyat === item.val ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: SCHEDULE DAYS PER WEEK */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              3. Jadwal Belajar Mingguan:
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { val: 5, label: '5 Hari Belajar', sub: '2 Hari Khusus Muraja\'ah' },
                { val: 6, label: '6 Hari Belajar', sub: '1 Hari Evaluasi / Libur' },
                { val: 7, label: '7 Hari Penuh', sub: 'Setiap Hari Ziyadah' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setDaysPerWeek(item.val)}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                    daysPerWeek === item.val
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 dark:border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</h4>
                  <p className="text-[10px] text-slate-400">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ROADMAP RESULTS CARD */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-2 border-emerald-500/30 dark:border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Hasil Estimasi Roadmap Hafalan</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Santri: {activeProfile.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-850 shadow-xs border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Ayat</span>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{totalAyatInTarget}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-850 shadow-xs border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hari Hafalan</span>
                <p className="text-lg font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">{studyDaysNeeded} Hari</p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-850 shadow-xs border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Durasi Total</span>
                <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{totalWeeks} Pekan</p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-850 shadow-xs border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Khatam</span>
                <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 line-clamp-2">
                  {completionDateFormatted}
                </p>
              </div>
            </div>

            {/* Practical Advice Banner */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-850/80 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>💡 Saran Pembagian Waktu (Metode 3T):</span>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 list-disc pl-4">
                <li><strong>Ba'da Subuh:</strong> Ziyadah {dailyAyat} ayat baru saat pikiran masih segar dan hening.</li>
                <li><strong>Ba'da Ashar / Maghrib:</strong> Muraja'ah hafalan kemarin (Sabaqi) dan hafalan lama (Manzil).</li>
                <li><strong>Ba'da Isya:</strong> Setoran lisan ke pembimbing / orang tua dan preview ayat untuk besok.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>

          <button
            onClick={handleApplyToStudyPlan}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Terapkan ke Jadwal Rencanaku</span>
          </button>
        </div>
      </div>
    </div>
  );
};
