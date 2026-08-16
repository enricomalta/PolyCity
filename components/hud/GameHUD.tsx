"use client"

import { useMemo } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useGame } from "@/hooks/useGame"
import { ResourceBar } from "./ResourceBar"
import { BuildMenu } from "./BuildMenu"
import { ToolBar } from "./ToolBar"
import { TileInspector } from "./TileInspector"
import { GameToast } from "./GameToast"
import { TopBar } from "./TopBar"

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
    selectedTile,
    setTool,
    selectBuildingType,
    selectTile,
    demolish,
    rotateSelectedBuilding,
    lastMessage,
    clearMessage,
  } = useGame()

  const inspected = useMemo(() => {
    if (!selectedTile) return { tile: null, building: null }
    const tile = tiles[selectedTile.x]?.[selectedTile.z] ?? null
    const building =
      state?.buildings?.find((b) => b.x === selectedTile.x && b.z === selectedTile.z) ?? null
    return { tile, building }
  }, [selectedTile, tiles, state?.buildings])

  if (!state) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3 sm:p-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <ResourceBar state={state} />
        <TopBar cityName={city?.name ?? "PolyCity"} user={user} onLogout={logout} />
      </div>

      {/* Middle row: tools left, inspector right */}
      <div className="mt-3 flex flex-1 items-start justify-between gap-3">
        <div className="flex flex-col items-start gap-3">
          <ToolBar
            tool={tool}
            onSelect={() => {
              setTool("SELECT")
              selectBuildingType(null)
            }}
            onDemolish={() => {
              setTool("DEMOLISH")
              selectBuildingType(null)
            }}
          />
          <div className="pointer-events-none hidden rounded-lg bg-card/80 px-3 py-2 text-xs leading-relaxed text-muted-foreground shadow-sm backdrop-blur sm:block">
            <p className="font-medium text-foreground">Controles</p>
            <p>
              <span className="font-mono text-foreground">W A S D</span> mover câmera
            </p>
            <p>Arrastar: girar {"\u00b7"} Botão direito: deslocar</p>
            <p>Clique: construir / selecionar</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <GameToast message={lastMessage} onDismiss={clearMessage} />
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
            />
          )}
        </div>
      </div>

      {/* Bottom row: build menu */}
      <div className="mt-3 flex justify-center">
        <BuildMenu state={state} selected={selectedBuilding} onSelect={selectBuildingType} />
      </div>
    </div>
  )
}
