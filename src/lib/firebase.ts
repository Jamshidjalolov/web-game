import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCi6ie_HNT357VrkWiGk7cxyVPxwAJxBUI',
  authDomain: 'web-app-1001b.firebaseapp.com',
  projectId: 'web-app-1001b',
  storageBucket: 'web-app-1001b.firebasestorage.app',
  messagingSenderId: '189429271711',
  appId: '1:189429271711:web:ed5af9202e5454429a26aa',
}

const normalizeEnvValue = (value: string | undefined) => value?.trim() || ''

const envFirebaseConfig = {
  apiKey: normalizeEnvValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: normalizeEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: normalizeEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalizeEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: normalizeEnvValue(import.meta.env.VITE_FIREBASE_APP_ID),
}

const hasCompleteEnvFirebaseConfig = Object.values(envFirebaseConfig).every(Boolean)

const firebaseConfig = hasCompleteEnvFirebaseConfig ? envFirebaseConfig : DEFAULT_FIREBASE_CONFIG

const requiredFirebaseKeys = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
]

export const isFirebaseConfigured = requiredFirebaseKeys.every((item) => Boolean(item))

const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
export const googleProvider = new GoogleAuthProvider()
export const activeFirebaseProjectId = firebaseConfig.projectId
export const activeFirebaseAuthDomain = firebaseConfig.authDomain
