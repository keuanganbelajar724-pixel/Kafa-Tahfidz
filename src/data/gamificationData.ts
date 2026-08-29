import { AchievementBadge, DailyQuest, RewardItem } from '../types';

export interface LevelInfo {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  icon: string;
  color: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: "Pemula", minXp: 0, maxXp: 100, icon: "🌱", color: "from-emerald-400 to-teal-500" },
  { level: 2, name: "Pencinta Qur'an", minXp: 100, maxXp: 250, icon: "⭐", color: "from-teal-400 to-emerald-600" },
  { level: 3, name: "Pejuang Hafalan", minXp: 250, maxXp: 500, icon: "🏹", color: "from-amber-400 to-orange-500" },
  { level: 4, name: "Rajin Muraja'ah", minXp: 500, maxXp: 900, icon: "🛡️", color: "from-blue-400 to-indigo-500" },
  { level: 5, name: "Sahabat Qur'an", minXp: 900, maxXp: 1500, icon: "👑", color: "from-purple-400 to-pink-500" },
  { level: 6, name: "Penjaga Hafalan", minXp: 1500, maxXp: 3000, icon: "🌟", color: "from-amber-300 via-yellow-500 to-amber-600" },
];

export function getLevelForXp(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export const INITIAL_BADGES: AchievementBadge[] = [
  {
    id: "badge_first_ayah",
    title: "Hafalan Pertama",
    description: "Berhasil menyetorkan hafalan ayat pertama dengan baik.",
    icon: "🌟",
    category: "hafalan",
    unlocked: true,
    unlockedAt: "2026-08-20",
    progressPercent: 100,
  },
  {
    id: "badge_streak_7",
    title: "7 Hari Berturut-turut",
    description: "Belajar Al-Qur'an istiqomah selama 7 hari tanpa terputus.",
    icon: "🔥",
    category: "streak",
    unlocked: true,
    unlockedAt: "2026-08-25",
    progressPercent: 100,
  },
  {
    id: "badge_10_surah",
    title: "10 Surat Selesai",
    description: "Menyelesaikan hafalan 10 surat dalam Juz Amma.",
    icon: "📚",
    category: "hafalan",
    unlocked: false,
    progressPercent: 60,
  },
  {
    id: "badge_100_ayah",
    title: "100 Ayat Dikuasai",
    description: "Menghafal total 100 ayat Al-Qur'an dengan lancar.",
    icon: "💎",
    category: "hafalan",
    unlocked: false,
    progressPercent: 42,
  },
  {
    id: "badge_murajaah_master",
    title: "Rajin Muraja'ah",
    description: "Melakukan 30 sesi muraja'ah pengulangan hafalan.",
    icon: "🔁",
    category: "murajaah",
    unlocked: true,
    unlockedAt: "2026-08-24",
    progressPercent: 100,
  },
  {
    id: "badge_weekly_goal",
    title: "Target Mingguan Tercapai",
    description: "Menuntaskan seluruh target hafalan mingguan yang dibuat orang tua.",
    icon: "🎯",
    category: "special",
    unlocked: true,
    unlockedAt: "2026-08-23",
    progressPercent: 100,
  },
  {
    id: "badge_consistent",
    title: "Hafalan Konsisten",
    description: "Mempertahankan skor setoran rata-rata di atas 85.",
    icon: "✨",
    category: "hafalan",
    unlocked: true,
    unlockedAt: "2026-08-26",
    progressPercent: 100,
  },
  {
    id: "badge_30_days",
    title: "30 Hari Belajar",
    description: "Mencapai total 30 hari aktif belajar Al-Qur'an.",
    icon: "🏆",
    category: "streak",
    unlocked: false,
    progressPercent: 46,
  },
];

export const INITIAL_QUESTS: DailyQuest[] = [
  {
    id: "quest_1",
    title: "Hafalkan 2 Ayat Hari Ini",
    description: "Pelajari dan hafalkan 2 ayat pada surat target.",
    icon: "📖",
    xpReward: 30,
    targetCount: 2,
    currentCount: 1,
    isCompleted: false,
    type: "memorize",
  },
  {
    id: "quest_2",
    title: "Muraja'ah 5 Ayat",
    description: "Ulangi 5 ayat yang sudah pernah dihafal sebelumnya.",
    icon: "🔁",
    xpReward: 25,
    targetCount: 5,
    currentCount: 5,
    isCompleted: true,
    type: "murajaah",
  },
  {
    id: "quest_3",
    title: "Setor Hafalan 1x",
    description: "Rekam dan setorkan bacaan ayat ke Kak Kafa.",
    icon: "🎙️",
    xpReward: 20,
    targetCount: 1,
    currentCount: 1,
    isCompleted: true,
    type: "setor",
  },
  {
    id: "quest_4",
    title: "Dengarkan Murottal 1 Surat",
    description: "Simak bacaan merdu dari qari pilihan.",
    icon: "🎧",
    xpReward: 15,
    targetCount: 1,
    currentCount: 0,
    isCompleted: false,
    type: "listen",
  },
  {
    id: "quest_5",
    title: "Main Game Susun Ayat",
    description: "Selesaikan 1 ronde tantangan menyusun kata Al-Qur'an.",
    icon: "🧩",
    xpReward: 15,
    targetCount: 1,
    currentCount: 1,
    isCompleted: true,
    type: "game",
  },
];

export const INITIAL_REWARDS: RewardItem[] = [
  {
    id: "rew_1",
    childId: "child_1",
    title: "Pilih Cerita Sebelum Tidur",
    description: "Bebas memilih cerita nabi atau kisah teladan favorit sebelum tidur.",
    icon: "🌙",
    costXP: 50,
    isApprovedByParent: true,
    isClaimed: false,
  },
  {
    id: "rew_2",
    childId: "child_1",
    title: "Pilih Menu Makan Kesukaan",
    description: "Menentukan menu makanan favorit untuk makan bersama keluarga.",
    icon: "🍲",
    costXP: 100,
    isApprovedByParent: true,
    isClaimed: false,
  },
  {
    id: "rew_3",
    childId: "child_1",
    title: "Waktu Bermain Tambahan 30 Menit",
    description: "Bonus waktu bermain game edukatif atau aktivitas luar ruangan.",
    icon: "⚽",
    costXP: 150,
    isApprovedByParent: true,
    isClaimed: false,
  },
  {
    id: "rew_4",
    childId: "child_1",
    title: "Pilih Aktivitas Jalan Santai Keluarga",
    description: "Memilih taman atau tempat rekreasi keluarga di akhir pekan.",
    icon: "🎡",
    costXP: 250,
    isApprovedByParent: false,
    isClaimed: false,
  },
];
