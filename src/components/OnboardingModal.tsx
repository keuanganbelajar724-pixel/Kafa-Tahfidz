import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Smile, 
  BookOpen, 
  Target, 
  Award 
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['👦', '👧', '🧒', '🧕', '🧑', '🦸‍♂️', '🌟', '📖'];

const STARTING_OPTIONS = [
  { id: 'belum_mulai', label: 'Belum Mulai', desc: 'Mulai belajar dari surat-surat paling pendek.', icon: '🌱' },
  { id: 'beberapa_surat', label: 'Beberapa Surat Pendek', desc: 'Sudah hafal An-Nas, Al-Falaq, Al-Ikhlas, dll.', icon: '⭐' },
  { id: 'juz_amma', label: 'Juz Amma (Juz 30)', desc: 'Sedang atau ingin menuntaskan seluruh Juz 30.', icon: '📖' },
  { id: 'juz_29', label: 'Juz 29 (Tabarak)', desc: 'Melanjutkan hafalan ke Juz 29 (Al-Mulk dst).', icon: '✨' },
  { id: 'juz_lainnya', label: 'Juz Lainnya', desc: 'Mulai dari juz pilihan lainnya.', icon: '🎯' },
];

const TARGET_OPTIONS = [
  { id: '1', count: 1, label: '1 Ayat / Hari', desc: 'Santai & konsisten, sangat cocok untuk pemula.', emoji: '🌿' },
  { id: '2', count: 2, label: '2 Ayat / Hari', desc: 'Rekomendasi terbaik untuk hasil optimal.', emoji: '⭐', popular: true },
  { id: '3', count: 3, label: '3 Ayat / Hari', desc: 'Semangat belajar yang tinggi.', emoji: '🔥' },
  { id: '5', count: 5, label: '5 Ayat / Hari', desc: 'Tantangan super untuk pejuang hafalan.', emoji: '🚀' },
  { id: 'custom', count: 4, label: 'Kustom Target', desc: 'Atur jumlah ayat harian sendiri.', emoji: '⚙️' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { addNewChild } = useKafa();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(8);
  const [grade, setGrade] = useState('Kelas 2 SD');
  const [avatar, setAvatar] = useState('👦');
  const [startPoint, setStartPoint] = useState('beberapa_surat');
  const [targetType, setTargetType] = useState('2');
  const [customTarget, setCustomTarget] = useState(4);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      const dailyCount = targetType === 'custom' ? customTarget : parseInt(targetType, 10);
      addNewChild({
        name: name.trim(),
        age: Number(age),
        grade,
        startPoint,
        dailyTarget: dailyCount,
        avatar,
      });
      onClose();
      setStep(1);
      setName('');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Top Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            Langkah {step} dari 3
          </span>
          <span className="text-xs text-slate-400">Pendaftaran Profil Anak</span>
        </div>

        {/* STEP 1: Siapa Namamu? */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Siapa Namamu?</span>
                <span className="text-2xl">👋</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Yuk buat profil belajar hafalan Al-Qur'anmu yang menyenangkan.
              </p>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                Pilih Karakter Avatarmu:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition transform active:scale-95 ${
                      avatar === av
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-500 scale-110 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:scale-105'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Nama Panggilan Anak:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad / Aisyah"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                autoFocus
              />
            </div>

            {/* Age & Grade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Umur (Tahun):
                </label>
                <input
                  type="number"
                  min={3}
                  max={18}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Kelas / Tingkat:
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="TK A">TK A</option>
                  <option value="TK B">TK B</option>
                  <option value="Kelas 1 SD">Kelas 1 SD</option>
                  <option value="Kelas 2 SD">Kelas 2 SD</option>
                  <option value="Kelas 3 SD">Kelas 3 SD</option>
                  <option value="Kelas 4 SD">Kelas 4 SD</option>
                  <option value="Kelas 5 SD">Kelas 5 SD</option>
                  <option value="Kelas 6 SD">Kelas 6 SD</option>
                  <option value="SMP / Sederajat">SMP / Sederajat</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Sudah hafal sampai mana? */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Sudah Hafal Sampai Mana?</span>
                <span>📖</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Pilih titik awal hafalan agar aplikasi dapat menyiapkan target otomatis yang tepat.
              </p>
            </div>

            <div className="space-y-2.5">
              {STARTING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStartPoint(opt.id)}
                  className={`w-full p-3.5 rounded-2xl text-left flex items-center justify-between border transition transform active:scale-98 ${
                    startPoint === opt.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</div>
                    </div>
                  </div>
                  {startPoint === opt.id && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Berapa target hafalanmu? */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Berapa Target Hafalanmu?</span>
                <span>🎯</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Target harian yang konsisten adalah kunci hafalan melekat dan lancar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TARGET_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTargetType(t.id)}
                  className={`p-3.5 rounded-2xl text-left border relative transition ${
                    targetType === t.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.popular && (
                    <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-extrabold text-[9px] uppercase tracking-wider shadow-xs">
                      Terfavorit
                    </span>
                  )}
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>

            {targetType === 'custom' && (
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Kustom:
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={customTarget}
                    onChange={(e) => setCustomTarget(Number(e.target.value))}
                    className="accent-emerald-500"
                  />
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 min-w-[60px] text-right">
                    {customTarget} ayat/hari
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={step === 1 && !name.trim()}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition transform active:scale-95 ${
              step === 1 && !name.trim()
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400'
            }`}
          >
            <span>{step === 3 ? 'Selesai & Mulai Hafalan! 🚀' : 'Lanjut'}</span>
            {step < 3 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
