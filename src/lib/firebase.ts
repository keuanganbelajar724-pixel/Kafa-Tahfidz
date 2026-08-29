import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';

export interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

const firebaseConfig = firebaseConfigRaw as FirebaseConfig;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isInitialized = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  
  // Connect to custom or default database ID
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }

  isInitialized = true;
  console.log('✅ Firebase initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
}

export { app, auth, db, isInitialized, firebaseConfig };

// Real-time Anonymous Auth helper to ensure stable user ID
export const ensureFirebaseAuth = async (): Promise<User | null> => {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;

  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous auth note (proceeding in public mode):', err);
    return null;
  }
};
