// Identity model. The frontend only knows *who* the user is via Firebase.
// All authorization of game actions happens on the backend.

export interface User {
  id: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export interface AuthState {
  status: AuthStatus
  user: User | null
  error: string | null
}
