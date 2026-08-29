import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen,
  Info
} from 'lucide-react';

interface MakharijulHurufModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MakhrajSection {
  id: string;
  nameIndo: string;
  nameArabic: string;
  badgeColor: string;
  description: string;
  subPoints: {
    title: string;
    letters: string[];
    articulationTip: string;
    exampleAudioText: string;
  }[];
}

const MAKHRAJ_DATA: MakhrajSection[] = [
  {
    id: 'halq',
    nameIndo: 'Al-Halq (Tenggorokan)',
    nameArabic: 'الحَلْقُ',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Tempat keluarnya huruf dari rongga tenggorokan, terbagi menjadi 3 bagian: pangkal, tengah, dan ujung.',
    subPoints: [
      {
        title: 'Pangkal Tenggorokan (Aqshal Halq)',
        letters: ['ء', 'هـ'],
        articulationTip: 'Keluar dari pita suara di bagian terdalam tenggorokan.',
        exampleAudioText: 'أَهْـ • إِذْ',
      },
      {
        title: 'Tengah Tenggorokan (Wasthul Halq)',
        letters: ['ع', 'ح'],
        articulationTip: 'Keluar dari katup epiglotis, terasa ada tekanan di tengah jakun.',
        exampleAudioText: 'عَلِمَ • حَمِدَ',
      },
      {
        title: 'Ujung Tenggorokan (Adnal Halq)',
        letters: ['غ', 'خ'],
        articulationTip: 'Keluar dari persambungan tenggorokan dengan anak lidah / langit-langit lunak.',
        exampleAudioText: 'غَفَرَ • خَلَقَ',
      },
    ],
  },
  {
    id: 'lisan',
    nameIndo: 'Al-Lisan (Lidah)',
    nameArabic: 'اللِّسَانُ',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    description: 'Makhraj terbanyak dengan 18 huruf hijaiyah dari pangkal lidah, tengah, tepi, hingga ujung lidah.',
    subPoints: [
      {
        title: 'Pangkal Lidah (Aqshal Lisan)',
        letters: ['ق', 'ك'],
        articulationTip: 'Qaf (ق): Pangkal lidah ke langit-langit lunak. Kaf (ك): Sedikit di bawah Qaf ke langit-langit keras.',
        exampleAudioText: 'قُلْ • كَانَ',
      },
      {
        title: 'Tengah Lidah (Wasthul Lisan)',
        letters: ['ج', 'ش', 'ي'],
        articulationTip: 'Tengah lidah terangkat mendekati langit-langit atas.',
        exampleAudioText: 'جَآءَ • شَمْسٌ • يَوْمٌ',
      },
      {
        title: 'Tepi Lidah (Hafatul Lisan)',
        letters: ['ض', 'ل'],
        articulationTip: 'Dhad (ض): Sisi lidah menempel ke geraham atas. Lam (ل): Ujung sisi lidah ke gusi atas.',
        exampleAudioText: 'ضَلَّ • لَيْلٌ',
      },
      {
        title: 'Ujung Lidah & Gigi (Tharaf Lisan)',
        letters: ['ن', 'ر', 'ط', 'د', 'ت', 'ص', 'ز', 'س', 'ظ', 'ذ', 'ث'],
        articulationTip: 'Ujung lidah bertemu gusi atas (ن, ر), pangkal gigi seri atas (ط, د, ت), dan ujung gigi seri (ظ, ذ, ث).',
        exampleAudioText: 'طَهَرَ • صَبَرَ • ذَكَرَ',
      },
    ],
  },
  {
    id: 'syafatain',
    nameIndo: 'Asy-Syafatain (Dua Bibir)',
    nameArabic: 'الشَّفَتَانِ',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    description: 'Tempat keluarnya huruf dari bibir atas dan bawah.',
    subPoints: [
      {
        title: 'Bibir Bawah Bagian Dalam & Gigi Depan',
        letters: ['ف'],
        articulationTip: 'Ujung gigi seri atas menempel ke bibir bawah bagian dalam.',
        exampleAudioText: 'فَتَحَ',
      },
      {
        title: 'Pertemuan Kedua Bibir',
        letters: ['ب', 'م', 'و'],
        articulationTip: 'Ba & Mim: Merapatkan kedua bibir. Waw: Membulatkan (memonyongkan) kedua bibir.',
        exampleAudioText: 'بَيْتٌ • مَاءٌ • وَاوٌ',
      },
    ],
  },
  {
    id: 'jauf',
    nameIndo: 'Al-Jauf (Rongga Mulut & Tenggorokan)',
    nameArabic: 'الجَوْفُ',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    description: 'Tempat keluarnya huruf Mad (panjang) yang mengalir tanpa hambatan lidah atau bibir.',
    subPoints: [
      {
        title: 'Huruf-huruf Mad Asli (Panjang Suara)',
        letters: ['ا', 'و', 'ي'],
        articulationTip: 'Alif setelah fathah, Waw sukun setelah dhammah, Ya sukun setelah kasrah.',
        exampleAudioText: 'نُوحِيهَا',
      },
    ],
  },
  {
    id: 'khaisyum',
    nameIndo: 'Al-Khaisyum (Pangkal Hidung)',
    nameArabic: 'الخَيْشُومُ',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    description: 'Tempat keluarnya dengung (Ghunnah) pada huruf Nun dan Mim bertasydid / ikhfa / idgham.',
    subPoints: [
      {
        title: 'Suara Ghunnah (Dengung Halus)',
        letters: ['نّ', 'مّ'],
        articulationTip: 'Udara dialirkan melalui rongga hidung sehingga menghasilkan getaran dengung yang indah.',
        exampleAudioText: 'إِنَّ • عَمَّ',
      },
    ],
  },
];

export const MakharijulHurufModal: React.FC<MakharijulHurufModalProps> = ({ isOpen, onClose }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('halq');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeSection = MAKHRAJ_DATA.find((s) => s.id === selectedSectionId) || MAKHRAJ_DATA[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                Peta Makharijul Huruf (مَخَارِجُ الحُرُوفِ) 🎙️
              </h2>
              <p className="text-xs text-emerald-100/80">
                Titik artikulasi tempat keluarnya 28 huruf hijaiyah agar fasih membaca Al-Qur'an
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
          {/* Main 5 Makhraj Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {MAKHRAJ_DATA.map((section) => {
              const isSelected = selectedSectionId === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setSelectedLetter(null);
                  }}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                  }`}
                >
                  <span className="font-arabic text-lg font-bold">{section.nameArabic}</span>
                  <span className="text-[11px] font-extrabold line-clamp-1">{section.nameIndo.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Section Detail Card */}
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${activeSection.badgeColor}`}>
                  {activeSection.nameIndo}
                </span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
                  {activeSection.description}
                </p>
              </div>
              <div className="font-arabic text-3xl sm:text-4xl font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                {activeSection.nameArabic}
              </div>
            </div>

            {/* Sub points */}
            <div className="space-y-3">
              {activeSection.subPoints.map((point, pIdx) => (
                <div
                  key={pIdx}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {point.title}
                    </h4>
                  </div>

                  {/* Letters chips */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {point.letters.map((letter, lIdx) => {
                      const isLetterSelected = selectedLetter === letter;
                      return (
                        <button
                          key={lIdx}
                          onClick={() => setSelectedLetter(isLetterSelected ? null : letter)}
                          className={`w-11 h-11 rounded-2xl font-arabic text-2xl font-bold flex items-center justify-center transition border shadow-xs cursor-pointer ${
                            isLetterSelected
                              ? 'bg-amber-500 border-amber-500 text-white scale-110'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                    <strong className="text-emerald-600 dark:text-emerald-400">💡 Tips Artikulasi:</strong> {point.articulationTip}
                  </p>

                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <span>Contoh Lafadz:</span>
                    <span className="font-arabic text-sm text-slate-800 dark:text-slate-200 font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {point.exampleAudioText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer"
          >
            Tutup Peta Makhraj
          </button>
        </div>
      </div>
    </div>
  );
};
