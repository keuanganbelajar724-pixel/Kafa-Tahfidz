import React, { useState } from 'react';
import { useKafa } from '../context/KafaContext';
import { LEVELS, getLevelForXp } from '../data/gamificationData';
import { 
  Trophy, 
  Star, 
  Award, 
  Gift, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Flame, 
  Crown,
  ChevronRight
} from 'lucide-react';

export const AchievementsView: React.FC = () => {
  const { 
    activeProfile, 
    profiles, 
    badges, 
    rewards, 
    claimReward, 
    triggerCelebration 
  } = useKafa();

  const [activeTab, setActiveTab] = useState<'levels' | 'badges' | 'leaderboard' | 'rewards'>('levels');

  const currentLevelInfo = getLevelForXp(activeProfile.xp);
  const nextLevel = LEVELS.find((l) => l.level === currentLevelInfo.level + 1);
  const xpNeededForNext = nextLevel ? nextLevel.minXp - activeProfile.xp : 0;
  const levelProgressPercent = nextLevel
    ? Math.round(((activeProfile.xp - currentLevelInfo.minXp) / (nextLevel.minXp - currentLevelInfo.minXp)) * 100)
    : 100;

  // Filter rewards for active child
  const childRewards = rewards.filter((r) => r.childId === activeProfile.id || !r.childId);

  const handleClaimReward = (rewardId: string, costXP: number) => {
    if (activeProfile.xp >= costXP) {
      claimReward(rewardId);
      triggerCelebration();
    }
  };

  // Sort profiles for family leaderboard
  const sortedLeaderboard = [...profiles].sort((a, b) => b.xp - a.xp);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-amber-100 backdrop-blur-md">
            Pusat Prestasi & Hadiah
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Prestasi & Level Qur'ani 🏆
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 max-w-md">
            Semangat beribadah, kumpulkan berkah, dan raih penghargaan istimewa.
          </p>
        </div>

        {/* Current XP Card */}
        <div className="bg-white/20 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/30 text-center shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-2xl font-black">
            <Star className="w-6 h-6 fill-white text-white" />
            <span>{activeProfile.xp}</span>
          </div>
          <div className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">
            Total XP Terkumpul
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'levels', label: '🚀 Jenjang Level', icon: Star },
          { id: 'badges', label: `🎖️ Lencana (${badges.filter((b) => b.unlocked).length}/${badges.length})`, icon: Award },
          { id: 'leaderboard', label: '👨‍👩‍👧 Papan Keluarga', icon: Crown },
          { id: 'rewards', label: '🎁 Toko Hadiah', icon: Gift },
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

      {/* TAB 1: LEVEL JOURNEY ROAD */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          {/* Current Level Progress Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Level Kamu Saat Ini
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{currentLevelInfo.icon}</span>
                  <span>Level {currentLevelInfo.level}: {currentLevelInfo.name}</span>
                </h3>
              </div>
              {nextLevel && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900">
                  Butuh {xpNeededForNext} XP lagi menuju Level {nextLevel.level}
                </span>
              )}
            </div>

            {/* Level Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>{currentLevelInfo.minXp} XP</span>
                <span>{levelProgressPercent}%</span>
                <span>{nextLevel ? `${nextLevel.minXp} XP` : 'MAX'}</span>
              </div>
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, levelProgressPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* All Levels Road map */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
              Peta Perjalanan Level:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LEVELS.map((lvl) => {
                const isCurrent = lvl.level === currentLevelInfo.level;
                const isPassed = activeProfile.xp >= lvl.minXp;

                return (
                  <div
                    key={lvl.level}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                      isCurrent
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/20'
                        : isPassed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{lvl.icon}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            Level {lvl.level}: {lvl.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                              Sekarang
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {lvl.minXp} - {lvl.maxXp} XP
                        </span>
                      </div>
                    </div>

                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BADGES GALLERY */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-3xl border transition flex items-start gap-4 ${
                badge.unlocked
                  ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/60 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-xs ${
                  badge.unlocked
                    ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-300'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                {badge.icon}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {badge.title}
                  </h4>
                  {badge.unlocked ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Terbuka ✨
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      {badge.progressPercent}%
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {badge.description}
                </p>

                {!badge.unlocked && (
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${badge.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: FAMILY LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>👨‍👩‍👧</span>
                <span>Peringkat Semangat Keluarga</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Berlomba-lomba dalam kebaikan secara saling menyemangati.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {sortedLeaderboard.map((child, rank) => {
              const isCurrent = child.id === activeProfile.id;
              const rankMedals = ['🥇', '🥈', '🥉'];

              return (
                <div
                  key={child.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${
                    isCurrent
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black w-8 text-center">
                      {rank < 3 ? rankMedals[rank] : `#${rank + 1}`}
                    </span>
                    <span className="text-2xl">{child.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {child.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                            Kamu
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {child.grade} • {child.levelName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-amber-600 dark:text-amber-400">
                      {child.xp} XP
                    </div>
                    <div className="text-[11px] font-bold text-orange-500 flex items-center justify-end gap-1">
                      <Flame className="w-3 h-3 fill-current" />
                      <span>{child.streak} Hari</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: REWARD SHOP */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 font-medium">
            💡 <strong>Info Hadiah:</strong> Hadiah diatur oleh Orang Tua sebagai bentuk apresiasi non-finansial atas ketekunan hafalan anak.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {childRewards.map((rew) => {
              const canAfford = activeProfile.xp >= rew.costXP;

              return (
                <div
                  key={rew.id}
                  className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-4 ${
                    rew.isClaimed
                      ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center text-2xl shrink-0">
                      {rew.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {rew.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {rew.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {rew.costXP} XP
                    </span>

                    {rew.isClaimed ? (
                      <span className="text-xs font-bold text-slate-400">
                        ✅ Sudah Diklaim
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimReward(rew.id, rew.costXP)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-sm ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Tukarkan Hadiah 🎁' : 'XP Belum Cukup'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
