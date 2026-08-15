"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { MayorShell } from "@/components/mayor/MayorShell"
import { FullScreenLoader } from "@/components/ui/loader"

/**
 * Auth-gated mayor's office. Like the game page, identity is enforced on the
 * client for UX only — the backend is the sole authority for policy changes.
 */
export default function MayorPage() {
  const router = useRouter()
  const { status } = useAuth()

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  if (status === "loading") return <FullScreenLoader label="Verificando sua sessão..." />
  if (status !== "authenticated") return <FullScreenLoader label="Redirecionando..." />

  return <MayorShell />
}
