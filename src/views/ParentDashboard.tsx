import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { ALL_114_SURAHS } from '../data/quran30JuzData';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Gift, 
  Bell, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Star, 
  Flame, 
  AlertTriangle,
  Play,
  Download,
  Share2,
  Printer
} from 'lucide-react';
import { TahfizReportCardModal } from '../components/TahfizReportCardModal';

export const ParentDashboard: React.FC = () => {
  const { 
    profiles, 
    activeProfileId, 
    switchProfile, 
    ayahProgressList, 
    setorAttempts, 
    rewards, 
    createReward, 
    deleteReward, 
    studyPlans, 
    createStudyPlan,
    parentNotifications,
    updateParentNotifications,
    triggerCelebration 
  } = useKafa();

  const [selectedChildId, setSelectedChildId] = useState(activeProfileId);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'study_plan' | 'rewards' | 'notifications' | 'reports'>('overview');
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);

  // Study Plan Form
  const [planSurahId, setPlanSurahId] = useState(78);
  const [planTargetDate, setPlanTargetDate] = useState("2026-09-10");
  const [planDailyAyat, setPlanDailyAyat] = useState(3);

  // Reward Form
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(100);
  const [newRewardIcon, setNewRewardIcon] = useState('🎁');

  // Selected child data
  const child = profiles.find((p) => p.id === selectedChildId) || profiles[0];
  const childProgress = ayahProgressList.filter((ap) => ap.childId === child.id);
  const memorizedCount = childProgress.filter((ap) => ap.status === 'memorized').length;
  const childAttempts = setorAttempts.filter((att) => att.childId === child.id);
  const currentPlan = studyPlans.find((sp) => sp.childId === child.id);

  // Find hardest ayat (lowest score or multiple attempts)
  const weakAyat = childProgress.filter((ap) => ap.status === 'needs_murajaah' || (ap.score > 0 && ap.score < 80));

  const handleCreateNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const surah = ALL_114_SURAHS.find((s) => s.id === planSurahId) || ALL_114_SURAHS[0];
    createStudyPlan(surah.id, surah.nameLatin, planTargetDate, planDailyAyat);
    triggerCelebration();
  };

  const handleCreateNewReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim()) return;
    createReward(newRewardTitle.trim(), newRewardDesc.trim(), newRewardIcon, newRewardCost, child.id);
    setNewRewardTitle('');
    setNewRewardDesc('');
    triggerCelebration();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Parent Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-blue-100 backdrop-blur-md">
              Dashboard Orang Tua & Pembimbing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pantau & Dampingi Hafalan Buah Hati 👨‍👩‍👧
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-md">
            Laporan kemajuan berkala, rancang target hafalan, dan kelola apresiasi secara mudah.
          </p>
        </div>

        {/* Selected Child Selector */}
        <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex items-center gap-1.5 self-start sm:self-center">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedChildId(p.id);
                switchProfile(p.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedChildId === p.id
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>{p.avatar}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'overview', label: '📊 Ringkasan Perkembangan', icon: TrendingUp },
          { id: 'study_plan', label: '📅 Target & Rencana Belajar', icon: Calendar },
          { id: 'analytics', label: '🔍 Analisis & Ayat Sukar', icon: AlertTriangle },
          { id: 'rewards', label: '🎁 Pengaturan Hadiah', icon: Gift },
          { id: 'notifications', label: '🔔 Pengingat & Notifikasi', icon: Bell },
          { id: 'reports', label: '📄 Rapor Hafalan Mingguan', icon: FileText },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap shadow-xs ${
              activeTab === t.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Multi-Child Quick Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profiles.map((p) => {
              const pProg = ayahProgressList.filter((ap) => ap.childId === p.id);
              const pMemorized = pProg.filter((ap) => ap.status === 'memorized').length;
              const isSelected = p.id === selectedChildId;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedChildId(p.id);
                    switchProfile(p.id);
                  }}
                  className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{p.avatar}</span>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {p.name}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {p.grade} • {p.levelName}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                        Aktif
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs text-slate-400">Ayat Hafal</div>
                      <div className="text-base font-black text-slate-800 dark:text-slate-100">
                        {pMemorized}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Streak</div>
                      <div className="text-base font-black text-orange-500">
                        {p.streak} Hari
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">XP</div>
                      <div className="text-base font-black text-amber-500">
                        {p.xp}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's Checklist for Selected Child */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Status Kegiatan Hafalan {child.name} Hari Ini
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Sesi Belajar Baru
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Sudah aktif hari ini
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Muraja'ah Mandiri
                  </div>
                  <div className="text-[11px] text-slate-500">
                    5 ayat terulang
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Setoran ke AI / Orang Tua
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Skor: 92/100
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDY PLAN & TARGET BUILDER */}
      {activeTab === 'study_plan' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Buat Rencana & Target Baru untuk {child.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistem akan otomatis menyusun jadwal harian termasuk jadwal muraja'ah.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateNewPlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Target Surat:
                  </label>
                  <select
                    value={planSurahId}
                    onChange={(e) => setPlanSurahId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    {ALL_114_SURAHS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}. QS. {s.nameLatin} (Juz {s.juzNumber} • {s.totalAyat} Ayat)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Target Tanggal Selesai:
                  </label>
                  <input
                    type="date"
                    value={planTargetDate}
                    onChange={(e) => setPlanTargetDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Target Harian (Ayat/Hari):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={planDailyAyat}
                    onChange={(e) => setPlanDailyAyat(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition"
              >
                Simpan & Buat Jadwal Otomatis
              </button>
            </form>
          </div>

          {/* Current Active Plan Schedule */}
          {currentPlan && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Jadwal Mingguan: Surat {currentPlan.targetSurahName}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Target Selesai: {currentPlan.targetDate}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {currentPlan.days.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700 dark:text-slate-300 w-16">
                        {d.dayName}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        d.taskType === 'murajaah'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {d.taskType === 'murajaah' ? 'Muraja\'ah' : 'Hafalan Baru'}
                      </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {d.ayahRange}
                      </span>
                    </div>

                    <div className="text-slate-400 font-medium">
                      {d.completed ? '✅ Selesai' : '⏳ Belum'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANALYTICS & HARDEST AYAT */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Ayat yang Perlu Perhatian Khusus (Sering Keliru / Nilai Rendah)</span>
            </h3>

            <div className="space-y-2.5">
              {weakAyat.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Surat Ke-{w.surahId} • Ayat {w.ayahNumber}
                    </span>
                    <p className="text-slate-500 mt-0.5">
                      Jumlah Percobaan: {w.attemptCount}x • Skor: {w.score}/100
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                    Jadwalkan Muraja'ah
                  </span>
                </div>
              ))}

              {weakAyat.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  Semua hafalan {child.name} saat ini memiliki skor kelancaran yang baik!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REWARDS MANAGEMENT */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Create Reward Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Tambah Hadiah / Reward Baru untuk {child.name}
            </h3>

            <form onSubmit={handleCreateNewReward} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Hadiah:</label>
                <input
                  type="text"
                  value={newRewardTitle}
                  onChange={(e) => setNewRewardTitle(e.target.value)}
                  placeholder="Contoh: Pilih Cerita Dongeng Sebelum Tidur"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Biaya XP:</label>
                <input
                  type="number"
                  value={newRewardCost}
                  onChange={(e) => setNewRewardCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ikon:</label>
                <select
                  value={newRewardIcon}
                  onChange={(e) => setNewRewardIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs font-semibold"
                >
                  <option value="🎁">🎁 Kado</option>
                  <option value="🌙">🌙 Cerita Tidur</option>
                  <option value="🍲">🍲 Makanan</option>
                  <option value="⚽">⚽ Main 30 Mnt</option>
                  <option value="🎡">🎡 Jalan Santai</option>
                  <option value="🍦">🍦 Es Krim</option>
                </select>
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20"
                >
                  + Simpan Hadiah
                </button>
              </div>
            </form>
          </div>

          {/* Reward List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {r.title}
                    </h4>
                    <span className="text-[11px] text-amber-600 font-bold">
                      {r.costXP} XP
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteReward(r.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition"
                  title="Hapus Hadiah"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Pengaturan Pengingat & Notifikasi Orang Tua
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Jam Pengingat Belajar Harian
                </div>
                <div className="text-[11px] text-slate-500">
                  Kirim notifikasi ramah agar anak tidak lupa belajar
                </div>
              </div>
              <input
                type="time"
                value={parentNotifications.dailyReminderTime}
                onChange={(e) => updateParentNotifications({ dailyReminderTime: e.target.value })}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-700 text-xs font-bold"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Notifikasi Streak Belajar
                </div>
                <div className="text-[11px] text-slate-500">
                  Dapatkan kabar saat anak mencapai rekor streak baru
                </div>
              </div>
              <input
                type="checkbox"
                checked={parentNotifications.streakAlerts}
                onChange={(e) => updateParentNotifications({ streakAlerts: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Laporan Mingguan Otomatis
                </div>
                <div className="text-[11px] text-slate-500">
                  Ringkasan hafalan dikirim setiap akhir pekan
                </div>
              </div>
              <input
                type="checkbox"
                checked={parentNotifications.weeklyReportAlerts}
                onChange={(e) => updateParentNotifications({ weeklyReportAlerts: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RAPOR MINGGUAN (WEEKLY REPORT CARD) */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Rapor Mingguan KAFA TAHFIZ
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Kemajuan Hafalan {child.name}
              </h3>
              <p className="text-xs text-slate-500">
                Periode: 20 Agustus 2026 – 26 Agustus 2026
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReportCardModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Buka Rapor Resmi & Mutqin</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-900 dark:text-emerald-100">
              <div className="text-xs font-bold text-slate-500">Ayat Ditambah</div>
              <div className="text-2xl font-black mt-1">12 Ayat</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 text-blue-900 dark:text-blue-100">
              <div className="text-xs font-bold text-slate-500">Muraja'ah Selesai</div>
              <div className="text-2xl font-black mt-1">28 Ayat</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 text-purple-900 dark:text-purple-100">
              <div className="text-xs font-bold text-slate-500">Rata-rata Skor</div>
              <div className="text-2xl font-black mt-1">93/100</div>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 text-orange-900 dark:text-orange-100">
              <div className="text-xs font-bold text-slate-500">Streak Terjaga</div>
              <div className="text-2xl font-black mt-1">{child.streak} Hari 🔥</div>
            </div>
          </div>

          {/* AI Recommendation Note for Parent */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span>Catatan Rekomendasi Kak Kafa untuk Orang Tua</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Masya Allah, kemajuan {child.name} minggu ini sangat menggembirakan! Anak menunjukkan konsistensi tinggi dalam mengulang hafalan. Disarankan untuk memberikan apresiasi berupa waktu bermain tambahan dan mendampingi pada ayat-ayat panjang di Surat An-Naba' agar artikulasi makhraj huruf semakin mantap.
            </p>
          </div>
        </div>
      )}

      {/* Rapor Modal */}
      <TahfizReportCardModal
        isOpen={isReportCardModalOpen}
        onClose={() => setIsReportCardModalOpen(false)}
      />
    </div>
  );
};
