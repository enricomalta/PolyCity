"use client"

import dynamic from "next/dynamic"
import { GameProvider, useGame } from "@/hooks/useGame"
import { GameHUD } from "@/components/hud/GameHUD"
import { FullScreenLoader } from "@/components/ui/loader"

// The 3D canvas is client-only and heavy, so we load it lazily and keep it
// out of the server bundle entirely.
const CityScene = dynamic(
  () => import("@/components/game/CityScene").then((m) => m.CityScene),
  { ssr: false, loading: () => <FullScreenLoader label="Renderizando a cidade..." /> },
)

function GameStage() {
  const { status } = useGame()

  return (
    <div className="relative h-svh w-full overflow-hidden bg-background">
      {status === "loading" && <FullscreenLoader label="Carregando sua cidade..." />}
      {status === "error" && (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p className="text-muted-foreground">
            Não foi possível carregar a cidade. Recarregue a página para tentar novamente.
          </p>
        </div>
      )}
      {status === "ready" && (
        <>
          <CityScene />
          <GameHUD />
        </>
      )}
    </div>
  )
}

export function GameShell() {
  return (
    <GameProvider>
      <GameStage />
    </GameProvider>
  )
}
