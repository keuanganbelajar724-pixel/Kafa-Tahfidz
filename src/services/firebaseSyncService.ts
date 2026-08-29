import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  getDoc,
  Unsubscribe
} from 'firebase/firestore';
import { db, isInitialized, ensureFirebaseAuth } from '../lib/firebase';
import {
  ChildProfile,
  AyahProgress,
  SetorAttempt,
  DailyQuest,
  AchievementBadge,
  RewardItem,
  StudyPlan,
  AppSettings,
  ParentNotificationSetting
} from '../types';

export interface CloudSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
}

// Single root collection names
const COLLECTIONS = {
  PROFILES: 'profiles',
  AYAH_PROGRESS: 'ayah_progress',
  SETOR_ATTEMPTS: 'setor_attempts',
  QUESTS: 'quests',
  BADGES: 'badges',
  REWARDS: 'rewards',
  STUDY_PLANS: 'study_plans',
  APP_SETTINGS: 'app_settings',
};

/**
 * Save all Child Profiles to Firestore
 */
export async function syncProfilesToCloud(profiles: ChildProfile[]): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    profiles.forEach((p) => {
      const docRef = doc(db, COLLECTIONS.PROFILES, p.id);
      batch.set(docRef, p, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error syncing profiles to Firestore:', err);
    return false;
  }
}

/**
 * Save Ayah Progress items to Firestore
 */
export async function syncAyahProgressToCloud(progressList: AyahProgress[]): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    // Group or limit batch size to 400
    const items = progressList.slice(0, 400);
    items.forEach((item) => {
      const key = `${item.childId}_${item.surahId}_${item.ayahNumber}`;
      const docRef = doc(db, COLLECTIONS.AYAH_PROGRESS, key);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error syncing ayah progress to Firestore:', err);
    return false;
  }
}

/**
 * Save single Setor Attempt to Firestore
 */
export async function syncSetorAttemptToCloud(attempt: SetorAttempt): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, COLLECTIONS.SETOR_ATTEMPTS, attempt.id);
    await setDoc(docRef, attempt, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving setor attempt to Firestore:', err);
    return false;
  }
}

/**
 * Save all Setor Attempts batch
 */
export async function syncSetorAttemptsListToCloud(attempts: SetorAttempt[]): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    attempts.slice(0, 400).forEach((att) => {
      const docRef = doc(db, COLLECTIONS.SETOR_ATTEMPTS, att.id);
      batch.set(docRef, att, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error syncing setor attempts batch:', err);
    return false;
  }
}

/**
 * Save Quests
 */
export async function syncQuestsToCloud(quests: DailyQuest[]): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    quests.forEach((q) => {
      const docRef = doc(db, COLLECTIONS.QUESTS, q.id);
      batch.set(docRef, q, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error syncing quests:', err);
    return false;
  }
}

/**
 * Save Badges
 */
export async function syncBadgesToCloud(badges: AchievementBadge[]): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    badges.forEach((b) => {
      const docRef = doc(db, COLLECTIONS.BADGES, b.id);
      batch.set(docRef, b, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error syncing badges:', err);
    return false;
  }
}

/**
 * Save Rewards
 */
export async function syncRewardsToCloud(rewards: RewardItem[]): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    rewards.forEach((r) => {
      const docRef = doc(db, COLLECTIONS.REWARDS, r.id);
      batch.set(docRef, r, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error syncing rewards:', err);
    return false;
  }
}

/**
 * Save Study Plans
 */
export async function syncStudyPlansToCloud(plans: StudyPlan[]): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    plans.forEach((p) => {
      const docRef = doc(db, COLLECTIONS.STUDY_PLANS, p.id);
      batch.set(docRef, p, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error syncing study plans:', err);
    return false;
  }
}

/**
 * Save Settings
 */
export async function syncSettingsToCloud(
  settings: AppSettings, 
  parentNotifs: ParentNotificationSetting
): Promise<boolean> {
  if (!isInitialized || !db) return false;
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'global_config');
    await setDoc(docRef, { settings, parentNotifs, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing settings:', err);
    return false;
  }
}

/**
 * Load Initial Data from Firestore
 */
export async function fetchAllDataFromCloud() {
  if (!isInitialized || !db) return null;

  try {
    await ensureFirebaseAuth();

    const [
      profilesSnap,
      progressSnap,
      attemptsSnap,
      questsSnap,
      badgesSnap,
      rewardsSnap,
      plansSnap,
      settingsSnap
    ] = await Promise.allSettled([
      getDocs(collection(db, COLLECTIONS.PROFILES)),
      getDocs(collection(db, COLLECTIONS.AYAH_PROGRESS)),
      getDocs(collection(db, COLLECTIONS.SETOR_ATTEMPTS)),
      getDocs(collection(db, COLLECTIONS.QUESTS)),
      getDocs(collection(db, COLLECTIONS.BADGES)),
      getDocs(collection(db, COLLECTIONS.REWARDS)),
      getDocs(collection(db, COLLECTIONS.STUDY_PLANS)),
      getDoc(doc(db, COLLECTIONS.APP_SETTINGS, 'global_config')),
    ]);

    const result: {
      profiles?: ChildProfile[];
      ayahProgress?: AyahProgress[];
      setorAttempts?: SetorAttempt[];
      quests?: DailyQuest[];
      badges?: AchievementBadge[];
      rewards?: RewardItem[];
      studyPlans?: StudyPlan[];
      settings?: AppSettings;
      parentNotifs?: ParentNotificationSetting;
    } = {};

    if (profilesSnap.status === 'fulfilled' && !profilesSnap.value.empty) {
      result.profiles = profilesSnap.value.docs.map((d) => d.data() as ChildProfile);
    }
    if (progressSnap.status === 'fulfilled' && !progressSnap.value.empty) {
      result.ayahProgress = progressSnap.value.docs.map((d) => d.data() as AyahProgress);
    }
    if (attemptsSnap.status === 'fulfilled' && !attemptsSnap.value.empty) {
      result.setorAttempts = attemptsSnap.value.docs.map((d) => d.data() as SetorAttempt);
    }
    if (questsSnap.status === 'fulfilled' && !questsSnap.value.empty) {
      result.quests = questsSnap.value.docs.map((d) => d.data() as DailyQuest);
    }
    if (badgesSnap.status === 'fulfilled' && !badgesSnap.value.empty) {
      result.badges = badgesSnap.value.docs.map((d) => d.data() as AchievementBadge);
    }
    if (rewardsSnap.status === 'fulfilled' && !rewardsSnap.value.empty) {
      result.rewards = rewardsSnap.value.docs.map((d) => d.data() as RewardItem);
    }
    if (plansSnap.status === 'fulfilled' && !plansSnap.value.empty) {
      result.studyPlans = plansSnap.value.docs.map((d) => d.data() as StudyPlan);
    }
    if (settingsSnap.status === 'fulfilled' && settingsSnap.value.exists()) {
      const data = settingsSnap.value.data();
      if (data.settings) result.settings = data.settings;
      if (data.parentNotifs) result.parentNotifs = data.parentNotifs;
    }

    return result;
  } catch (err) {
    console.error('Error fetching initial data from Firestore:', err);
    return null;
  }
}

/**
 * Subscribe to real-time updates for profiles
 */
export function subscribeToProfiles(onUpdate: (profiles: ChildProfile[]) => void): Unsubscribe | null {
  if (!isInitialized || !db) return null;
  try {
    return onSnapshot(collection(db, COLLECTIONS.PROFILES), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => d.data() as ChildProfile);
        onUpdate(list);
      }
    }, (error) => {
      console.warn('Profiles snapshot listener note:', error);
    });
  } catch {
    return null;
  }
}
