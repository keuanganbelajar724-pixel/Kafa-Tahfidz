import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  X, 
  Sun, 
  Moon, 
  RotateCcw, 
  Heart, 
  BookOpen, 
  Sparkles, 
  Check, 
  Volume2, 
  VolumeX, 
  Share2,
  Copy,
  CheckCheck
} from 'lucide-react';
import { DZIKIR_PAGI_PETANG_LIST, DOA_TAHFIZ_LIST, DzikirItem } from '../data/dzikirDoaData';

interface DzikirDoaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DzikirDoaModal: React.FC<DzikirDoaModalProps> = ({ isOpen, onClose }) => {
  const { addXP, triggerCelebration } = useKafa();

  // Active view tab: 'dzikir_pagi' | 'dzikir_petang' | 'tasbih' | 'doa_tahfiz'
  const [activeTab, setActiveTab] = useState<'dzikir_pagi' | 'dzikir_petang' | 'tasbih' | 'doa_tahfiz'>('dzikir_pagi');

  // Digital Tasbih State
  const [tasbihCount, setTasbihCount] = useState<number>(0);
  const [tasbihTarget, setTasbihTarget] = useState<number>(33);
  const [tasbihCycle, setTasbihCycle] = useState<number>(0);
  const [tasbihSound, setTasbihSound] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter Dzikir items
  const pagiList = DZIKIR_PAGI_PETANG_LIST.filter((d) => d.category === 'pagi' || d.category === 'keduanya');
  const petangList = DZIKIR_PAGI_PETANG_LIST.filter((d) => d.category === 'petang' || d.category === 'keduanya');

  // Play subtle click sound using Web Audio API
  const playClickSound = () => {
    if (!tasbihSound) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // ignore
    }
  };

  const handleTasbihTap = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // ignore
      }
    }
    playClickSound();

    const nextCount = tasbihCount + 1;
    if (nextCount >= tasbihTarget) {
      setTasbihCount(0);
      setTasbihCycle((prev) => prev + 1);
      addXP(15, `Menuntaskan ${tasbihTarget}x Tasbih`);
      triggerCelebration();
    } else {
      setTasbihCount(nextCount);
    }
  };

  const handleResetTasbih = () => {
    setTasbihCount(0);
    setTasbihCycle(0);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📿</span>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-purple-100 px-2.5 py-0.5 rounded-full">
                Benteng Dzikir & Doa
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
              Dzikir, Tasbih & Doa Santri Tahfiz
            </h2>
            <p className="text-xs text-purple-200/90 font-medium">
              Al-Matsurat Pagi Petang, Tasbih Digital Interaktif & Doa Penghafal Al-Qur'an
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 py-2.5 bg-purple-50/60 dark:bg-slate-800/60 border-b border-purple-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dzikir_pagi')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'dzikir_pagi'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Dzikir Pagi</span>
          </button>

          <button
            onClick={() => setActiveTab('dzikir_petang')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'dzikir_petang'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dzikir Petang</span>
          </button>

          <button
            onClick={() => setActiveTab('tasbih')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'tasbih'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span>📿</span>
            <span>Tasbih Digital</span>
          </button>

          <button
            onClick={() => setActiveTab('doa_tahfiz')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'doa_tahfiz'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Doa Penghafal Qur'an</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-800 dark:text-slate-100">
          
          {/* TAB 1 & 2: DZIKIR PAGI & PETANG */}
          {(activeTab === 'dzikir_pagi' || activeTab === 'dzikir_petang') && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-purple-900 dark:text-purple-300">
                    {activeTab === 'dzikir_pagi' ? '🌅 Keutamaan Dzikir Pagi' : '🌙 Keutamaan Dzikir Petang'}
                  </h3>
                  <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                    {activeTab === 'dzikir_pagi' 
                      ? 'Dibaca antara terbit fajar shubuh hingga waktu terbit matahari atau dhuha. Menjadi pelindung seharian.'
                      : 'Dibaca antara waktu ashar hingga terbenam matahari atau malam hari. Menjadi benteng keselamatan malam.'}
                  </p>
                </div>
              </div>

              {(activeTab === 'dzikir_pagi' ? pagiList : petangList).map((item, idx) => (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Dibaca {item.targetCount}x
                      </span>
                      <button
                        onClick={() => handleCopyText(`${item.title}\n\n${item.arabicText}\n\n${item.latinText}\n\nArtinya:\n${item.translationId}`, item.id)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        title="Salin Teks"
                      >
                        {copiedId === item.id ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-900 border border-amber-100/60 dark:border-slate-800 text-right">
                    <p className="font-arabic text-xl sm:text-2xl leading-loose font-medium text-slate-900 dark:text-slate-100">
                      {item.arabicText}
                    </p>
                  </div>

                  {/* Latin */}
                  <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed">
                    "{item.latinText}"
                  </p>

                  {/* Translation */}
                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl">
                    <strong className="text-slate-900 dark:text-white">Artinya:</strong> {item.translationId}
                  </div>

                  {/* Benefit & Reference */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      💡 {item.benefit}
                    </span>
                    <span className="font-semibold text-slate-500">
                      {item.reference}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: TASBIH DIGITAL INTERAKTIF */}
          {activeTab === 'tasbih' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-6 max-w-md mx-auto">
              {/* Preset Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Target Hitungan:</span>
                {[33, 100, 1000].map((tgt) => (
                  <button
                    key={tgt}
                    onClick={() => {
                      setTasbihTarget(tgt);
                      setTasbihCount(0);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      tasbihTarget === tgt
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tgt}x
                  </button>
                ))}
              </div>

              {/* Central Tasbih Dial & Button */}
              <div className="relative">
                {/* Visual Ring */}
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-teal-700 p-3 shadow-2xl shadow-emerald-600/30 flex items-center justify-center">
                  <button
                    onClick={handleTasbihTap}
                    className="w-full h-full rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 flex flex-col items-center justify-center text-center transition transform active:scale-95 cursor-pointer shadow-inner relative overflow-hidden select-none"
                  >
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Subhanallah
                    </span>
                    <span className="text-6xl sm:text-7xl font-extrabold text-slate-900 dark:text-white my-1 tabular-nums">
                      {tasbihCount}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Target: {tasbihTarget}x
                    </span>
                    <span className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-0.5 rounded-full">
                      Sentuh Layar Untuk Menghitung
                    </span>
                  </button>
                </div>
              </div>

              {/* Cycle & Sound controls */}
              <div className="flex items-center justify-between w-full px-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Putaran Selesai: <strong className="text-emerald-600 dark:text-emerald-400">{tasbihCycle}</strong> kali</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTasbihSound(!tasbihSound)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                    title={tasbihSound ? 'Suara Aktif' : 'Suara Mati'}
                  >
                    {tasbihSound ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </button>

                  <button
                    onClick={handleResetTasbih}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOA PENGHAFAL AL-QUR'AN */}
          {activeTab === 'doa_tahfiz' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80">
                <h3 className="text-xs font-extrabold text-teal-900 dark:text-teal-300">
                  📖 Adab & Doa Mulia Penghafal Al-Qur'an
                </h3>
                <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80">
                  Doa-doa pilihan agar hafalan dimudahkan Allah, dada dilapangkan, tidak mudah lupa, dan menghadiahkan mahkota surga untuk kedua orang tua tercinta.
                </p>
              </div>

              {DOA_TAHFIZ_LIST.map((doa, idx) => (
                <div
                  key={doa.id}
                  className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {doa.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleCopyText(`${doa.title}\n\n${doa.arabicText}\n\n${doa.latinText}\n\nArtinya:\n${doa.translationId}`, doa.id)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                      title="Salin Doa"
                    >
                      {copiedId === doa.id ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Arabic */}
                  <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-slate-900 border border-teal-100/60 dark:border-slate-800 text-right">
                    <p className="font-arabic text-xl sm:text-2xl leading-loose font-medium text-slate-900 dark:text-slate-100">
                      {doa.arabicText}
                    </p>
                  </div>

                  {/* Latin */}
                  <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed">
                    "{doa.latinText}"
                  </p>

                  {/* Translation */}
                  <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl">
                    <strong className="text-slate-900 dark:text-white">Artinya:</strong> {doa.translationId}
                  </div>

                  {/* Notes */}
                  <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                    📌 <strong>Waktu Membaca:</strong> {doa.notes}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram." (QS. Ar-Ra'd: 28)
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-xs font-extrabold shadow-sm transition hover:opacity-90 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
