"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { AuthState, User } from "@/types/auth"
import { isFirebaseConfigured, signInWithGoogle, signOut, subscribeToAuth } from "@/lib/firebase/auth"

interface AuthContextValue extends AuthState {
  // Firebase is configured with real credentials.
  firebaseEnabled: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const GUEST_KEY = "polycity:guest"

// When Firebase is not configured we keep a local guest session so the whole
// flow (landing -> login -> game) stays testable. This is clearly separated
// from the real Firebase path and never touches game authorization, which is
// always the backend's job.
function loadGuest(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, error: null })

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const guest = loadGuest()
      setState({ status: guest ? "authenticated" : "unauthenticated", user: guest, error: null })
      return
    }
    const unsub = subscribeToAuth((user) => {
      setState({ status: user ? "authenticated" : "unauthenticated", user, error: null })
    })
    return unsub
  }, [])

  const loginWithGoogle = useCallback(async () => {
    setState((s) => ({ ...s, error: null }))
    try {
      if (!isFirebaseConfigured) {
        // demo/guest sign-in
        const guest: User = {
          id: "guest",
          email: "guest@polycity.local",
          displayName: "Prefeito Convidado",
          photoURL: null,
        }
        localStorage.setItem(GUEST_KEY, JSON.stringify(guest))
        setState({ status: "authenticated", user: guest, error: null })
        return
      }
      await signInWithGoogle()
      // state updates via subscribeToAuth
    } catch {
      setState((s) => ({ ...s, error: "Não foi possível entrar. Tente novamente." }))
    }
  }, [])

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured) {
      localStorage.removeItem(GUEST_KEY)
      setState({ status: "unauthenticated", user: null, error: null })
      return
    }
    await signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, firebaseEnabled: isFirebaseConfigured, loginWithGoogle, logout }),
    [state, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
