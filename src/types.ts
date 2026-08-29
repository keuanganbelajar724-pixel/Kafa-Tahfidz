export type AppRole = 'child' | 'parent' | 'admin';

export type MemorizationStatus = 
  | 'not_started'     // Belum dipelajari 🔴
  | 'in_progress'     // Sedang dipelajari 🟡
  | 'almost_memorized'// Hampir hafal 🟠
  | 'memorized'       // Sudah hafal 🟢
  | 'needs_murajaah'; // Perlu muraja'ah 🔵

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  grade: string;
  currentJuz: number;
  currentSurahId: number;
  targetDailyAyat: number;
  xp: number;
  level: number;
  levelName: string;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  historyDates: string[]; // List of YYYY-MM-DD when child studied
  murajaahDates: string[]; // List of YYYY-MM-DD when child did muraja'ah
}

export interface Ayah {
  id: number;
  surahId: number;
  ayahNumber: number;
  textArabic: string;
  textLatin: string;
  translationId: string;
  audioUrl: string;
}

export interface Surah {
  id: number;
  nameId: string;
  nameLatin?: string;
  nameArabic: string;
  translationName: string;
  meaningId?: string;
  totalAyat: number;
  revelationType: 'Makkiyah' | 'Madaniyah';
  juzNumber: number;
  description: string;
  ayat: Ayah[];
}

export interface AyahProgress {
  childId: string;
  surahId: number;
  ayahNumber: number;
  status: MemorizationStatus;
  score: number; // 0 - 100
  fluencyScore: number;
  lastReviewedDate: string;
  nextReviewDate: string;
  attemptCount: number;
}

export interface RecitationEvaluationResult {
  score: number;
  accuracy: number;
  fluency: number;
  tajweedRating?: string;
  feedback: string;
  detailedTip: string;
  missedWords: string[];
  mistakesCount: number;
  recognizedTranscript?: string;
}

export interface SetorAttempt {
  id: string;
  childId: string;
  surahId: number;
  surahName: string;
  ayahNumber: number;
  ayahText: string;
  score: number;
  accuracy: number;
  fluency: number;
  mistakesCount: number;
  missedWords: string[];
  feedback: string;
  detailedTip?: string;
  recordedAudioUrl?: string;
  timestamp: string; // ISO string
  isAiEvaluated: boolean;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  type: 'memorize' | 'murajaah' | 'setor' | 'listen' | 'game';
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'hafalan' | 'murajaah' | 'special';
  unlocked: boolean;
  unlockedAt?: string;
  progressPercent: number;
}

export interface RewardItem {
  id: string;
  childId: string;
  title: string;
  description: string;
  icon: string;
  costXP: number;
  isApprovedByParent: boolean;
  isClaimed: boolean;
  claimedAt?: string;
}

export interface StudyPlanDay {
  dayName: string;
  dateStr: string;
  taskType: 'hafalan_baru' | 'murajaah' | 'evaluasi';
  surahName: string;
  surahId: number;
  ayahRange: string;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  childId: string;
  targetSurahId: number;
  targetSurahName: string;
  targetDate: string;
  dailyAyatCount: number;
  days: StudyPlanDay[];
}

export interface ParentNotificationSetting {
  enabled: boolean;
  dailyReminderTime: string; // "16:00"
  streakAlerts: boolean;
  weeklyReportAlerts: boolean;
  setoranAlerts: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'sepia' | 'midnight' | 'system';
  ramadanMode: boolean;
  fontSizeArabic: 'normal' | 'large' | 'huge';
  defaultReciter: string; // 'Mishary Rashid Alafasy' | 'Mahmoud Khalil Al-Husary' | 'Abdul Rahman Al-Sudais' | 'Saad Al-Ghamdi' | 'Muhammad Siddiq Al-Minshawi'
  autoPlayNextAyah: boolean;
  keepAudioRecordings: boolean;
  tajweedColors?: boolean;
  mushafViewMode?: 'card' | 'page';
}

export interface JuzInfo {
  juzNumber: number;
  name: string;
  arabicName: string;
  startSurahId: number;
  startSurahName: string;
  startAyah: number;
  endSurahId: number;
  endSurahName: string;
  endAyah: number;
  totalAyat: number;
  totalSurahs?: number;
}

export interface SurahCatalogItem {
  id: number;
  nameId: string;
  nameLatin: string;
  nameArabic: string;
  meaningId: string;
  totalAyat: number;
  revelationType: 'Makkiyah' | 'Madaniyah';
  juzNumber: number;
  juzList: number[];
}

