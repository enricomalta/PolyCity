import "server-only"
import { type App, cert, getApp, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// Server-side Firebase. Uses the service-account credentials, which must NEVER
// be exposed to the browser. Everything the game trusts (identity + data)
// flows through here.

function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // The private key is stored with escaped newlines in the env var.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!projectId || !clientEmail || !privateKey) return null
  return { projectId, clientEmail, privateKey }
}

let cachedApp: App | null = null

export function getAdminApp(): App {
  if (cachedApp) return cachedApp
  if (getApps().length) {
    cachedApp = getApp()
    return cachedApp
  }
  const sa = getServiceAccount()
  if (!sa) {
    throw new Error(
      "Firebase Admin não está configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.",
    )
  }
  cachedApp = initializeApp({ credential: cert(sa) })
  return cachedApp
}

export function adminAuth() {
  return getAuth(getAdminApp())
}

export function adminDb() {
  return getFirestore(getAdminApp())
}

// Verify a Firebase ID token coming from the Authorization: Bearer header and
// return the decoded identity. Throws when the token is missing or invalid.
export async function verifyBearer(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthenticatedError()
  }
  const token = authHeader.slice("Bearer ".length).trim()
  try {
    return await adminAuth().verifyIdToken(token)
  } catch {
    throw new UnauthenticatedError()
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Sua sessão expirou.")
    this.name = "UnauthenticatedError"
  }
}
