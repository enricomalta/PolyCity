import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app"

// Public Firebase web config. These NEXT_PUBLIC_* values are safe to expose
// to the browser — they identify the project, they are not secrets. The
// Firebase Admin SDK / service-account credentials must NEVER live here.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Whether the project has real Firebase credentials configured. When false,
// the app falls back to a local guest session so it stays fully playable.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
)

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}
