"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { createGameClock, DEFAULT_GAME_CLOCK_CONFIG } from "@/lib/game/clock"
import { getUtilityNetwork, utilityKey } from "@/lib/game/utilityNetwork"

import {
  OrbitControls,
  ContactShadows,
} from "@react-three/drei"

import {
  Color,
  PCFShadowMap,
  MOUSE,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  Fog,
  Group,
} from "three"

import {
  CAMERA,
  TILE_SIZE,
  tileToWorld,
} from "@/lib/game/constants"

import { canPlace } from "@/lib/game/grid"
import { useGame } from "@/hooks/useGame"
import { BuildingMesh } from "./Building"
import { Road } from "./Road"
import { GroundTiles } from "./GroundTiles"
import { SelectionIndicator } from "./SelectionIndicator"
import { CameraController } from "./CameraController"
import { PerformanceMonitor } from "./PerformanceMonitor"
import { TrafficSystem } from "./TrafficSystem"

import { createRoadSet } from "@/lib/game/roadAutoTile"

import type {
  Building,
} from "@/types/city"

import type {
  SelectionIndicatorHandle,
} from "./SelectionIndicator"

function LiveDayNightController({ clockStartedAt }: { clockStartedAt?: number | null }) {
  const { scene } = useThree()
  const ambient = useRef<AmbientLight | null>(null)
  const hemisphere = useRef<HemisphereLight | null>(null)
  const directional = useRef<DirectionalLight | null>(null)
  const daylight = useRef<number | null>(null)
  const dawnSky = useMemo(() => new Color("#9fc9e8"), [])
  const nightSky = useMemo(() => new Color("#18243d"), [])
  const dawnGround = useMemo(() => new Color("#4a6b3a"), [])
  const nightGround = useMemo(() => new Color("#111827"), [])
  const currentSky = useMemo(() => new Color(), [])
  const currentGround = useMemo(() => new Color(), [])

  useFrame(({ clock }) => {
    if (!clockStartedAt) return
    const startedAt = typeof clockStartedAt === "number" ? clockStartedAt : Date.parse(String(clockStartedAt))
    if (!Number.isFinite(startedAt)) return
    const currentClock = createGameClock(startedAt, Date.now(), DEFAULT_GAME_CLOCK_CONFIG)
    const minute = currentClock.hour * 60 + currentClock.minute
    const smoothstep = (a: number, b: number, value: number) => {
      const t = Math.max(0, Math.min(1, (value - a) / (b - a)))
      return t * t * (3 - 2 * t)
    }
    const nextDaylight = Math.min(smoothstep(300, 420, minute), 1 - smoothstep(1080, 1200, minute))
    if (daylight.current === null) daylight.current = nextDaylight
    else daylight.current += (nextDaylight - daylight.current) * Math.min(1, clock.getDelta() * 8)
    const light = daylight.current
    currentSky.copy(nightSky).lerp(dawnSky, light)
    currentGround.copy(nightGround).lerp(dawnGround, light)
    scene.background = currentSky
    if (scene.fog instanceof Fog) { scene.fog.color.copy(currentSky) }
    if (ambient.current) ambient.current.intensity = 0.28 + light * 0.47
    if (hemisphere.current) { hemisphere.current.color.set("#445b92").lerp(new Color("#dcefff"), light); hemisphere.current.groundColor.copy(currentGround); hemisphere.current.intensity = 0.16 + light * 0.54 }
    if (directional.current) directional.current.intensity = 0.35 + light * 1.15
  })

  return <><ambientLight ref={ambient} intensity={0.28} /><hemisphereLight ref={hemisphere} args={["#445b92", "#111827", 0.16]} /><directionalLight ref={directional} position={[18, 28, 12]} intensity={0.35} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-bias={-0.0004} /></>
}

function regionColor(region: { zone: string; citizenClass?: string }) {
  if (region.zone === "COMMERCIAL") return "#2563eb"
  if (region.zone === "INDUSTRIAL") return "#eab308"
  if (region.citizenClass === "LOW") return "#166534"
  if (region.citizenClass === "HIGH") return "#bbf7d0"
  return "#4ade80"
}

function zoneTypeColor(mode: string) {
  return mode === "ZONING" ? "#4ade80" : "#64748b"
}

function heatValue(metric: string, state: any, region?: { tiles: Array<{ x: number; z: number }> }) {
  if (!region) return -1
  const regionalCitizens = state?.citizens?.filter((citizen: any) => {
    const home = state?.buildings?.find((building: any) => building.id === citizen.homeBuildingId)
    return home && region.tiles.some((tile) => tile.x === home.x && tile.z === home.z)
  }) ?? []
  if (regionalCitizens.length === 0) return -1
  if (metric === "happiness") return Math.round(regionalCitizens.reduce((sum: number, citizen: any) => sum + Number(citizen.opinion?.score ?? state.happiness ?? 0), 0) / regionalCitizens.length)
  if (metric === "employment") return Math.round((regionalCitizens.filter((citizen: any) => citizen.employed).length / regionalCitizens.length) * 100)
  if (metric === "services") return Math.round(Object.values(state?.services ?? {}).reduce((sum: number, value) => sum + Number(value), 0) / Math.max(1, Object.values(state?.services ?? {}).length))
  return -1
}

function roadStatus(building: { maintenance?: { status: "REGULAR" | "IRREGULAR" | "CLOSED" }; roadCondition?: "REGULAR" | "IRREGULAR" | "CLOSED"; closed?: boolean }) {
  return building.maintenance?.status ?? building.roadCondition ?? (building.closed ? "CLOSED" : "REGULAR")
}

function heatColor(value: number) {
  if (value < 0) return "#9ca3af"
  if (value < 50) return "#ef4444"
  if (value < 70) return "#eab308"
  return "#22c55e"
}

function UtilityPipes({ buildings, type }: { buildings: Array<{ x: number; z: number; type: string }>; type: "ELECTRIC_GRID" | "SEWER_NETWORK" }) {
  const group = useRef<Group>(null)
  const color = type === "ELECTRIC_GRID" ? "#facc15" : "#60a5fa"
  const utilityBuildings = buildings as Building[]
  const connected = getUtilityNetwork(utilityBuildings, type)
  useFrame(({ clock }) => { if (group.current) group.current.children.forEach((child, index) => { child.position.y = 0.15 + Math.sin(clock.elapsedTime * 4 + index * 0.7) * 0.015 }) })
  const networkTiles = utilityBuildings.filter((building) => building.type === type)
  const tileSet = new Set(networkTiles.map((building) => utilityKey(building.x, building.z)))
  const offset = type === "ELECTRIC_GRID" ? -0.22 : 0.22
  const pipeMaterial = (active: boolean) => <meshBasicMaterial color={color} transparent={!active} opacity={active ? 1 : 0.45} />
  const segment = (x: number, z: number, dx: number, dz: number, id: string, active: boolean) => {
    const horizontal = dx !== 0
    const centerX = tileToWorld(x) + offset + (dx * TILE_SIZE) / 4
    const centerZ = tileToWorld(z) + (dz * TILE_SIZE) / 4
    return <mesh key={`${type}-${id}`} position={[centerX, 0.15, centerZ]} rotation={horizontal ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, TILE_SIZE / 2, 8]} />{pipeMaterial(active)}</mesh>
  }
  return <group ref={group}>{networkTiles.flatMap((network) => {
    const active = connected.has(utilityKey(network.x, network.z))
    const neighbors = [
      [1, 0, "e"],
      [0, 1, "s"],
      [-1, 0, "w"],
      [0, -1, "n"],
    ] as const
    const segments = neighbors.filter(([dx, dz]) => tileSet.has(utilityKey(network.x + dx, network.z + dz))).map(([dx, dz, direction]) => segment(network.x, network.z, dx, dz, `${network.x}-${network.z}-${direction}`, active && connected.has(utilityKey(network.x + dx, network.z + dz))))
    return [
      <mesh key={`${type}-${network.x}-${network.z}-node`} position={[tileToWorld(network.x) + offset, 0.15, tileToWorld(network.z)]}><sphereGeometry args={[0.055, 8, 6]} />{pipeMaterial(active)}</mesh>,
      ...segments,
    ]
  })}</group>
}

/**
 * The full 3D city. It reads authoritative state from the game store and
 * turns pointer interactions into INTENTIONS (build/demolish/select) that the
 * store forwards to the service. The scene never mutates game state directly.
 *
 * Rendering is intentionally dependency-free (no remote HDR environment maps)
 * so the canvas can never blank out waiting on a network fetch.
 */
export function CityScene() {
  // Nota: hoveredTile/selectedTile NÃO são lidos aqui de propósito. Eles
  // vivem no SelectionContext (useSelection) e mudam a cada
  // pointermove/clique. Se este componente os consumisse, o CityScene (e
  // toda a árvore do Canvas: GroundTiles, buildings, etc.) reconciliaria a
  // cada hover/seleção — foi essa a causa das Long Tasks. Quem precisa do
  // valor atual (SelectionIndicator) lê o SelectionContext diretamente.
  const {
    tiles,
    city,
    state,

    tool,
    selectedBuilding,

    buildRotation,

    selectTile,

    build,
    demolish,

    occupyHouse,
    arriveWork,
    arriveHome,

    rotateBuilding,
    moveBuilding,
    setTerrain,
  } = useGame()

  const [zoningStart, setZoningStart] = useState<[number, number] | null>(null)
  const [zoningEnd, setZoningEnd] = useState<[number, number] | null>(null)
  const [zoningSelectionComplete, setZoningSelectionComplete] = useState(false)
  const [previewZone, setPreviewZone] = useState({ zone: "RESIDENTIAL", citizenClass: "MIDDLE" })
  const [previewTiles, setPreviewTiles] = useState<Array<{ x: number; z: number }>>([])
  const [terrainSelection, setTerrainSelection] = useState<Array<{ x: number; z: number }>>([])
  const [terrainStart, setTerrainStart] = useState<[number, number] | null>(null)
  const [terrainEnd, setTerrainEnd] = useState<[number, number] | null>(null)
  const [terrainPreview, setTerrainPreview] = useState<"SAND" | "GRASS" | "WATER" | "ROCK" | "FOREST">("GRASS")

  const getTerrainRectangle = (from: [number, number], to: [number, number]) => {
    const minX = Math.min(from[0], to[0])
    const maxX = Math.max(from[0], to[0])
    const minZ = Math.min(from[1], to[1])
    const maxZ = Math.max(from[1], to[1])
    return Array.from({ length: maxX - minX + 1 }, (_, x) =>
      Array.from({ length: maxZ - minZ + 1 }, (_, z) => ({ x: minX + x, z: minZ + z })),
    ).flat()
  }

  useEffect(() => {
    const handleTerrainSelection = (event: Event) => {
      const detail = (event as CustomEvent<{ tiles: Array<{ x: number; z: number }>; terrain: typeof terrainPreview }>).detail
      setTerrainSelection(detail.tiles)
      setTerrainPreview(detail.terrain)
    }
    const handleClearTerrain = () => {
      setTerrainSelection([])
      setTerrainStart(null)
      setTerrainEnd(null)
    }
    window.addEventListener("polycity:terrain-selection", handleTerrainSelection)
    window.addEventListener("polycity:clear-terrain-selection", handleClearTerrain)
    return () => { window.removeEventListener("polycity:terrain-selection", handleTerrainSelection); window.removeEventListener("polycity:clear-terrain-selection", handleClearTerrain) }
  }, [])

  useEffect(() => {
    const handleZone = (event: Event) => {
      const detail = (event as CustomEvent<{ zone: string; citizenClass: string; tiles?: Array<{ x: number; z: number }> }>).detail
      setPreviewZone(detail)
      if (detail.tiles) setPreviewTiles(detail.tiles)
    }
    window.addEventListener("polycity:zone-preview", handleZone)
    return () => window.removeEventListener("polycity:zone-preview", handleZone)
  }, [])

  useEffect(() => {
    const handleClear = () => {
      setPreviewZone(null)
      setZoningStart(null)
      setZoningEnd(null)
      setZoningSelectionComplete(false)
      setPreviewTiles([])
    }
    window.addEventListener("polycity:clear-selection", handleClear)
    window.addEventListener("polycity:zoning-saved", handleClear)
    return () => {
      window.removeEventListener("polycity:clear-selection", handleClear)
      window.removeEventListener("polycity:zoning-saved", handleClear)
    }
  }, [])

  const publishZoningRange = (from: [number, number], to: [number, number]) => {
    const minX = Math.min(from[0], to[0])
    const maxX = Math.max(from[0], to[0])
    const minZ = Math.min(from[1], to[1])
    const maxZ = Math.max(from[1], to[1])
    const tiles = Array.from({ length: maxX - minX + 1 }, (_, x) =>
      Array.from({ length: maxZ - minZ + 1 }, (_, z) => ({ x: minX + x, z: minZ + z })),
    ).flat()
    window.dispatchEvent(new CustomEvent("polycity:zoning-range", { detail: { from, to, tiles } }))
  }
  const [heatMetric, setHeatMetric] = useState<"happiness" | "employment" | "services" | "roads" | "energy" | "sewer">("happiness")

  useEffect(() => {
    const handleHeatmap = (event: Event) => setHeatMetric((event as CustomEvent<typeof heatMetric>).detail)
    window.addEventListener("polycity:heatmap", handleHeatmap)
    return () => window.removeEventListener("polycity:heatmap", handleHeatmap)
  }, [])

  const buildings = state?.buildings ?? []
  const visualStage = state?.timeStage === "NIGHT" ? "NIGHT" : "DAY"
  const isNight = visualStage === "NIGHT"
  const minuteOfDay = isNight ? 0 : 720

  const visualNight = isNight
  const nightIntensity = isNight ? 1 : 0
  const skyColor = new Color(isNight ? "#18243d" : "#9fc9e8")
  const groundColor = new Color(isNight ? "#111827" : "#4a6b3a")

  const citizens =
    state?.citizens ?? []

  const [
    editingBuilding,
    setEditingBuilding,
  ] = useState<Building | null>(null)

  const [
    editingRotation,
    setEditingRotation,
  ] = useState(0)

  const hoverControllerRef =
    useRef<SelectionIndicatorHandle | null>(
      null,
    )

  const roadSet = useMemo(
    () => createRoadSet(buildings),
    [buildings],
  )
  // ---------------------------------------------------------------------------
  // R = rotate current building preview
  // ---------------------------------------------------------------------------

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key.toLowerCase() !== "r"
      ) {
        return
      }

      if (
        tool !== "BUILD" &&
        tool !== "ROAD" &&
        tool !== "EDIT"
      ) {
        return
      }

      if (
        tool === "EDIT" &&
        !editingBuilding
      ) {
        return
      }

      if (
        tool !== "EDIT" &&
        !selectedBuilding
      ) {
        return
      }

      const target =
        event.target as HTMLElement | null

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return
      }

      event.preventDefault()

      if (tool === "EDIT") {
        setEditingRotation(
          (current) =>
            (current + 1) % 4,
        )

        return
      }

      rotateBuilding()
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
    }
  }, [
    selectedBuilding,
    editingBuilding,
    tool,
    rotateBuilding,
    setEditingRotation,
  ])

  // ---------------------------------------------------------------------------
  // Tile interaction
  //
  // Memoizados com useCallback para que GroundTiles não receba novas
  // referências de handler a cada render de CityScene (ex.: quando `state`
  // muda após um build/demolish).
  // ---------------------------------------------------------------------------


  const handleSelect = useCallback(
    (x: number, z: number) => {
      const tile =
        tiles[x]?.[z]

      if (tool === "TERRAIN_EDIT") {
        if (!tile) return
        if (!terrainStart || terrainEnd) {
          const start: [number, number] = [x, z]
          setTerrainStart(start)
          setTerrainEnd(null)
          const singleTile = [{ x, z }]
          setTerrainSelection(singleTile)
          window.dispatchEvent(new CustomEvent("polycity:terrain-selection", { detail: { tiles: singleTile, terrain: terrainPreview } }))
        } else {
          const end: [number, number] = [x, z]
          const selectedTiles = getTerrainRectangle(terrainStart, end)
          setTerrainEnd(end)
          setTerrainSelection(selectedTiles)
          window.dispatchEvent(new CustomEvent("polycity:terrain-selection", { detail: { tiles: selectedTiles, terrain: terrainPreview } }))
        }
        selectTile({ x, z })
        return
      }

      if (tool === "EDIT") {
        // Primeiro clique:
        // seleciona a construção que será editada.
        if (!editingBuilding) {
          const buildingId =
            tile?.occupiedBy

          if (!buildingId) {
            return
          }

          const building =
            buildings.find(
              (b) =>
                b.id ===
                buildingId,
            )

          if (!building) {
            return
          }

          setEditingBuilding(
            building,
          )

          setEditingRotation(
            building.rotation,
          )

          selectTile({
            x,
            z,
          })

          return
        }

        // Segundo clique:
        // move a construção para o tile escolhido.

        const isSameBuilding =
          tile?.occupiedBy === editingBuilding.id

        // Se estamos clicando no próprio tile da
        // construção em edição, permitimos.
        // Isso permite alterar somente a rotação.
        if (
          !isSameBuilding &&
          !canPlace(tile)
        ) {
          return
        }

        void moveBuilding(
          editingBuilding.x,
          editingBuilding.z,
          x,
          z,
          editingRotation,
        )

        setEditingBuilding(null)
        setEditingRotation(0)
        return
      }

      if (tool === "ZONING") {
        if (!zoningStart || zoningSelectionComplete) {
          setZoningStart([x, z])
          setZoningEnd([x, z])
          setZoningSelectionComplete(false)
        } else {
          setZoningEnd([x, z])
          publishZoningRange(zoningStart, [x, z])
          setZoningSelectionComplete(true)
        }
        selectTile({ x, z })
        return
      }

      if (tool === "DEMOLISH") {
        const roadAtTile = buildings.some((building) => building.x === x && building.z === z && building.type === "ROAD")
        if (roadAtTile) {
          void demolish(x, z, "ROAD")
          return
        }

        const selectedUtility = selectedBuilding === "ELECTRIC_GRID" || selectedBuilding === "SEWER_NETWORK" ? selectedBuilding : null
        const utilityAtTile = buildings.find((building) => building.x === x && building.z === z && (selectedUtility ? building.type === selectedUtility : building.type === "ELECTRIC_GRID" || building.type === "SEWER_NETWORK"))
        if (utilityAtTile) void demolish(x, z, utilityAtTile.type)
        else if (tile?.occupiedBy) void demolish(x, z)
        return
      }

      if (
        (tool === "BUILD" ||
          tool === "ROAD") &&
        selectedBuilding
      ) {
        const isUtilityNetwork = selectedBuilding === "ELECTRIC_GRID" || selectedBuilding === "SEWER_NETWORK"
        const networkOnRoad = isUtilityNetwork && buildings.some((building) => building.x === x && building.z === z && building.type === "ROAD")
        const duplicateNetwork = buildings.some((building) => building.x === x && building.z === z && building.type === selectedBuilding)
        if ((canPlace(tile) || networkOnRoad) && (!isUtilityNetwork || networkOnRoad) && !duplicateNetwork) {
          void build(x, z, selectedBuilding, buildRotation)
        }

        return
      }

      // SELECT mode
      selectTile({ x, z })
    },
    [
      tiles,
      tool,
      zoningStart,
      zoningSelectionComplete,
      selectedBuilding,
      buildRotation,
      buildings,
      editingBuilding,
      editingRotation,
      moveBuilding,
      setEditingBuilding,
      setEditingRotation,
      build,
      demolish,
      selectTile,
      terrainSelection,
      terrainStart,
      terrainEnd,
      terrainPreview,
    ],
  )

  return (
    <Canvas
      shadows={{
        type: PCFShadowMap,
      }}
      camera={{
        position:
          CAMERA.initialPosition,
        fov: CAMERA.fov,
      }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference:
          "high-performance",
      }}
    >

      <PerformanceMonitor />
      <color
        attach="background"
        args={[skyColor.getStyle()]}
      />

      <fog
        attach="fog"
        args={[
          skyColor.getStyle(),
          55,
          120,
        ]}
      />

      <LiveDayNightController clockStartedAt={city?.clockStartedAt ?? null} />
      {tool === "BUILD" && selectedBuilding === "ELECTRIC_GRID" && <UtilityPipes buildings={state?.buildings ?? []} type="ELECTRIC_GRID" />}
      {tool === "BUILD" && selectedBuilding === "SEWER_NETWORK" && <UtilityPipes buildings={state?.buildings ?? []} type="SEWER_NETWORK" />}



      <Suspense fallback={null}>
        {tool === "TERRAIN_EDIT" && terrainSelection.map((tile) => <mesh key={`terrain-preview-${tile.x}-${tile.z}`} rotation={[-Math.PI / 2, 0, 0]} position={[tileToWorld(tile.x), 0.055, tileToWorld(tile.z)]}><planeGeometry args={[TILE_SIZE * 0.94, TILE_SIZE * 0.94]} /><meshBasicMaterial color={terrainPreview === "WATER" ? "#38bdf8" : terrainPreview === "SAND" ? "#facc15" : terrainPreview === "ROCK" ? "#78716c" : terrainPreview === "FOREST" ? "#16a34a" : "#4ade80"} transparent opacity={0.78} /></mesh>)}
        {tool === "ZONING" && state?.regions?.flatMap((region) => region.tiles.map((tile) => <mesh key={`region-${region.id}-${tile.x}-${tile.z}`} rotation={[-Math.PI / 2, 0, 0]} position={[tileToWorld(tile.x), 0.04, tileToWorld(tile.z)]}><planeGeometry args={[TILE_SIZE * 0.92, TILE_SIZE * 0.92]} /><meshBasicMaterial color={regionColor(region)} transparent opacity={0.68} /></mesh>))}
        {tool === "ZONING" && previewTiles.length > 0 && previewTiles.map((tile) => <mesh key={`selected-preview-${tile.x}-${tile.z}`} rotation={[-Math.PI / 2, 0, 0]} position={[tileToWorld(tile.x), 0.045, tileToWorld(tile.z)]}><planeGeometry args={[TILE_SIZE * 0.94, TILE_SIZE * 0.94]} /><meshBasicMaterial color={regionColor(previewZone)} transparent opacity={0.84} /></mesh>)}
        {tool === "ZONING" && previewTiles.length === 0 && zoningStart && zoningEnd && Array.from({ length: Math.abs(zoningEnd[0] - zoningStart[0]) + 1 }, (_, ix) => ix).flatMap((ix) => Array.from({ length: Math.abs(zoningEnd[1] - zoningStart[1]) + 1 }, (_, iz) => iz)).map((_, index) => {
          const minX = Math.min(zoningStart[0], zoningEnd[0])
          const minZ = Math.min(zoningStart[1], zoningEnd[1])
          const width = Math.abs(zoningEnd[1] - zoningStart[1]) + 1
          const x = minX + Math.floor(index / width)
          const z = minZ + index % width
          const previewRegion = previewZone
          return <mesh key={`zone-preview-${x}-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[tileToWorld(x), 0.035, tileToWorld(z)]}><planeGeometry args={[TILE_SIZE * 0.92, TILE_SIZE * 0.92]} /><meshBasicMaterial color={regionColor(previewRegion)} transparent opacity={0.72} /></mesh>
        })}
        {tool === "HEATMAP" && Array.from({ length: 30 * 30 }, (_, index) => { const x = index % 30; const z = Math.floor(index / 30); const region = state?.regions?.find((item) => item.tiles.some((tile) => tile.x === x && tile.z === z)); const road = state?.buildings?.find((building: any) => building.type === "ROAD" && building.x === x && building.z === z); const status = road ? roadStatus(road) : null; const network = state?.buildings?.some((building: any) => building.x === x && building.z === z && building.type === (heatMetric === "energy" ? "ELECTRIC_GRID" : "SEWER_NETWORK")); const value = heatMetric === "energy" || heatMetric === "sewer" ? (network ? 100 : -1) : heatMetric === "roads" ? (status === "CLOSED" ? 25 : status === "IRREGULAR" ? 58 : status === "REGULAR" ? 86 : -1) : heatValue(heatMetric, state, region); return <mesh key={`heat-${x}-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[tileToWorld(x), 0.16, tileToWorld(z)]}><planeGeometry args={[TILE_SIZE * 0.94, TILE_SIZE * 0.94]} /><meshBasicMaterial color={heatColor(value)} transparent opacity={heatMetric === "roads" && road ? 0.9 : 0.62} depthWrite={false} /></mesh> })}
        <GroundTiles
          tiles={tiles}
          onSelect={handleSelect}
          onCancelSelect={() => {
            setZoningStart(null)
            setZoningEnd(null)
            setZoningSelectionComplete(false)
            window.dispatchEvent(new Event("polycity:clear-selection"))
          }}
          allowDragSelect={false}
          hoverControllerRef={
            hoverControllerRef
          }
        />

        {/* Placed buildings */}

        {buildings.filter((b) => b.type !== "ELECTRIC_GRID" && b.type !== "SEWER_NETWORK").map((b) => {
          const position: [
            number,
            number,
            number,
          ] = [
            tileToWorld(b.x),
            0,
            tileToWorld(b.z),
          ]

          if (b.type === "ROAD") {
            return (
              <Road
                key={b.id}
                position={position}
                x={b.x}
                z={b.z}
                roads={roadSet}
              />
            )
          }

          return (
            <BuildingMesh
              key={b.id}
              type={b.type}
              position={position}
              rotation={
                b.rotation
              }
              isNight={visualNight}
              nightIntensity={nightIntensity}
              occupied={b.occupied}
            />
          )
        })}

        <TrafficSystem
          buildings={buildings}
          citizens={citizens}
          occupyHouse={occupyHouse}
          arriveWork={arriveWork}
          arriveHome={arriveHome}
          timeStage={visualStage}
        />

        <SelectionIndicator
          ref={hoverControllerRef}
          tiles={tiles}
          tool={tool}
          selectedBuilding={selectedBuilding}
          rotation={buildRotation}
  editingBuilding={editingBuilding}
  editingRotation={editingRotation}
  buildings={buildings}
  />

        <ContactShadows
          position={[
            0,
            0.01,
            0,
          ]}
          opacity={0.35}
          scale={
            TILE_SIZE * 40
          }
          blur={2}
          far={10}
        />
      </Suspense>
      <CameraController />

      <OrbitControls
        makeDefault
        enablePan
        panSpeed={
          CAMERA.panSpeed
        }
        minDistance={
          CAMERA.minDistance
        }
        maxDistance={
          CAMERA.maxDistance
        }
        minPolarAngle={
          CAMERA.minPolarAngle
        }
        maxPolarAngle={
          CAMERA.maxPolarAngle
        }
        target={[0, 0, 0]}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.PAN,
        }}
      />
    </Canvas>
  )
}
