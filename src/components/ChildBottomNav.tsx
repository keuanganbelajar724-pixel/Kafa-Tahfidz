import React from 'react';
import { 
  Home, 
  BookOpen, 
  RotateCcw, 
  Gamepad2, 
  Trophy, 
  User 
} from 'lucide-react';

export type ChildTab = 'beranda' | 'hafalan' | 'murajaah' | 'games' | 'prestasi' | 'profil';

interface ChildBottomNavProps {
  activeTab: ChildTab;
  onSelectTab: (tab: ChildTab) => void;
}

export const ChildBottomNav: React.FC<ChildBottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'hafalan', label: 'Hafalan', icon: BookOpen },
    { id: 'murajaah', label: 'Muraja\'ah', icon: RotateCcw },
    { id: 'games', label: 'Tantangan', icon: Gamepad2 },
    { id: 'prestasi', label: 'Prestasi', icon: Trophy },
    { id: 'profil', label: 'Profil', icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe transition-all shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as ChildTab)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 min-w-[56px] ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 shadow-xs'
                    : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-0.5 leading-tight tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
