"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import type {
  City,
  CityPolicy,
  CityState,
} from "@/types/city"

import type {
  BuildingType,
  Tile,
  ToolMode,
} from "@/types/game"

import { gameService } from "@/services/game"
import { DEFAULT_CITY_ID } from "@/lib/game/constants"
import {
  applyOccupancy,
  generateTerrain,
} from "@/lib/game/grid"

export type LoadStatus =
  | "loading"
  | "ready"
  | "error"

interface Coord {
  x: number
  z: number
}

interface GameContextValue {
  // ---- city data ----

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

  // Rotation of the object currently being placed.
  // 0 = 0°
  // 1 = 90°
  // 2 = 180°
  // 3 = 270°
  buildRotation: number

  // ---- actions ----

  setTool: (t: ToolMode) => void

  selectBuildingType: (
    b: BuildingType | null,
  ) => void

  setHoveredTile: (
    c: Coord | null,
  ) => void

  selectTile: (
    c: Coord | null,
  ) => void

  rotateBuilding: () => void

  resetBuildRotation: () => void

  rotateSelectedBuilding: (
    x: number,
    z: number,
    rotation: number,
  ) => Promise<void>

  build: (
    x: number,
    z: number,
    buildingType: BuildingType,
    rotation?: number,
  ) => Promise<void>

  demolish: (
    x: number,
    z: number,
  ) => Promise<void>

  updatePolicy: (
    policy: CityPolicy,
  ) => Promise<boolean>

  clearMessage: () => void

  reload: () => Promise<void>
}

const GameContext =
  createContext<GameContextValue | null>(null)

export function GameProvider({
  cityId = DEFAULT_CITY_ID,
  children,
}: {
  cityId?: string
  children: React.ReactNode
}) {
  const [city, setCity] =
    useState<City | null>(null)

  const [state, setState] =
    useState<CityState | null>(null)

  const [status, setStatus] =
    useState<LoadStatus>("loading")

  const [error, setError] =
    useState<string | null>(null)

  const [pending, setPending] =
    useState(false)

  const [lastMessage, setLastMessage] =
    useState<string | null>(null)

  const [tool, setTool] =
    useState<ToolMode>("SELECT")

  const [selectedBuilding, setSelectedBuilding] =
    useState<BuildingType | null>(null)

  const [hoveredTile, setHoveredTile] =
    useState<Coord | null>(null)

  const [selectedTile, setSelectedTile] =
    useState<Coord | null>(null)

  const [buildRotation, setBuildRotation] =
    useState(0)

  // ---------------------------------------------------------------------------
  // Terrain
  // ---------------------------------------------------------------------------

  const baseTiles = useMemo<Tile[][]>(
    () =>
      generateTerrain(
        city?.seed ?? 1,
      ),
    [city?.seed],
  )

  const tiles = useMemo(
    () =>
      applyOccupancy(
        baseTiles,
        state?.buildings ?? [],
      ),
    [
      baseTiles,
      state?.buildings,
    ],
  )

  // ---------------------------------------------------------------------------
  // Load city
  // ---------------------------------------------------------------------------

  const load = useCallback(async () => {
    setStatus("loading")
    setError(null)

    try {
      const result =
        await gameService.getCity(cityId)

      setCity(result.city)
      setState(result.state)

      setStatus("ready")
    } catch {
      setStatus("error")
      setError(
        "Não foi possível carregar a cidade.",
      )
    }
  }, [cityId])

  useEffect(() => {
    void load()
  }, [load])

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  const build =
    useCallback<GameContextValue["build"]>(
      async (
        x,
        z,
        buildingType,
        rotation = 0,
      ) => {
        setPending(true)

        try {
          const normalizedRotation =
            ((rotation % 4) + 4) % 4

          const res =
            await gameService.performAction(
              cityId,
              {
                type: "BUILD",
                buildingType,
                x,
                z,
                rotation:
                  normalizedRotation,
              },
            )

          setState(res.state)

          setLastMessage(
            res.message ?? null,
          )
        } catch {
          setLastMessage(
            "Não foi possível concluir a ação.",
          )
        } finally {
          setPending(false)
        }
      },
      [cityId],
    )

  // ---------------------------------------------------------------------------
  // Demolish
  // ---------------------------------------------------------------------------

  const demolish =
    useCallback<GameContextValue["demolish"]>(
      async (x, z) => {
        setPending(true)

        try {
          const res =
            await gameService.performAction(
              cityId,
              {
                type: "DEMOLISH",
                x,
                z,
              },
            )

          setState(res.state)

          setLastMessage(
            res.message ?? null,
          )
        } catch {
          setLastMessage(
            "Não foi possível concluir a ação.",
          )
        } finally {
          setPending(false)
        }
      },
      [cityId],
    )

  // ---------------------------------------------------------------------------
  // Rotatate Select
  // ---------------------------------------------------------------------------
  const rotateSelectedBuilding = useCallback(
    async (
      x: number,
      z: number,
      rotation: number,
    ) => {
      setPending(true)

      try {
        const normalizedRotation =
          ((rotation % 4) + 4) % 4

        const res =
          await gameService.performAction(
            cityId,
            {
              type: "ROTATE",
              x,
              z,
              rotation: normalizedRotation,
            },
          )

        setState(res.state)
        setLastMessage(
          res.message ?? null,
        )
      } catch {
        setLastMessage(
          "Não foi possível rotacionar a construção.",
        )
      } finally {
        setPending(false)
      }
    },
    [cityId],
  )



  // ---------------------------------------------------------------------------
  // Policy
  // ---------------------------------------------------------------------------

  const updatePolicy =
    useCallback<GameContextValue["updatePolicy"]>(
      async (policy) => {
        setPending(true)

        try {
          const res =
            await gameService.updatePolicy(
              cityId,
              policy,
            )

          setState(res.state)

          setLastMessage(
            res.message ?? null,
          )

          return res.success
        } catch {
          setLastMessage(
            "Não foi possível salvar a política municipal.",
          )

          return false
        } finally {
          setPending(false)
        }
      },
      [cityId],
    )

  // ---------------------------------------------------------------------------
  // Building selection
  // ---------------------------------------------------------------------------

  const selectBuildingType =
    useCallback(
      (building: BuildingType | null) => {
        setSelectedBuilding(building)

        // Every new building starts at 0°.
        if (building) {
          setBuildRotation(0)

          setTool(
            building === "ROAD"
              ? "ROAD"
              : "BUILD",
          )
        }
      },
      [],
    )

  // ---------------------------------------------------------------------------
  // Rotation
  // ---------------------------------------------------------------------------

  const rotateBuilding =
    useCallback(() => {
      setBuildRotation(
        (current) =>
          (current + 1) % 4,
      )
    }, [])

  const resetBuildRotation =
    useCallback(() => {
      setBuildRotation(0)
    }, [])

  // ---------------------------------------------------------------------------
  // Context
  // ---------------------------------------------------------------------------

  const value =
    useMemo<GameContextValue>(
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

        buildRotation,

        setTool,

        selectBuildingType,

        setHoveredTile,

        selectTile:
          setSelectedTile,

        rotateBuilding,

        resetBuildRotation,

        build,

        demolish,

        rotateSelectedBuilding,

        updatePolicy,

        clearMessage: () =>
          setLastMessage(null),

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

        buildRotation,

        selectBuildingType,

        build,

        demolish,

        updatePolicy,

        load,

        rotateBuilding,

        resetBuildRotation,

        rotateSelectedBuilding,
      ],
    )

  return (
    <GameContext.Provider
      value={value}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame(): GameContextValue {
  const ctx =
    useContext(GameContext)

  if (!ctx) {
    throw new Error(
      "useGame deve ser usado dentro de <GameProvider>",
    )
  }

  return ctx
}