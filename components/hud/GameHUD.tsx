"use client"

import { useMemo, useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useGame, useGameClock, useSelection } from "@/hooks/useGame"
import { ResourceBar } from "./ResourceBar"
import { BuildMenu } from "./BuildMenu"
import { ToolBar } from "./ToolBar"
import { TileInspector } from "./TileInspector"
import { GameToast } from "./GameToast"
import { TopBar } from "./TopBar"
import {
  createGameClock,
  formatGameTime,
} from "@/lib/game/clock"

/**
 * All 2D overlay UI. It sits above the 3D canvas with pointer-events disabled
 * on the container so camera dragging still works between panels; each panel
 * re-enables pointer events for itself.
 */
export function GameHUD() {
  const { user, logout } = useAuth()
  const {
    city,
    state,
    tiles,
    tool,
    selectedBuilding,
    setTool,
    selectBuildingType,
    selectTile,
    demolish,
    rotateSelectedBuilding,
    // occupyHouse,
    vacateBuilding,
    closeBuilding,
    openBuilding,
    lastMessage,
    clearMessage,
  } = useGame()

  // selectedTile vem do SelectionContext (muda a cada clique de tile). O
  // GameHUD é DOM 2D fora do Canvas, então re-renderizar aqui é barato e é
  // exatamente o que faz o TileInspector abrir/fechar.
  const { selectedTile } = useSelection()

  const [clockNow, setClockNow] =
    useState(() => Date.now())

  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        setClockNow(Date.now())
      }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const gameClock = useMemo(() => {
    if (
      !city ||
      !Number.isFinite(
        city.clockStartedAt,
      )
    ) {
      return null
    }

    return createGameClock(
      city.clockStartedAt,
      clockNow,
    )
  }, [
    city?.clockStartedAt,
    clockNow,
  ])


  const inspected = useMemo(() => {
    if (!selectedTile) return { tile: null, building: null }
    const tile = tiles[selectedTile.x]?.[selectedTile.z] ?? null
    const building =
      state?.buildings?.find((b) => b.x === selectedTile.x && b.z === selectedTile.z) ?? null
    return { tile, building }
  }, [selectedTile, tiles, state?.buildings])

  if (!state) return null

  const showBuildMenu =
    tool === "BUILD_MENU" ||
    tool === "BUILD" ||
    tool === "ROAD"

  const showEditMenu =
    tool === "EDIT"

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3 sm:p-4">

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <ResourceBar state={state} />
        {gameClock && (
          <div className="pointer-events-auto hidden rounded-2xl border border-border bg-card/90 px-4 py-2 shadow-lg shadow-black/20 backdrop-blur sm:block">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Dia {gameClock.day}
                </p>

                <p className="font-mono text-lg font-bold tabular-nums text-card-foreground">
                  {formatGameTime(gameClock)}
                </p>
              </div>

              <div className="h-8 w-px bg-border" />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </p>

                <p className="text-sm font-semibold text-card-foreground">
                  {gameClock.stage === "DAY"
                    ? "Dia"
                    : "Noite"}
                </p>
              </div>
            </div>
          </div>
        )}
        <TopBar
          cityName={city?.name ?? "PolyCity"}
          user={user}
          onLogout={logout}
        />
      </div>

      {/* Middle row */}
      <div className="mt-3 flex flex-1 items-start justify-between gap-3">

        {/* Left side */}
        <div className="flex flex-col items-start gap-3">

          <ToolBar
            tool={tool}
            selectedBuilding={selectedBuilding}
            onSelect={() => {
              setTool("SELECT")
              selectBuildingType(null)
            }}

            onDemolish={() => {
              setTool("DEMOLISH")
              selectBuildingType(null)
            }}

            onBuild={() => {
              setTool("BUILD_MENU")
            }}

            onEdit={() => {
              setTool("EDIT")
              selectBuildingType(null)
            }}
          />

          <div className="pointer-events-none hidden rounded-lg bg-card/80 px-3 py-2 text-xs leading-relaxed text-muted-foreground shadow-sm backdrop-blur sm:block">
            <p className="font-medium text-foreground">Controles</p>
            <p>
              <span className="font-mono text-foreground">W A S D</span> mover câmera
            </p>
            <p>
              <span className="font-mono text-foreground">R</span> rotaciona
            </p>
            <p>
              <span className="font-mono text-foreground">Arrastar:</span> girar
            </p>
            <p>
              <span className="font-mono text-foreground">Botão direito:</span> deslocar
            </p>
            <p>
              <span className="font-mono text-foreground">Clique:</span> construir / selecionar
            </p>
          </div>
        </div>


        {/* Right side */}
        <div className="flex flex-col items-end gap-3">

          <GameToast
            message={lastMessage}
            onDismiss={clearMessage}
          />

          {selectedTile && (
            <TileInspector
              tile={inspected.tile}
              building={inspected.building}
              onClose={() => selectTile(null)}

              onDemolish={(x, z) => {
                void demolish(x, z)
                selectTile(null)
              }}

              onRotate={(
                x,
                z,
                rotation,
              ) => {
                void rotateSelectedBuilding(
                  x,
                  z,
                  rotation,
                )
              }}
              onVacate={vacateBuilding}
              onCloseBuilding={closeBuilding}
              onOpenBuilding={openBuilding}
            />
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-3 flex justify-center">

        {showBuildMenu && (
          <BuildMenu
            state={state}
            selected={selectedBuilding}
            onSelect={selectBuildingType}
          />
        )}

        {showEditMenu && (
          <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-border bg-card/90 p-3 shadow-lg shadow-black/30 backdrop-blur">

            <div className="mb-3">
              <p className="text-sm font-semibold text-card-foreground">
                Edição do mapa
              </p>

              <p className="text-xs text-muted-foreground">
                Selecione o tipo de terreno.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">

              <button
                type="button"
                className="rounded-xl border border-border bg-secondary/60 p-3 text-sm font-medium text-card-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
              >
                Areia
              </button>

              <button
                type="button"
                className="rounded-xl border border-border bg-secondary/60 p-3 text-sm font-medium text-card-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
              >
                Grama
              </button>

              <button
                type="button"
                className="rounded-xl border border-border bg-secondary/60 p-3 text-sm font-medium text-card-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
              >
                Água
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}