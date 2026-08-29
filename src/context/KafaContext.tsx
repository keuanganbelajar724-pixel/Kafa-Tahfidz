import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  AppRole,
  ChildProfile,
  AyahProgress,
  SetorAttempt,
  DailyQuest,
  AchievementBadge,
  RewardItem,
  StudyPlan,
  AppSettings,
  ParentNotificationSetting,
  MemorizationStatus,
} from '../types';
import { INITIAL_BADGES, INITIAL_QUESTS, INITIAL_REWARDS, getLevelForXp } from '../data/gamificationData';
import {
  syncProfilesToCloud,
  syncAyahProgressToCloud,
  syncSetorAttemptsListToCloud,
  syncSetorAttemptToCloud,
  syncQuestsToCloud,
  syncBadgesToCloud,
  syncRewardsToCloud,
  syncStudyPlansToCloud,
  syncSettingsToCloud,
  fetchAllDataFromCloud,
  subscribeToProfiles
} from '../services/firebaseSyncService';
import { isInitialized, firebaseConfig } from '../lib/firebase';

export interface CloudSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  projectId: string;
}

interface KafaContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  profiles: ChildProfile[];
  activeProfile: ChildProfile;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  ayahProgressList: AyahProgress[];
  setorAttempts: SetorAttempt[];
  quests: DailyQuest[];
  badges: AchievementBadge[];
  rewards: RewardItem[];
  studyPlans: StudyPlan[];
  settings: AppSettings;
  parentNotifications: ParentNotificationSetting;
  cloudSync: CloudSyncState;
  syncAllToCloud: () => Promise<boolean>;
  restoreFromCloud: () => Promise<boolean>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateParentNotifications: (newNotifications: Partial<ParentNotificationSetting>) => void;
  switchProfile: (profileId: string) => void;
  addNewChild: (data: { name: string; age: number; grade: string; startPoint: string; dailyTarget: number; avatar: string }) => string;
  updateAyahProgress: (surahId: number, ayahNumber: number, status: MemorizationStatus, score?: number) => void;
  recordSetorAttempt: (attempt: Omit<SetorAttempt, 'id' | 'timestamp'>) => Promise<void>;
  completeQuest: (questId: string) => void;
  claimReward: (rewardId: string) => void;
  approveReward: (rewardId: string) => void;
  createReward: (title: string, description: string, icon: string, costXP: number, childId?: string) => void;
  deleteReward: (rewardId: string) => void;
  addXP: (amount: number, reason?: string) => void;
  triggerCelebration: () => void;
  createStudyPlan: (targetSurahId: number, targetSurahName: string, targetDate: string, dailyAyatCount: number) => void;
  getAyahProgress: (surahId: number, ayahNumber: number) => AyahProgress | undefined;
  getSurahProgressStats: (surahId: number, totalAyat: number) => { memorized: number; inProgress: number; percentage: number };
}

const INITIAL_PROFILES: ChildProfile[] = [
  {
    id: "child_1",
    name: "Ahmad",
    avatar: "👦",
    age: 9,
    grade: "Kelas 3 SD",
    currentJuz: 30,
    currentSurahId: 78,
    targetDailyAyat: 3,
    xp: 420,
    level: 3,
    levelName: "Pejuang Hafalan",
    streak: 14,
    lastActiveDate: "2026-08-26",
    historyDates: ["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25", "2026-08-26"],
    murajaahDates: ["2026-08-22", "2026-08-24", "2026-08-26"],
  },
  {
    id: "child_2",
    name: "Aisyah",
    avatar: "🧕",
    age: 7,
    grade: "Kelas 1 SD",
    currentJuz: 30,
    currentSurahId: 112,
    targetDailyAyat: 2,
    xp: 280,
    level: 3,
    levelName: "Pejuang Hafalan",
    streak: 8,
    lastActiveDate: "2026-08-26",
    historyDates: ["2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25", "2026-08-26"],
    murajaahDates: ["2026-08-23", "2026-08-25"],
  },
  {
    id: "child_3",
    name: "Yusuf",
    avatar: "🧒",
    age: 5,
    grade: "TK B",
    currentJuz: 30,
    currentSurahId: 114,
    targetDailyAyat: 1,
    xp: 140,
    level: 2,
    levelName: "Pencinta Qur'an",
    streak: 4,
    lastActiveDate: "2026-08-25",
    historyDates: ["2026-08-23", "2026-08-24", "2026-08-25"],
    murajaahDates: ["2026-08-24"],
  },
];

const INITIAL_PROGRESS: AyahProgress[] = [
  // Ahmad: An-Naba 1-5
  { childId: "child_1", surahId: 78, ayahNumber: 1, status: "memorized", score: 95, fluencyScore: 92, lastReviewedDate: "2026-08-26", nextReviewDate: "2026-08-30", attemptCount: 4 },
  { childId: "child_1", surahId: 78, ayahNumber: 2, status: "memorized", score: 92, fluencyScore: 90, lastReviewedDate: "2026-08-26", nextReviewDate: "2026-08-30", attemptCount: 3 },
  { childId: "child_1", surahId: 78, ayahNumber: 3, status: "almost_memorized", score: 85, fluencyScore: 82, lastReviewedDate: "2026-08-25", nextReviewDate: "2026-08-27", attemptCount: 2 },
  { childId: "child_1", surahId: 78, ayahNumber: 4, status: "in_progress", score: 75, fluencyScore: 78, lastReviewedDate: "2026-08-26", nextReviewDate: "2026-08-27", attemptCount: 2 },
  { childId: "child_1", surahId: 78, ayahNumber: 5, status: "not_started", score: 0, fluencyScore: 0, lastReviewedDate: "", nextReviewDate: "", attemptCount: 0 },
  
  // Ahmad: An-Nas complete
  { childId: "child_1", surahId: 114, ayahNumber: 1, status: "memorized", score: 98, fluencyScore: 95, lastReviewedDate: "2026-08-24", nextReviewDate: "2026-09-01", attemptCount: 5 },
  { childId: "child_1", surahId: 114, ayahNumber: 2, status: "memorized", score: 96, fluencyScore: 95, lastReviewedDate: "2026-08-24", nextReviewDate: "2026-09-01", attemptCount: 4 },
  { childId: "child_1", surahId: 114, ayahNumber: 3, status: "memorized", score: 94, fluencyScore: 92, lastReviewedDate: "2026-08-24", nextReviewDate: "2026-09-01", attemptCount: 4 },
  { childId: "child_1", surahId: 114, ayahNumber: 4, status: "needs_murajaah", score: 78, fluencyScore: 75, lastReviewedDate: "2026-08-20", nextReviewDate: "2026-08-25", attemptCount: 3 },
  { childId: "child_1", surahId: 114, ayahNumber: 5, status: "memorized", score: 95, fluencyScore: 92, lastReviewedDate: "2026-08-24", nextReviewDate: "2026-09-01", attemptCount: 4 },
  { childId: "child_1", surahId: 114, ayahNumber: 6, status: "memorized", score: 96, fluencyScore: 94, lastReviewedDate: "2026-08-24", nextReviewDate: "2026-09-01", attemptCount: 4 },

  // Ahmad: Al-Ikhlas complete
  { childId: "child_1", surahId: 112, ayahNumber: 1, status: "memorized", score: 100, fluencyScore: 98, lastReviewedDate: "2026-08-25", nextReviewDate: "2026-09-05", attemptCount: 6 },
  { childId: "child_1", surahId: 112, ayahNumber: 2, status: "memorized", score: 100, fluencyScore: 96, lastReviewedDate: "2026-08-25", nextReviewDate: "2026-09-05", attemptCount: 5 },
  { childId: "child_1", surahId: 112, ayahNumber: 3, status: "memorized", score: 98, fluencyScore: 95, lastReviewedDate: "2026-08-25", nextReviewDate: "2026-09-05", attemptCount: 5 },
  { childId: "child_1", surahId: 112, ayahNumber: 4, status: "memorized", score: 96, fluencyScore: 94, lastReviewedDate: "2026-08-25", nextReviewDate: "2026-09-05", attemptCount: 5 },
];

const INITIAL_ATTEMPTS: SetorAttempt[] = [
  {
    id: "att_1",
    childId: "child_1",
    surahId: 78,
    surahName: "An-Naba'",
    ayahNumber: 1,
    ayahText: "عَمَّ يَتَسَاءَلُونَ",
    score: 95,
    accuracy: 96,
    fluency: 94,
    mistakesCount: 0,
    missedWords: [],
    feedback: "🌟 Luar biasa Ahmad! Bacaan dan panjang mad sangat tepat.",
    detailedTip: "Pertahankan ketenangan saat membaca ayat pembuka.",
    timestamp: "2026-08-26T09:30:00Z",
    isAiEvaluated: true,
  },
  {
    id: "att_2",
    childId: "child_1",
    surahId: 78,
    surahName: "An-Naba'",
    ayahNumber: 2,
    ayahText: "عَنِ النَّبَإِ الْعَظِيمِ",
    score: 92,
    accuracy: 94,
    fluency: 90,
    mistakesCount: 1,
    missedWords: ["الْعَظِيمِ"],
    feedback: "✨ Bagus sekali! Perjelas pengucapan huruf 'Zha' (ظ) di kata Al-'Adzhiim.",
    detailedTip: "Lidah sedikit menyentuh ujung gigi depan atas.",
    timestamp: "2026-08-26T09:32:00Z",
    isAiEvaluated: true,
  },
  {
    id: "att_3",
    childId: "child_1",
    surahId: 78,
    surahName: "An-Naba'",
    ayahNumber: 4,
    ayahText: "كَلَّا سَيَعْلَمُونَ",
    score: 75,
    accuracy: 78,
    fluency: 72,
    mistakesCount: 2,
    missedWords: ["سَيَعْلَمُونَ"],
    feedback: "🌱 Usaha yang bagus! Coba dengarkan murottal 2x lagi lalu ulangi ya.",
    detailedTip: "Ayat 4 dan 5 memiliki kesamaan kata, perhatikan beda awalan 'Kalla' dan 'Tsumma kalla'.",
    timestamp: "2026-08-26T09:35:00Z",
    isAiEvaluated: true,
  },
];

const INITIAL_STUDY_PLANS: StudyPlan[] = [
  {
    id: "plan_1",
    childId: "child_1",
    targetSurahId: 78,
    targetSurahName: "An-Naba'",
    targetDate: "2026-09-02",
    dailyAyatCount: 3,
    days: [
      { dayName: "Senin", dateStr: "2026-08-24", taskType: "hafalan_baru", surahName: "An-Naba'", surahId: 78, ayahRange: "Ayat 1–3", completed: true },
      { dayName: "Selasa", dateStr: "2026-08-25", taskType: "hafalan_baru", surahName: "An-Naba'", surahId: 78, ayahRange: "Ayat 4–5", completed: true },
      { dayName: "Rabu", dateStr: "2026-08-26", taskType: "murajaah", surahName: "An-Naba'", surahId: 78, ayahRange: "Ayat 1–5 (Muraja'ah)", completed: false },
      { dayName: "Kamis", dateStr: "2026-08-27", taskType: "hafalan_baru", surahName: "An-Naba'", surahId: 78, ayahRange: "Ayat 6–8", completed: false },
      { dayName: "Jumat", dateStr: "2026-08-28", taskType: "hafalan_baru", surahName: "An-Naba'", surahId: 78, ayahRange: "Ayat 9–10", completed: false },
      { dayName: "Sabtu", dateStr: "2026-08-29", taskType: "evaluasi", surahName: "An-Naba'", surahId: 78, ayahRange: "Setoran Mingguan Ayat 1–10", completed: false },
      { dayName: "Ahad", dateStr: "2026-08-30", taskType: "murajaah", surahName: "Surat Pendek", surahId: 114, ayahRange: "Muraja'ah Bebas", completed: false },
    ],
  },
];

const KafaContext = createContext<KafaContextType | undefined>(undefined);

export const KafaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load from local storage or defaults
  const [role, setRole] = useState<AppRole>(() => {
    return (localStorage.getItem('kafa_role') as AppRole) || 'child';
  });

  const [profiles, setProfiles] = useState<ChildProfile[]>(() => {
    const saved = localStorage.getItem('kafa_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('kafa_active_profile') || 'child_1';
  });

  const [ayahProgressList, setAyahProgressList] = useState<AyahProgress[]>(() => {
    const saved = localStorage.getItem('kafa_ayah_progress');
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
  });

  const [setorAttempts, setSetorAttempts] = useState<SetorAttempt[]>(() => {
    const saved = localStorage.getItem('kafa_setor_attempts');
    return saved ? JSON.parse(saved) : INITIAL_ATTEMPTS;
  });

  const [quests, setQuests] = useState<DailyQuest[]>(() => {
    const saved = localStorage.getItem('kafa_quests');
    return saved ? JSON.parse(saved) : INITIAL_QUESTS;
  });

  const [badges, setBadges] = useState<AchievementBadge[]>(() => {
    const saved = localStorage.getItem('kafa_badges');
    return saved ? JSON.parse(saved) : INITIAL_BADGES;
  });

  const [rewards, setRewards] = useState<RewardItem[]>(() => {
    const saved = localStorage.getItem('kafa_rewards');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>(() => {
    const saved = localStorage.getItem('kafa_study_plans');
    return saved ? JSON.parse(saved) : INITIAL_STUDY_PLANS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('kafa_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      ramadanMode: false,
      fontSizeArabic: 'large',
      defaultReciter: 'Mishary Rashid Alafasy',
      autoPlayNextAyah: true,
      keepAudioRecordings: true,
    };
  });

  const [parentNotifications, setParentNotifications] = useState<ParentNotificationSetting>(() => {
    const saved = localStorage.getItem('kafa_parent_notifs');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      dailyReminderTime: "16:00",
      streakAlerts: true,
      weeklyReportAlerts: true,
      setoranAlerts: true,
    };
  });

  const [cloudSync, setCloudSync] = useState<CloudSyncState>({
    isConnected: isInitialized,
    isSyncing: false,
    lastSyncedAt: localStorage.getItem('kafa_last_synced') || null,
    projectId: firebaseConfig.projectId || 'Firebase Connected',
  });

  const isInitialCloudLoadDone = useRef(false);

  // Initial cloud fetch / sync
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function initCloud() {
      if (!isInitialized) return;

      try {
        setCloudSync((prev) => ({ ...prev, isSyncing: true }));
        const cloudData = await fetchAllDataFromCloud();

        if (cloudData) {
          if (cloudData.profiles && cloudData.profiles.length > 0) {
            setProfiles(cloudData.profiles);
          } else {
            // Seed initial profiles to Firestore
            await syncProfilesToCloud(profiles);
          }

          if (cloudData.ayahProgress && cloudData.ayahProgress.length > 0) {
            setAyahProgressList(cloudData.ayahProgress);
          } else {
            await syncAyahProgressToCloud(ayahProgressList);
          }

          if (cloudData.setorAttempts && cloudData.setorAttempts.length > 0) {
            setSetorAttempts(cloudData.setorAttempts);
          } else {
            await syncSetorAttemptsListToCloud(setorAttempts);
          }

          if (cloudData.quests && cloudData.quests.length > 0) {
            setQuests(cloudData.quests);
          }
          if (cloudData.badges && cloudData.badges.length > 0) {
            setBadges(cloudData.badges);
          }
          if (cloudData.rewards && cloudData.rewards.length > 0) {
            setRewards(cloudData.rewards);
          }
          if (cloudData.studyPlans && cloudData.studyPlans.length > 0) {
            setStudyPlans(cloudData.studyPlans);
          }
          if (cloudData.settings) {
            setSettings(cloudData.settings);
          }
          if (cloudData.parentNotifs) {
            setParentNotifications(cloudData.parentNotifs);
          }

          const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          localStorage.setItem('kafa_last_synced', nowStr);
          setCloudSync({
            isConnected: true,
            isSyncing: false,
            lastSyncedAt: nowStr,
            projectId: firebaseConfig.projectId,
          });
        }
      } catch (err) {
        console.warn('Initial cloud sync notice:', err);
        setCloudSync((prev) => ({ ...prev, isSyncing: false }));
      } finally {
        isInitialCloudLoadDone.current = true;
      }

      // Realtime listener for multi-device sync
      const unsub = subscribeToProfiles((updatedProfiles) => {
        if (updatedProfiles && updatedProfiles.length > 0) {
          setProfiles(updatedProfiles);
        }
      });
      if (unsub) unsubscribe = unsub;
    }

    initCloud();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Manual Full Sync to Cloud
  const syncAllToCloud = async (): Promise<boolean> => {
    if (!isInitialized) return false;
    setCloudSync((prev) => ({ ...prev, isSyncing: true }));
    try {
      await Promise.all([
        syncProfilesToCloud(profiles),
        syncAyahProgressToCloud(ayahProgressList),
        syncSetorAttemptsListToCloud(setorAttempts),
        syncQuestsToCloud(quests),
        syncBadgesToCloud(badges),
        syncRewardsToCloud(rewards),
        syncStudyPlansToCloud(studyPlans),
        syncSettingsToCloud(settings, parentNotifications),
      ]);

      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('kafa_last_synced', nowStr);
      setCloudSync({
        isConnected: true,
        isSyncing: false,
        lastSyncedAt: nowStr,
        projectId: firebaseConfig.projectId,
      });
      return true;
    } catch (err) {
      console.error('Manual sync to cloud failed:', err);
      setCloudSync((prev) => ({ ...prev, isSyncing: false }));
      return false;
    }
  };

  // Manual Restore from Cloud
  const restoreFromCloud = async (): Promise<boolean> => {
    if (!isInitialized) return false;
    setCloudSync((prev) => ({ ...prev, isSyncing: true }));
    try {
      const data = await fetchAllDataFromCloud();
      if (data) {
        if (data.profiles && data.profiles.length > 0) setProfiles(data.profiles);
        if (data.ayahProgress && data.ayahProgress.length > 0) setAyahProgressList(data.ayahProgress);
        if (data.setorAttempts && data.setorAttempts.length > 0) setSetorAttempts(data.setorAttempts);
        if (data.quests && data.quests.length > 0) setQuests(data.quests);
        if (data.badges && data.badges.length > 0) setBadges(data.badges);
        if (data.rewards && data.rewards.length > 0) setRewards(data.rewards);
        if (data.studyPlans && data.studyPlans.length > 0) setStudyPlans(data.studyPlans);
        if (data.settings) setSettings(data.settings);
        if (data.parentNotifs) setParentNotifications(data.parentNotifs);

        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem('kafa_last_synced', nowStr);
        setCloudSync({
          isConnected: true,
          isSyncing: false,
          lastSyncedAt: nowStr,
          projectId: firebaseConfig.projectId,
        });
        return true;
      }
      setCloudSync((prev) => ({ ...prev, isSyncing: false }));
      return false;
    } catch (err) {
      console.error('Restore from cloud failed:', err);
      setCloudSync((prev) => ({ ...prev, isSyncing: false }));
      return false;
    }
  };

  // Sync to localStorage and Firestore in background
  useEffect(() => {
    localStorage.setItem('kafa_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('kafa_profiles', JSON.stringify(profiles));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncProfilesToCloud(profiles).catch(console.warn);
    }
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('kafa_active_profile', activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    localStorage.setItem('kafa_ayah_progress', JSON.stringify(ayahProgressList));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncAyahProgressToCloud(ayahProgressList).catch(console.warn);
    }
  }, [ayahProgressList]);

  useEffect(() => {
    localStorage.setItem('kafa_setor_attempts', JSON.stringify(setorAttempts));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncSetorAttemptsListToCloud(setorAttempts).catch(console.warn);
    }
  }, [setorAttempts]);

  useEffect(() => {
    localStorage.setItem('kafa_quests', JSON.stringify(quests));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncQuestsToCloud(quests).catch(console.warn);
    }
  }, [quests]);

  useEffect(() => {
    localStorage.setItem('kafa_badges', JSON.stringify(badges));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncBadgesToCloud(badges).catch(console.warn);
    }
  }, [badges]);

  useEffect(() => {
    localStorage.setItem('kafa_rewards', JSON.stringify(rewards));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncRewardsToCloud(rewards).catch(console.warn);
    }
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem('kafa_study_plans', JSON.stringify(studyPlans));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncStudyPlansToCloud(studyPlans).catch(console.warn);
    }
  }, [studyPlans]);

  useEffect(() => {
    localStorage.setItem('kafa_settings', JSON.stringify(settings));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncSettingsToCloud(settings, parentNotifications).catch(console.warn);
    }
    
    // Clear all existing theme classes
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-sepia', 'theme-midnight');
    document.body.classList.remove('dark', 'theme-sepia', 'theme-midnight');

    let effectiveTheme = settings.theme;
    if (effectiveTheme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else if (effectiveTheme === 'sepia') {
      root.classList.add('theme-sepia');
      document.body.classList.add('theme-sepia');
    } else if (effectiveTheme === 'midnight') {
      root.classList.add('dark', 'theme-midnight');
      document.body.classList.add('dark', 'theme-midnight');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('kafa_parent_notifs', JSON.stringify(parentNotifications));
    if (isInitialCloudLoadDone.current && isInitialized) {
      syncSettingsToCloud(settings, parentNotifications).catch(console.warn);
    }
  }, [parentNotifications]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0d9488', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
      });
    } catch {
      // ignore
    }
  };

  const addXP = (amount: number, _reason?: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === activeProfileId) {
          const newXp = p.xp + amount;
          const newLevelInfo = getLevelForXp(newXp);
          if (newLevelInfo.level > p.level) {
            triggerCelebration();
          }
          return {
            ...p,
            xp: newXp,
            level: newLevelInfo.level,
            levelName: newLevelInfo.name,
          };
        }
        return p;
      })
    );
  };

  const switchProfile = (profileId: string) => {
    setActiveProfileId(profileId);
  };

  const addNewChild = (data: {
    name: string;
    age: number;
    grade: string;
    startPoint: string;
    dailyTarget: number;
    avatar: string;
  }): string => {
    const newId = `child_${Date.now()}`;
    let initialSurahId = 114;
    if (data.startPoint === 'Juz 30' || data.startPoint === 'Juz Amma') {
      initialSurahId = 78;
    }

    const newProfile: ChildProfile = {
      id: newId,
      name: data.name,
      avatar: data.avatar || "👦",
      age: data.age,
      grade: data.grade,
      currentJuz: 30,
      currentSurahId: initialSurahId,
      targetDailyAyat: data.dailyTarget || 2,
      xp: 0,
      level: 1,
      levelName: "Pemula",
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      historyDates: [new Date().toISOString().split('T')[0]],
      murajaahDates: [],
    };

    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newId);
    triggerCelebration();
    return newId;
  };

  const getAyahProgress = (surahId: number, ayahNumber: number): AyahProgress | undefined => {
    return ayahProgressList.find(
      (ap) => ap.childId === activeProfileId && ap.surahId === surahId && ap.ayahNumber === ayahNumber
    );
  };

  const updateAyahProgress = (
    surahId: number,
    ayahNumber: number,
    status: MemorizationStatus,
    score: number = 85
  ) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Adaptive review date calculation
    let daysToAdd = 3;
    if (score >= 90) daysToAdd = 5;
    else if (score >= 75) daysToAdd = 2;
    else daysToAdd = 1;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    const nextReviewDate = nextDate.toISOString().split('T')[0];

    setAyahProgressList((prev) => {
      const existingIdx = prev.findIndex(
        (ap) => ap.childId === activeProfileId && ap.surahId === surahId && ap.ayahNumber === ayahNumber
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          status,
          score,
          lastReviewedDate: today,
          nextReviewDate,
          attemptCount: updated[existingIdx].attemptCount + 1,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            childId: activeProfileId,
            surahId,
            ayahNumber,
            status,
            score,
            fluencyScore: Math.min(100, score + 2),
            lastReviewedDate: today,
            nextReviewDate,
            attemptCount: 1,
          },
        ];
      }
    });

    // Update profile history date if not yet added
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === activeProfileId) {
          const hasToday = p.historyDates.includes(today);
          return {
            ...p,
            lastActiveDate: today,
            historyDates: hasToday ? p.historyDates : [...p.historyDates, today],
          };
        }
        return p;
      })
    );
  };

  const recordSetorAttempt = async (attemptData: Omit<SetorAttempt, 'id' | 'timestamp'>) => {
    const newAttempt: SetorAttempt = {
      ...attemptData,
      id: `attempt_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setSetorAttempts((prev) => [newAttempt, ...prev]);

    // Update progress state
    let newStatus: MemorizationStatus = 'in_progress';
    if (newAttempt.score >= 90) {
      newStatus = 'memorized';
    } else if (newAttempt.score >= 75) {
      newStatus = 'almost_memorized';
    } else {
      newStatus = 'needs_murajaah';
    }

    updateAyahProgress(newAttempt.surahId, newAttempt.ayahNumber, newStatus, newAttempt.score);

    // Award XP
    addXP(20, `Setor Hafalan Ayat ${newAttempt.ayahNumber}`);

    if (newAttempt.score >= 85) {
      triggerCelebration();
    }
  };

  const completeQuest = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && !q.isCompleted) {
          addXP(q.xpReward, `Menyelesaikan Quest: ${q.title}`);
          triggerCelebration();
          return { ...q, isCompleted: true, currentCount: q.targetCount };
        }
        return q;
      })
    );
  };

  const claimReward = (rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) => {
        if (r.id === rewardId) {
          return { ...r, isClaimed: true, claimedAt: new Date().toISOString() };
        }
        return r;
      })
    );
  };

  const approveReward = (rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) => {
        if (r.id === rewardId) {
          return { ...r, isApprovedByParent: true };
        }
        return r;
      })
    );
  };

  const createReward = (title: string, description: string, icon: string, costXP: number, childId?: string) => {
    const newReward: RewardItem = {
      id: `rew_${Date.now()}`,
      childId: childId || activeProfileId,
      title,
      description,
      icon,
      costXP,
      isApprovedByParent: true,
      isClaimed: false,
    };
    setRewards((prev) => [...prev, newReward]);
  };

  const deleteReward = (rewardId: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== rewardId));
  };

  const createStudyPlan = (
    targetSurahId: number,
    targetSurahName: string,
    targetDate: string,
    dailyAyatCount: number
  ) => {
    const daysNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];
    const generatedDays = daysNames.map((d, idx) => {
      const isMurajaah = idx === 2 || idx === 6;
      return {
        dayName: d,
        dateStr: new Date(Date.now() + idx * 86400000).toISOString().split('T')[0],
        taskType: (isMurajaah ? 'murajaah' : 'hafalan_baru') as any,
        surahName: targetSurahName,
        surahId: targetSurahId,
        ayahRange: isMurajaah
          ? `Muraja'ah Ayat 1–${(idx + 1) * dailyAyatCount}`
          : `Hafalan Ayat ${idx * dailyAyatCount + 1}–${(idx + 1) * dailyAyatCount}`,
        completed: false,
      };
    });

    const newPlan: StudyPlan = {
      id: `plan_${Date.now()}`,
      childId: activeProfileId,
      targetSurahId,
      targetSurahName,
      targetDate,
      dailyAyatCount,
      days: generatedDays,
    };

    setStudyPlans((prev) => [newPlan, ...prev.filter((p) => p.childId !== activeProfileId)]);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateParentNotifications = (newNotifications: Partial<ParentNotificationSetting>) => {
    setParentNotifications((prev) => ({ ...prev, ...newNotifications }));
  };

  const getSurahProgressStats = (surahId: number, totalAyat: number) => {
    const relevant = ayahProgressList.filter((ap) => ap.childId === activeProfileId && ap.surahId === surahId);
    const memorized = relevant.filter((ap) => ap.status === 'memorized').length;
    const inProgress = relevant.filter((ap) => ap.status === 'in_progress' || ap.status === 'almost_memorized').length;
    const percentage = totalAyat > 0 ? Math.round((memorized / totalAyat) * 100) : 0;
    return { memorized, inProgress, percentage };
  };

  return (
    <KafaContext.Provider
      value={{
        role,
        setRole,
        profiles,
        activeProfile,
        activeProfileId,
        setActiveProfileId,
        ayahProgressList,
        setorAttempts,
        quests,
        badges,
        rewards,
        studyPlans,
        settings,
        parentNotifications,
        cloudSync,
        syncAllToCloud,
        restoreFromCloud,
        updateSettings,
        updateParentNotifications,
        switchProfile,
        addNewChild,
        updateAyahProgress,
        recordSetorAttempt,
        completeQuest,
        claimReward,
        approveReward,
        createReward,
        deleteReward,
        addXP,
        triggerCelebration,
        createStudyPlan,
        getAyahProgress,
        getSurahProgressStats,
      }}
    >
      {children}
    </KafaContext.Provider>
  );
};

export const useKafa = () => {
  const context = useContext(KafaContext);
  if (!context) {
    throw new Error('useKafa must be used within a KafaProvider');
  }
  return context;
};
