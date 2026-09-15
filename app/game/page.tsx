"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { GameShell } from "@/components/game/GameShell"
import { CityCreationModal } from "@/components/game/CityCreationModal"
import { FullScreenLoader } from "@/components/ui/loader"
import { apiGameService } from "@/services/game/apiGameService"
import { ApiError } from "@/lib/api/client"

export default function GamePage() {
  const router = useRouter()
  const { status } = useAuth()
  const [checkingCity, setCheckingCity] = useState(true)
  const [needsCreation, setNeedsCreation] = useState(false)

  useEffect(() => {
    if (status !== "authenticated") return
    let active = true
    void apiGameService.getCity("me").then(() => {
      if (active) setCheckingCity(false)
    }).catch((error) => {
      if (!active) return
      if (error instanceof ApiError && error.status === 404) setNeedsCreation(true)
      else setNeedsCreation(true)
      setCheckingCity(false)
    })
    return () => { active = false }
  }, [status])

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  if (status === "loading" || (status === "authenticated" && checkingCity)) return <FullScreenLoader label="Preparando seu mandato..." />
  if (status !== "authenticated") return <FullScreenLoader label="Redirecionando..." />
  if (needsCreation) return <CityCreationModal onCreated={() => { setNeedsCreation(false); setCheckingCity(false) }} />
  return <GameShell />
}
