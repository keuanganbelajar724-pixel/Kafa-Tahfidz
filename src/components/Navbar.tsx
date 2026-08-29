import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { 
  BookOpen, 
  Flame, 
  Star, 
  Moon, 
  Sun, 
  Sparkles, 
  UserPlus, 
  Check, 
  ChevronDown,
  Palette,
  BookMarked,
  Mic,
  Award,
  Scroll
} from 'lucide-react';
import { AppRole } from '../types';
import { TajweedGuideModal } from './TajweedGuideModal';
import { MakharijulHurufModal } from './MakharijulHurufModal';
import { TahfizCertificateModal } from './TahfizCertificateModal';

interface NavbarProps {
  onOpenOnboarding: () => void;
  onOpenAssistant: () => void;
  onOpenVoiceGate?: (surahId?: number, ayahNumber?: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenOnboarding, onOpenAssistant, onOpenVoiceGate }) => {
  const { 
    role, 
    setRole, 
    profiles, 
    activeProfile, 
    activeProfileId, 
    switchProfile, 
    settings, 
    updateSettings,
    cloudSync,
    syncAllToCloud
  } = useKafa();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const handleQuickSync = async () => {
    setIsCloudSyncing(true);
    await syncAllToCloud();
    setIsCloudSyncing(false);
  };

  // Modals state
  const [isTajweedModalOpen, setIsTajweedModalOpen] = useState(false);
  const [isMakhrajModalOpen, setIsMakhrajModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const themeOptions = [
    { id: 'light', name: 'Terang (Cerah)', icon: '☀️', desc: 'Emerald Daylight', bg: 'bg-emerald-50 text-emerald-900' },
    { id: 'dark', name: 'Gelap (Malam)', icon: '🌙', desc: 'Deep Night Mode', bg: 'bg-slate-900 text-slate-100' },
    { id: 'sepia', name: 'Mushaf Klasik', icon: '📜', desc: 'Kertas Kuning / Sepia', bg: 'bg-[#fbf7ee] text-[#3b2a1a]' },
    { id: 'midnight', name: 'Midnight Emas', icon: '🌌', desc: 'Royal Navy & Gold', bg: 'bg-[#060d1a] text-amber-300' },
  ];

  const roleLabels: Record<AppRole, { label: string; icon: string; badgeColor: string }> = {
    child: { label: 'Mode Anak', icon: '👦', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
    parent: { label: 'Mode Orang Tua', icon: '👨‍👩‍👧', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
    admin: { label: 'Mode Admin', icon: '⚙️', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand & Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-bold overflow-hidden">
              <img src="/favicon.svg" alt="KAFA TAHFIZ Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                  KAFA TAHFIZ
                </span>
                {settings.ramadanMode && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-medium flex items-center gap-1">
                    🌙 Ramadan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                Hafal Qur'an • Lancar Muraja'ah • 30 Juz
              </p>
            </div>
          </div>

          {/* Center Quick Tools (Tajweed, Makhraj, Cert) */}
          <div className="hidden lg:flex items-center gap-1.5">
            {onOpenVoiceGate && (
              <button
                onClick={() => onOpenVoiceGate()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-sm transition cursor-pointer animate-pulse"
                title="Uji Lisan Real-Time & Gembok Lanjutan Ayat (Voice Gate)"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Uji Lisan Live</span>
              </button>
            )}

            <button
              onClick={() => setIsTajweedModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-bold transition border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
            >
              <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
              <span>Panduan Tajwid</span>
            </button>

            <button
              onClick={() => setIsMakhrajModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-bold transition border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-teal-600" />
              <span>Makharijul Huruf</span>
            </button>

            <button
              onClick={() => setIsCertModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold transition border border-amber-200 dark:border-amber-900/60 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Syahadah Tahfiz</span>
            </button>
          </div>

          {/* Center / Right stats for Child Mode */}
          {role === 'child' && (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Streak Counter */}
              <div 
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition hover:scale-105"
                title={`${activeProfile.streak} Hari Berturut-turut Belajar!`}
              >
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
                <span>{activeProfile.streak}</span>
                <span className="hidden md:inline font-normal text-xs text-orange-500">Hari</span>
              </div>

              {/* XP Badge */}
              <div 
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition hover:scale-105"
                title={`${activeProfile.xp} XP terkumpul! Level ${activeProfile.level}: ${activeProfile.levelName}`}
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{activeProfile.xp}</span>
                <span className="hidden md:inline font-normal text-xs text-amber-600">XP</span>
              </div>

              {/* Kak Kafa AI Assistant trigger */}
              <button
                onClick={onOpenAssistant}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Kak Kafa AI</span>
              </button>
            </div>
          )}

          {/* Right action group: Profile switcher, Role switcher, Theme */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Child Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-1.5 p-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                <span className="text-base sm:text-lg">{activeProfile.avatar}</span>
                <span className="hidden sm:inline font-bold text-slate-800 dark:text-slate-200">
                  {activeProfile.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilih Profil Anak
                  </div>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => switchProfile(p.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                        p.id === activeProfileId
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{p.avatar}</span>
                        <div>
                          <div className="font-bold text-sm leading-tight">{p.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.grade} • Lv.{p.level} ({p.xp} XP)
                          </div>
                        </div>
                      </div>
                      {p.id === activeProfileId && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}

                  <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={onOpenOnboarding}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Tambah Profil Anak Baru</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-bold transition shadow-xs cursor-pointer ${roleLabels[role].badgeColor}`}
              >
                <span>{roleLabels[role].icon}</span>
                <span className="hidden md:inline">{roleLabels[role].label}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showRoleDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowRoleDropdown(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Ganti Tampilan
                  </div>
                  {(['child', 'parent', 'admin'] as AppRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                        role === r
                          ? 'bg-slate-100 dark:bg-slate-700 font-bold text-slate-900 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{roleLabels[r].icon}</span>
                        <span>{roleLabels[r].label}</span>
                      </div>
                      {role === r && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Firebase Cloud Sync Button */}
            <button
              onClick={handleQuickSync}
              disabled={isCloudSyncing}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
              title={`Firebase Terhubung (${cloudSync.projectId}). Klik untuk sinkronisasi instan.`}
            >
              <span className="text-sm">🔥</span>
              <span className="hidden xl:inline text-[11px]">
                {isCloudSyncing ? 'Sinkron...' : (cloudSync.lastSyncedAt ? `Cloud ${cloudSync.lastSyncedAt}` : 'Firebase Live')}
              </span>
            </button>

            {/* Luxury Theme Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="flex items-center gap-1 p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                title="Pilih Tema Tampilan"
              >
                <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>

              {showThemeDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowThemeDropdown(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Tema Mushaf & Nuansa
                  </div>
                  {themeOptions.map((t) => {
                    const isCurrent = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => updateSettings({ theme: t.id as any })}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold ring-1 ring-emerald-500/30'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{t.icon}</span>
                          <div>
                            <div className="font-bold">{t.name}</div>
                            <div className="text-[10px] text-slate-400">{t.desc}</div>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Modals for Quick Learning Tools */}
      <TajweedGuideModal
        isOpen={isTajweedModalOpen}
        onClose={() => setIsTajweedModalOpen(false)}
      />

      <MakharijulHurufModal
        isOpen={isMakhrajModalOpen}
        onClose={() => setIsMakhrajModalOpen(false)}
      />

      <TahfizCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        surahName="An-Naba'"
        surahId={78}
        juzNumber={30}
        score={96}
      />
    </>
  );
};

