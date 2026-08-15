"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { GameShell } from "@/components/game/GameShell"
import { FullScreenLoader } from "@/components/ui/loader"

/**
 * Auth-gated entry point for the game. Identity is enforced here on the client
 * for UX only — the backend remains the sole authority for every game action.
 */
export default function GamePage() {
  const router = useRouter()
  const { status } = useAuth()

  // Bounce guests back to the login screen once we know they are signed out.
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  if (status === "loading") return <FullScreenLoader label="Verificando sua sessão..." />
  if (status !== "authenticated") return <FullScreenLoader label="Redirecionando..." />

  return <GameShell />
}
