"use client"

import { useEffect } from "react"
import { Info } from "lucide-react"

interface GameToastProps {
  message: string | null
  onDismiss: () => void
}

// Lightweight ephemeral message surfaced from service responses (e.g. a
// rejected action). Auto-dismisses so it never blocks the HUD.
export function GameToast({ message, onDismiss }: GameToastProps) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDismiss, 3200)
    return () => clearTimeout(id)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-border bg-card/95 px-4 py-2.5 text-sm text-card-foreground shadow-lg shadow-black/30 backdrop-blur">
      <Info className="size-4 shrink-0 text-accent" aria-hidden />
      <span>{message}</span>
    </div>
  )
}
