"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  createGameClock,
} from "@/lib/game/clock"
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

// Reutilizado em toda a árvore (CityScene, SelectionIndicator, hooks de
// slice). Não duplicar esta interface em outro arquivo.
export interface Coord {
  x: number
  z: number
}

// ---------------------------------------------------------------------------
// Contexto de MUNDO / BUILD
//
// Tudo aqui muda com baixa frequência (carregamento da cidade, build,
// demolish, troca de ferramenta, seleção de building para construir).
// CityScene depende deste contexto para desenhar o Canvas e por isso ele
// NUNCA deve carregar hoveredTile/selectedTile, que mudam a cada
// pointermove/click. Isso é o que fazia o Canvas inteiro reconciliar a cada
// hover/seleção, gerando as Long Tasks.
// ---------------------------------------------------------------------------

interface GameContextValue {
  // ---- city data ----

  city: City | null
  state: CityState | null
  tiles: Tile[][]
  status: LoadStatus
  error: string | null
  pending: boolean
  lastMessage: string | null

  // ---- UI / build-mode state ----

  tool: ToolMode
  selectedBuilding: BuildingType | null

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

  // Setters de hover/seleção. As funções em si são estáveis (vêm de
  // useState), então incluí-las aqui NÃO recria o contexto de mundo — só os
  // valores (hoveredTile/selectedTile) vivem no SelectionContext, abaixo.
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

  // Disparada pelo TrafficSystem quando um carro chega a uma casa vaga. O
  // servidor revalida tudo (ver lib/game/traffic.ts) antes de aceitar.
  occupyHouse: (
    x: number,
    z: number,
  ) => Promise<void>

  arriveWork: (
    citizenId: string,
  ) => Promise<void>

  arriveHome: (
    citizenId: string,
  ) => Promise<void>


  vacateBuilding: (
    x: number,
    z: number,
  ) => Promise<void>

  closeBuilding: (
    x: number,
    z: number,
  ) => Promise<void>

  openBuilding: (
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

// ---------------------------------------------------------------------------
// Contexto de SELEÇÃO / HOVER (UI)
//
// Isolado do GameContext de propósito: hoveredTile muda a cada pointermove
// entre tiles e selectedTile muda a cada clique. Somente quem realmente
// precisa desses valores (SelectionIndicator, GameHUD/TileInspector) deve
// consumir este contexto. CityScene NÃO o consome, então trocar de tile
// selecionado não força o Canvas inteiro a reconciliar.
// ---------------------------------------------------------------------------

interface SelectionContextValue {
  hoveredTile: Coord | null
  selectedTile: Coord | null
}

const SelectionContext =
  createContext<SelectionContextValue | null>(null)

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

  const lastClockStageRef =
    useRef<"DAY" | "NIGHT" | null>(null)

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

  useEffect(() => {
    if (!city?.clockStartedAt) {
      return
    }

    const initialStage =
      createGameClock(
        city.clockStartedAt,
        Date.now(),
      ).stage

    lastClockStageRef.current =
      initialStage

    const intervalId =
      window.setInterval(() => {
        const currentStage =
          createGameClock(
            city.clockStartedAt,
            Date.now(),
          ).stage

        if (
          currentStage ===
          lastClockStageRef.current
        ) {
          return
        }

        lastClockStageRef.current =
          currentStage

        void gameService
          .performAction(
            cityId,
            {
              type: "SYNC_TIME_STAGE",
            },
          )
          .then((res) => {
            if (!res.success) {
              return
            }

            setState(res.state)
          })
          .catch(() => {
            // sincronização silenciosa
          })
      }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [
    cityId,
    city?.clockStartedAt,
  ])
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
  // Occupy (chamado pelo TrafficSystem quando um carro chega numa casa vaga)
  // ---------------------------------------------------------------------------

  const occupyHouse =
    useCallback<GameContextValue["occupyHouse"]>(
      async (x, z) => {
        setPending(true)

        try {
          const res =
            await gameService.performAction(
              cityId,
              {
                type: "OCCUPY",
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




  const arriveWork =
    useCallback<GameContextValue["arriveWork"]>(
      async (citizenId) => {
        try {
          const res =
            await gameService.performAction(
              cityId,
              {
                type: "ARRIVE_WORK",
                citizenId,
              },
            )

          setState(res.state)

          setLastMessage(
            res.message ?? null,
          )
        } catch {
          setLastMessage(
            "Não foi possível registrar a chegada ao trabalho.",
          )
        }
      },
      [cityId],
    )

  const arriveHome =
    useCallback<GameContextValue["arriveHome"]>(
      async (citizenId) => {
        try {
          const res =
            await gameService.performAction(
              cityId,
              {
                type: "ARRIVE_HOME",
                citizenId,
              },
            )

          setState(res.state)

          setLastMessage(
            res.message ?? null,
          )
        } catch {
          setLastMessage(
            "Não foi possível registrar a chegada em casa.",
          )
        }
      },
      [cityId],
    )
  // ---------------------------------------------------------------------------
  // Vacate
  // ---------------------------------------------------------------------------

  const vacateBuilding =
    useCallback<
      GameContextValue["vacateBuilding"]
    >(
      async (x, z) => {
        setPending(true)

        try {
          const res =
            await gameService.performAction(
              cityId,
              {
                type: "VACATE",
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
            "Não foi possível desocupar a construção.",
          )
        } finally {
          setPending(false)
        }
      },
      [cityId],
    )

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------

  const closeBuilding =
    useCallback<
      GameContextValue["closeBuilding"]
    >(
      async (x, z) => {
        setPending(true)

        try {
          const res =
            await gameService.performAction(
              cityId,
              {
                type: "CLOSE",
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
            "Não foi possível fechar a construção.",
          )
        } finally {
          setPending(false)
        }
      },
      [cityId],
    )

  // ---------------------------------------------------------------------------
  // Open
  // ---------------------------------------------------------------------------

  const openBuilding =
    useCallback<
      GameContextValue["openBuilding"]
    >(
      async (x, z) => {
        setPending(true)

        try {
          const res =
            await gameService.performAction(
              cityId,
              {
                type: "OPEN",
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
            "Não foi possível reabrir a construção.",
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

  // IMPORTANTE: hoveredTile/selectedTile NÃO entram neste objeto nem nas
  // deps do useMemo. setHoveredTile/setSelectedTile (setters de useState)
  // são referências estáveis entre renders, então este value só muda quando
  // dados de mundo/build realmente mudam — não a cada hover/seleção.
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

        occupyHouse,
        
        arriveWork,
        arriveHome,

        vacateBuilding,

        closeBuilding,

        openBuilding,

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

        buildRotation,
        

        selectBuildingType,

        build,

        demolish,

        occupyHouse,

        arriveWork,
        arriveHome,

        vacateBuilding,

        closeBuilding,

        openBuilding,

        updatePolicy,

        load,

        rotateBuilding,

        resetBuildRotation,

        rotateSelectedBuilding,
      ],
    )

  // Contexto de seleção/hover: isolado para que só quem consome
  // useSelection() re-renderize quando hoveredTile/selectedTile mudam.
  const selectionValue =
    useMemo<SelectionContextValue>(
      () => ({
        hoveredTile,
        selectedTile,
      }),
      [
        hoveredTile,
        selectedTile,
      ],
    )


  return (
    <GameContext.Provider value={value}>
      <SelectionContext.Provider
        value={selectionValue}
      >
        {children}
      </SelectionContext.Provider>
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

// Hook dedicado para hoveredTile/selectedTile. Use isto (não useGame) em
// qualquer componente que só precisa ler esses valores — em especial dentro
// da árvore do Canvas (ex.: SelectionIndicator) — para não acoplar seu
// re-render ao resto do estado de mundo/build, e vice-versa.
export function useSelection(): SelectionContextValue {
  const ctx =
    useContext(SelectionContext)

  if (!ctx) {
    throw new Error(
      "useSelection deve ser usado dentro de <GameProvider>",
    )
  }

  return ctx
}
