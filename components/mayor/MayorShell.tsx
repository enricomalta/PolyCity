"use client"

import { GameProvider } from "@/hooks/useGame"
import { MayorPanel } from "./MayorPanel"

/**
 * Wraps the mayor's office in the same GameProvider the game uses, so it reads
 * and writes the exact same authoritative city state (treasury, policy,
 * buildings). Saving a policy here is reflected immediately back in the game.
 */
export function MayorShell() {
  return (
    <GameProvider>
      <MayorPanel />
    </GameProvider>
  )
}
