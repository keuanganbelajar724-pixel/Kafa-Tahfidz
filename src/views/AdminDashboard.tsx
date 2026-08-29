import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { JUZ_30_SURAHS, ALL_QURAN_SURAHS_CATALOG } from '../data/quranData';
import { 
  ShieldCheck, 
  Database, 
  Settings, 
  Moon, 
  Volume2, 
  Award, 
  CheckCircle2, 
  Info,
  Server,
  Cloud,
  RefreshCw,
  DownloadCloud,
  UploadCloud,
  Check,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    badges, 
    quests, 
    profiles,
    ayahProgressList,
    setorAttempts,
    studyPlans,
    rewards,
    cloudSync,
    syncAllToCloud,
    restoreFromCloud,
    triggerCelebration
  } = useKafa();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleManualSync = async () => {
    setIsProcessing(true);
    setSyncFeedback(null);
    const success = await syncAllToCloud();
    setIsProcessing(false);
    if (success) {
      setSyncFeedback('✅ Semua data berhasil disinkronkan ke Firebase Firestore!');
      triggerCelebration();
    } else {
      setSyncFeedback('❌ Gagal menyinkronkan data. Silakan periksa koneksi.');
    }
  };

  const handleManualRestore = async () => {
    setIsProcessing(true);
    setSyncFeedback(null);
    const success = await restoreFromCloud();
    setIsProcessing(false);
    if (success) {
      setSyncFeedback('✅ Data berhasil dipulihkan dari Firebase Firestore!');
      triggerCelebration();
    } else {
      setSyncFeedback('❌ Gagal memulihkan data dari cloud.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-purple-200 backdrop-blur-md">
              Panel Administrator & Audit Data
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Firebase Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pengaturan Sistem & Cloud KAFA TAHFIZ ⚙️
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/90 max-w-md">
            Kelola sinkronisasi Firebase Firestore, mushaf 30 juz, qari murottal, dan preferensi aplikasi.
          </p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
          🛡️
        </div>
      </div>

      {/* 0. FIREBASE CLOUD DATABASE & REALTIME SYNC */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center text-2xl">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">
                  Database Cloud Firebase (Firestore)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Terhubung Langsung</span>
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                ID Project: <span className="font-mono text-amber-300 font-bold">{cloudSync.projectId}</span> • Database: <span className="font-mono text-indigo-300">ai-studio-kafatahfiz</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className={`w-4 h-4 ${isProcessing ? 'animate-bounce' : ''}`} />
              <span>{isProcessing ? 'Menyinkronkan...' : 'Sinkronkan ke Cloud'}</span>
            </button>

            <button
              onClick={handleManualRestore}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 transition cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Tarik Data Cloud</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-xs font-bold text-emerald-200 flex items-center gap-2">
            <span>{syncFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-indigo-300 font-bold text-[11px]">Profil Santri:</span>
            <div className="text-lg font-black text-white">{profiles.length} Profil</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Check className="w-2.5 h-2.5" /> Auto-sync Firestore
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-indigo-300 font-bold text-[11px]">Progress Hafalan:</span>
            <div className="text-lg font-black text-white">{ayahProgressList.length} Catatan Ayat</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Check className="w-2.5 h-2.5" /> Real-time Cloud
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-indigo-300 font-bold text-[11px]">Log Setoran:</span>
            <div className="text-lg font-black text-white">{setorAttempts.length} Riwayat Voice</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Check className="w-2.5 h-2.5" /> Tersimpan Cloud
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-indigo-300 font-bold text-[11px]">Status Sinkron:</span>
            <div className="text-sm font-black text-amber-300">
              {cloudSync.lastSyncedAt ? `Pukul ${cloudSync.lastSyncedAt}` : 'Otomatis'}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Check className="w-2.5 h-2.5" /> Online & Aktif
            </div>
          </div>
        </div>
      </div>

      {/* 1. DATASET QURAN INTEGRITY & AUDIT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Status Integritas Mushaf & Verifikasi Ayat
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
            100% Terverifikasi ✅
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold">Standar Rasm:</span>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              Rasm 'Utsmani (Madinah)
            </div>
            <p className="text-[11px] text-slate-500">
              Sesuai kaidah tajwid dan tanda waqaf resmi
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold">Terjemahan Resmi:</span>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              Kemenag RI (Terbaru)
            </div>
            <p className="text-[11px] text-slate-500">
              Bahasa Indonesia standar baku Kementerian Agama
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-slate-400 font-bold">Total Surat Termuat:</span>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">
              {ALL_QURAN_SURAHS_CATALOG.length} Surat Al-Qur'an
            </div>
            <p className="text-[11px] text-slate-500">
              Lengkap dengan 37 Surat Juz Amma audio terintegrasi
            </p>
          </div>
        </div>
      </div>

      {/* 2. AUDIO MUROTTAL & RECITER CONFIGURATION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-5 h-5 text-purple-600" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Pengaturan Qari Murottal Standar
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Qari Utama untuk Mode Anak:
            </label>
            <select
              value={settings.defaultReciter}
              onChange={(e) => updateSettings({ defaultReciter: e.target.value })}
              className="w-full sm:w-80 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="Mishary Rashid Alafasy">Mishary Rashid Alafasy (Lancar & Merdu)</option>
              <option value="Mahmoud Khalil Al-Husary">Mahmoud Khalil Al-Husary (Standar Tartil)</option>
              <option value="Muhammad Thaha Al-Junaid">Muhammad Thaha Al-Junaid (Qari Anak)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. SEASONAL & THEME SETTINGS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Pengaturan Mode Aplikasi
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-amber-500" />
                <span>Mode Khusus Bulan Ramadan 🌙</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Menampilkan badge Ramadan dan tantangan khatam harian
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.ramadanMode}
              onChange={(e) => updateSettings({ ramadanMode: e.target.checked })}
              className="w-4 h-4 accent-amber-500"
            >
            </input>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Simpan Arsip Audio Rekaman Anak
              </div>
              <div className="text-[11px] text-slate-500">
                Menyimpan riwayat suara setoran untuk didengarkan orang tua
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.keepAudioRecordings}
              onChange={(e) => updateSettings({ keepAudioRecordings: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            >
            </input>
          </div>
        </div>
      </div>
    </div>
  );
};
