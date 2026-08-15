"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { City, CityState } from "@/types/city"
import type { BuildingType, Tile, ToolMode } from "@/types/game"
import { gameService } from "@/services/game"
import { DEFAULT_CITY_ID } from "@/lib/game/constants"
import { applyOccupancy, generateTerrain } from "@/lib/game/grid"

export type LoadStatus = "loading" | "ready" | "error"

interface Coord {
  x: number
  z: number
}

interface GameContextValue {
  // ---- city data (authoritative, from the service) ----
  city: City | null
  state: CityState | null
  tiles: Tile[][]
  status: LoadStatus
  error: string | null
  pending: boolean
  lastMessage: string | null

  // ---- UI / selection / build-mode state ----
  tool: ToolMode
  selectedBuilding: BuildingType | null
  hoveredTile: Coord | null
  selectedTile: Coord | null

  // ---- actions ----
  setTool: (t: ToolMode) => void
  selectBuildingType: (b: BuildingType | null) => void
  setHoveredTile: (c: Coord | null) => void
  selectTile: (c: Coord | null) => void
  build: (x: number, z: number, buildingType: BuildingType, rotation?: number) => Promise<void>
  demolish: (x: number, z: number) => Promise<void>
  clearMessage: () => void
  reload: () => Promise<void>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ cityId = DEFAULT_CITY_ID, children }: { cityId?: string; children: React.ReactNode }) {
  const [city, setCity] = useState<City | null>(null)
  const [state, setState] = useState<CityState | null>(null)
  const [status, setStatus] = useState<LoadStatus>("loading")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  const [tool, setTool] = useState<ToolMode>("SELECT")
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null)
  const [hoveredTile, setHoveredTile] = useState<Coord | null>(null)
  const [selectedTile, setSelectedTile] = useState<Coord | null>(null)

  // Terrain is generated once and reused; occupancy is derived from the
  // authoritative building list. Keeping the base terrain in a ref avoids
  // regenerating geometry inputs on every state change.
  const baseTiles = useRef<Tile[][]>(generateTerrain())
  const tiles = useMemo(
    () => applyOccupancy(baseTiles.current, state?.buildings ?? []),
    [state?.buildings],
  )

  const load = useCallback(async () => {
    setStatus("loading")
    setError(null)
    try {
      const { city, state } = await gameService.getCity(cityId)
      setCity(city)
      setState(state)
      setStatus("ready")
    } catch {
      setStatus("error")
      setError("Não foi possível carregar a cidade.")
    }
  }, [cityId])

  useEffect(() => {
    void load()
  }, [load])

  const build = useCallback<GameContextValue["build"]>(
    async (x, z, buildingType, rotation = 0) => {
      setPending(true)
      try {
        // Send only the INTENTION; render whatever the service returns.
        const res = await gameService.performAction(cityId, { type: "BUILD", buildingType, x, z, rotation })
        setState(res.state)
        setLastMessage(res.message ?? null)
      } catch {
        setLastMessage("Não foi possível concluir a ação.")
      } finally {
        setPending(false)
      }
    },
    [cityId],
  )

  const demolish = useCallback<GameContextValue["demolish"]>(
    async (x, z) => {
      setPending(true)
      try {
        const res = await gameService.performAction(cityId, { type: "DEMOLISH", x, z })
        setState(res.state)
        setLastMessage(res.message ?? null)
      } catch {
        setLastMessage("Não foi possível concluir a ação.")
      } finally {
        setPending(false)
      }
    },
    [cityId],
  )

  const selectBuildingType = useCallback((b: BuildingType | null) => {
    setSelectedBuilding(b)
    if (b) setTool(b === "ROAD" ? "ROAD" : "BUILD")
  }, [])

  const value = useMemo<GameContextValue>(
    () => ({
      city,
      state,
      tiles,
      status,
      error,
      pending,
      lastMessage,
      tool,
      selectedBuilding,
      hoveredTile,
      selectedTile,
      setTool,
      selectBuildingType,
      setHoveredTile,
      selectTile: setSelectedTile,
      build,
      demolish,
      clearMessage: () => setLastMessage(null),
      reload: load,
    }),
    [
      city,
      state,
      tiles,
      status,
      error,
      pending,
      lastMessage,
      tool,
      selectedBuilding,
      hoveredTile,
      selectedTile,
      selectBuildingType,
      build,
      demolish,
      load,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error("useGame deve ser usado dentro de <GameProvider>")
  return ctx
}
