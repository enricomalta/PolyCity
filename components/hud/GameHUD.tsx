"use client"

import { useMemo, useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useGame, useSelection } from "@/hooks/useGame"
import { ResourceBar } from "./ResourceBar"
import { BuildMenu } from "./BuildMenu"
import { ToolBar } from "./ToolBar"
import { TileInspector } from "./TileInspector"
import { GameToast } from "./GameToast"
import { TopBar } from "./TopBar"
import { MayorPanel } from "@/components/mayor/MayorPanel"
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
    moveBuilding,
    vacateBuilding,
    closeBuilding,
    openBuilding,
    demarcateRegion,
    lastMessage,
    clearMessage,
  } = useGame()

  // selectedTile vem do SelectionContext (muda a cada clique de tile). O
  // GameHUD é DOM 2D fora do Canvas, então re-renderizar aqui é barato e é
  // exatamente o que faz o TileInspector abrir/fechar.
  const { selectedTile } = useSelection()

  const [clockNow, setClockNow] =
    useState(() => Date.now())
  const [mayorOpen, setMayorOpen] = useState(false)
  const [zoneType, setZoneType] = useState<"RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "MIXED">("RESIDENTIAL")
  const [zoneClass, setZoneClass] = useState<"LOW" | "MIDDLE" | "HIGH">("MIDDLE")
  const [zoneName, setZoneName] = useState("")
  const [heatMetric, setHeatMetric] = useState<"happiness" | "employment" | "services" | "roads">("happiness")
  const [zoningTiles, setZoningTiles] = useState<Array<{ x: number; z: number }>>([])
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null)

  useEffect(() => {
    const handleRange = (event: Event) => setZoningTiles((event as CustomEvent<{ tiles: Array<{ x: number; z: number }> }>).detail.tiles)
    window.addEventListener("polycity:zoning-range", handleRange)
    return () => window.removeEventListener("polycity:zoning-range", handleRange)
  }, [])

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

  const showTerrainEditMenu =
    tool === "TERRAIN_EDIT"

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
            selectedBuilding={
              selectedBuilding
            }
            onSelect={() => {
              setTool("SELECT")
              selectBuildingType(null)
            }}
            onBuild={() => {
              setTool("BUILD_MENU")
            }}
            onTerrainEdit={() => {
              setTool("TERRAIN_EDIT")
              selectBuildingType(null)
            }}
            onZoning={() => {
              setTool("ZONING")
              selectBuildingType(null)
            }}
            onEdit={() => {
              setTool("EDIT")
              selectBuildingType(null)
            }}
            onDemolish={() => {
              setTool("DEMOLISH")
              selectBuildingType(null)
            }}
            onGovernance={() => {
              setTool("GOVERNANCE")
              selectBuildingType(null)
              setMayorOpen(true)
            }}
            onHeatmap={() => {
              setTool("HEATMAP")
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

          {selectedTile && tool !== "ZONING" && tool !== "HEATMAP" && (
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

        {tool === "HEATMAP" && (
          <div className="pointer-events-auto fixed bottom-4 left-1/2 z-20 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-border bg-card/95 p-4 shadow-lg shadow-black/30 backdrop-blur">
            <p className="text-sm font-semibold text-card-foreground">Mapa de calor urbano</p>
            <p className="mt-1 text-xs text-muted-foreground">Selecione um indicador para colorir os tiles da cidade.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{([['happiness','Felicidade'],['employment','Empregos'],['services','Serviços'],['roads','Estradas']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => { setHeatMetric(value); window.dispatchEvent(new CustomEvent("polycity:heatmap", { detail: value })) }} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${heatMetric === value ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground"}`}>{label}</button>)}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3"><div className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">Áreas com maior felicidade: proximidade de parques e serviços</div><div className="rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">Áreas com maior emprego: comércio e indústria ativos</div><div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">Alertas: regiões sem conexão viária ou serviços</div></div>
          </div>
        )}

        {tool === "ZONING" && (
          <div className="pointer-events-auto fixed bottom-4 left-1/2 z-30 max-h-[min(68vh,520px)] w-[min(92vw,560px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-border bg-card/95 p-4 shadow-lg shadow-black/30 backdrop-blur">
            <p className="text-sm font-semibold text-card-foreground">Demarcar região</p>
            <p className="mt-1 text-xs text-muted-foreground">Clique nos tiles do mapa para selecionar uma área. Escolha o uso e a classe predominante antes de nomear o bairro.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{([['RESIDENTIAL','Residencial'],['COMMERCIAL','Comercial'],['INDUSTRIAL','Industrial'],['MIXED','Mista']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setZoneType(value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${zoneType === value ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground"}`}>{label}</button>)}</div>
            <div className="mt-3 grid grid-cols-3 gap-2">{([['LOW','Baixa'],['MIDDLE','Média'],['HIGH','Alta']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setZoneClass(value)} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${zoneClass === value ? "border-accent bg-accent/15 text-accent" : "border-border bg-secondary text-muted-foreground"}`}>{label}</button>)}</div>
            <div className="mt-3 flex flex-col gap-2">{(state.regions ?? []).map((region) => <button key={region.id} type="button" onClick={() => { setEditingRegionId(region.id); setZoneName(region.name); setZoneType(region.zone as typeof zoneType); setZoneClass(region.citizenClass ?? "MIDDLE"); setZoningTiles(region.tiles) }} className={`rounded-xl border px-3 py-2 text-left text-xs ${editingRegionId === region.id ? "border-primary bg-primary/10" : "border-border bg-secondary/60"}`}><span className="font-semibold text-foreground">{region.name}</span><span className="ml-2 text-muted-foreground">{region.tiles.length} tiles · {region.zone}</span></button>)}</div>
            <input value={zoneName} onChange={(event) => setZoneName(event.target.value)} placeholder="Nome do bairro ou zona" className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
            <p className="mt-3 rounded-lg bg-secondary/70 px-3 py-2 text-xs text-muted-foreground">Arraste no mapa para selecionar o retângulo. Zona: <span className="font-semibold text-foreground">{zoneType}</span> · classe: <span className="font-semibold text-foreground">{zoneClass}</span> · <span className="font-semibold text-foreground">{zoningTiles.length} tiles</span></p>
            <button type="button" disabled={!zoningTiles.length || !zoneName.trim()} onClick={() => { void demarcateRegion({ id: editingRegionId ?? `region_${Date.now()}`, name: zoneName.trim(), zone: zoneType, citizenClass: zoneClass, tiles: zoningTiles, createdAt: new Date().toISOString() }); setEditingRegionId(null); setZoningTiles([]); setZoneName("") }} className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{editingRegionId ? "Salvar alterações" : "Criar nova região"}</button>
          </div>
        )}

        {showTerrainEditMenu && (
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

      {mayorOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-3 backdrop-blur-sm sm:p-8">
          <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <MayorPanel onClose={() => setMayorOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
