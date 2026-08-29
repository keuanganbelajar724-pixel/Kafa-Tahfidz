import React, { useState } from 'react';
import { 
  X, 
  BookMarked, 
  Volume2, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  ChevronRight,
  HelpCircle
} from 'lucide-react';

interface TajweedGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TajweedRule {
  id: string;
  name: string;
  arabicName: string;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  description: string;
  howToRead: string;
  letters: string[];
  exampleArabic: string;
  exampleTranslit: string;
  exampleSurah: string;
}

const TAJWEED_RULES: TajweedRule[] = [
  {
    id: 'ghunnah',
    name: 'Ghunnah Musyaddadah',
    arabicName: 'غُنَّةٌ مُشَدَّدَةٌ',
    colorClass: 'tajweed-ghunnah',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
    badgeText: 'text-orange-800 dark:text-orange-300',
    dotColor: 'bg-orange-500',
    description: 'Setiap huruf Nun (نّ) atau Mim (مّ) yang memiliki harakat tasydid/syaddah.',
    howToRead: 'Didengungkan selama 2–3 harakat melalui pangkal hidung (Al-Khaisyum).',
    letters: ['نّ', 'مّ'],
    exampleArabic: 'إِنَّ ٱلَّذِينَ ءَامَنُواْ',
    exampleTranslit: 'Inna-lladziina aamanuu...',
    exampleSurah: 'QS. Al-Baqarah: 62',
  },
  {
    id: 'ikhfa',
    name: 'Ikhfa\' Haqiqi',
    arabicName: 'إِخْفَاءٌ حَقِيقِيٌّ',
    colorClass: 'tajweed-ikhfa',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    description: 'Nun sukun (نْ) atau tanwin (ً ٍ ٌ) bertemu salah satu dari 15 huruf Ikhfa\'.',
    howToRead: 'Dibaca samar antara Izhar dan Idgham disertai dengungan 2 harakat.',
    letters: ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'],
    exampleArabic: 'مِن قَبْلُ • جَنَّـٰتٍ تَجْرِى',
    exampleTranslit: 'Min qablu • Jannaatin tajrii',
    exampleSurah: 'QS. Al-Baqarah: 25',
  },
  {
    id: 'idgham',
    name: 'Idgham Bighunnah & Bilaghunnah',
    arabicName: 'إِدْغَامٌ',
    colorClass: 'tajweed-idgham',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    description: 'Nun sukun atau tanwin bertemu huruf Idgham (ي, ن, م, و) atau (ل, ر).',
    howToRead: 'Huruf pertama dimasukkan/dilebur ke huruf kedua secara sempurna dengan atau tanpa dengung.',
    letters: ['ي', 'ن', 'م', 'و', 'ل', 'ر'],
    exampleArabic: 'مَن يَقُولُ • مِّن رَّبِّهِمْ',
    exampleTranslit: 'May yaquulu • Mir rabbihim',
    exampleSurah: 'QS. Al-Baqarah: 8 & 5',
  },
  {
    id: 'qalqalah',
    name: 'Qalqalah (Kubra & Sughra)',
    arabicName: 'قَلْقَلَةٌ',
    colorClass: 'tajweed-qalqalah',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-800 dark:text-blue-300',
    dotColor: 'bg-blue-500',
    description: 'Huruf Qalqalah (ق, ط, ب, ج, د) yang berharakat sukun asli atau diwaqafkan.',
    howToRead: 'Dibaca memantul dengan getaran suara yang jelas dan tegas.',
    letters: ['ق', 'ط', 'ب', 'ج', 'د'],
    exampleArabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ • ٱلْفَلَقِ',
    exampleTranslit: 'Qul huwallahu ahad(d) • Al-falaq',
    exampleSurah: 'QS. Al-Ikhlas & Al-Falaq',
  },
  {
    id: 'mad',
    name: 'Mad Wajib, Jaiz, & Lazim',
    arabicName: 'مَدٌّ فَرْعِيٌّ',
    colorClass: 'tajweed-mad',
    badgeBg: 'bg-pink-100 dark:bg-pink-950/60',
    badgeText: 'text-pink-800 dark:text-pink-300',
    dotColor: 'bg-pink-500',
    description: 'Huruf mad bertemu hamzah atau sukun/tasydid.',
    howToRead: 'Dipanjangkan suaranya 4, 5, atau 6 harakat sesuai hukum masing-masing.',
    letters: ['ا', 'و', 'ي'],
    exampleArabic: 'جَآءَ • سُوٓءَ • وَلَا ٱلضَّآلِّينَ',
    exampleTranslit: 'Jaaa-a • Suuu-a • Wa ladhdhaalliiiin',
    exampleSurah: 'QS. An-Nasr: 1 & Al-Fatihah: 7',
  },
  {
    id: 'iqlab',
    name: 'Iqlab',
    arabicName: 'إِقْلَابٌ',
    colorClass: 'tajweed-ikhfa',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
    badgeText: 'text-teal-800 dark:text-teal-300',
    dotColor: 'bg-teal-500',
    description: 'Nun sukun atau tanwin bertemu huruf Ba (ب).',
    howToRead: 'Mengubah bunyi nun sukun/tanwin menjadi suara Mim (م) disertai dengung dan bibir dirapatkan ringan.',
    letters: ['ب'],
    exampleArabic: 'مِنۢ بَعْدِ • سَمِيعٌۢ بَصِيرٌ',
    exampleTranslit: 'Mim ba\'di • Samii\'um bashiir',
    exampleSurah: 'QS. Al-Baqarah: 27',
  },
];

export const TajweedGuideModal: React.FC<TajweedGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('ghunnah');

  if (!isOpen) return null;

  const activeRule = TAJWEED_RULES.find((r) => r.id === selectedRuleId) || TAJWEED_RULES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <BookMarked className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                Panduan Tajwid Berwarna ✨
              </h2>
              <p className="text-xs text-emerald-100/80">
                Pahami aturan warna tajwid untuk membaca dan menghafal Al-Qur'an secara tartil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Rules Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {TAJWEED_RULES.map((rule) => {
              const isSelected = selectedRuleId === rule.id;
              return (
                <button
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${rule.dotColor}`} />
                  <span>{rule.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Rule Showcase Card */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${activeRule.badgeBg} ${activeRule.badgeText} inline-flex items-center gap-1.5`}>
                  <span className={`w-2 h-2 rounded-full ${activeRule.dotColor}`} />
                  {activeRule.name}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-2">
                  {activeRule.description}
                </h3>
              </div>
              <div className="font-arabic text-2xl sm:text-3xl text-emerald-700 dark:text-emerald-400 font-bold text-right shrink-0">
                {activeRule.arabicName}
              </div>
            </div>

            {/* How to read */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Cara Membaca / Tartil
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                {activeRule.howToRead}
              </p>
            </div>

            {/* Letters list */}
            <div>
              <div className="text-xs font-bold text-slate-500 mb-2">Huruf-huruf Terkait:</div>
              <div className="flex flex-wrap gap-1.5">
                {activeRule.letters.map((char, idx) => (
                  <span
                    key={idx}
                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-arabic text-xl font-bold flex items-center justify-center shadow-2xs"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Example Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2 text-center">
              <div className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Contoh Bacaan dalam Mushaf ({activeRule.exampleSurah})
              </div>
              <div className="font-arabic text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white py-1">
                {activeRule.exampleArabic}
              </div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 italic">
                {activeRule.exampleTranslit}
              </div>
            </div>
          </div>

          {/* Quick Color Summary Legend */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Ringkasan Warna Mushaf Tajwid
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 font-bold">
                <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                <span>Oranye: Ghunnah</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span>Kuning/Amber: Ikhfa'</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span>Hijau: Idgham</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold">
                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span>Biru: Qalqalah</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-pink-800 dark:text-pink-300 font-bold">
                <span className="w-3 h-3 rounded-full bg-pink-500 shrink-0" />
                <span>Merah/Pink: Mad Panjang</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 font-bold">
                <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
                <span>Teal: Iqlab (Mim Kecil)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
