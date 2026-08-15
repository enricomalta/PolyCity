import {
  GoogleAuthProvider,
  type User as FirebaseUser,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from "firebase/auth"
import type { User } from "@/types/auth"
import { getFirebaseApp, isFirebaseConfigured } from "./config"

function toUser(fb: FirebaseUser): User {
  return {
    id: fb.uid,
    email: fb.email,
    displayName: fb.displayName,
    photoURL: fb.photoURL,
  }
}

// Subscribe to auth changes. Returns an unsubscribe function.
export function subscribeToAuth(cb: (user: User | null) => void): () => void {
  const app = getFirebaseApp()
  if (!app) {
    cb(null)
    return () => {}
  }
  const auth = getAuth(app)
  return onAuthStateChanged(auth, (fb) => cb(fb ? toUser(fb) : null))
}

export async function signInWithGoogle(): Promise<User> {
  const app = getFirebaseApp()
  if (!app) throw new Error("Firebase não está configurado.")
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return toUser(result.user)
}

export async function signOut(): Promise<void> {
  const app = getFirebaseApp()
  if (!app) return
  await fbSignOut(getAuth(app))
}

// Retrieve a fresh Firebase ID token to send to the backend as a Bearer
// token. Returns null when Firebase is not configured (guest mode).
export async function getIdToken(): Promise<string | null> {
  const app = getFirebaseApp()
  if (!app) return null
  const auth = getAuth(app)
  const current = auth.currentUser
  if (!current) return null
  return current.getIdToken()
}

export { isFirebaseConfigured }
