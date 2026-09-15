"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { Canvas } from "@react-three/fiber"

import {
  OrbitControls,
  ContactShadows,
} from "@react-three/drei"

import {
  Color,
  PCFShadowMap,
  MOUSE,
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

function heatValue(metric: string, state: any, region?: { citizenClass?: string; zone: string }) {
  if (!region) return -1
  if (metric === "happiness") return region.citizenClass === "HIGH" ? 82 : region.citizenClass === "LOW" ? 38 : 64
  if (metric === "employment") return region.zone === "INDUSTRIAL" || region.zone === "COMMERCIAL" ? 78 : 42
  if (metric === "services") return Math.round(Object.values(state?.services ?? {}).reduce((sum: number, value) => sum + Number(value), 0) / Math.max(1, Object.values(state?.services ?? {}).length))
  return Number(state?.services?.roads ?? 0)
}

function heatColor(value: number) {
  if (value < 0) return "#e5e7eb"
  if (value < 50) return "#ef4444"
  if (value < 70) return "#eab308"
  return "#22c55e"
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
  } = useGame()

  const [zoningStart, setZoningStart] = useState<[number, number] | null>(null)
  const [zoningEnd, setZoningEnd] = useState<[number, number] | null>(null)

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
  const [heatMetric, setHeatMetric] = useState<"happiness" | "employment" | "services" | "roads">("happiness")

  useEffect(() => {
    const handleHeatmap = (event: Event) => setHeatMetric((event as CustomEvent<typeof heatMetric>).detail)
    window.addEventListener("polycity:heatmap", handleHeatmap)
    return () => window.removeEventListener("polycity:heatmap", handleHeatmap)
  }, [])

  const buildings =
    state?.buildings ?? []
  const isNight =
    String(state?.timeStage) === "1" ||
    state?.timeStage === "NIGHT"

  const minuteOfDay = state?.clock
    ? state.clock.hour * 60 + state.clock.minute
    : isNight
      ? 0
      : 720

  const smoothstep = (edge0: number, edge1: number, value: number) => {
    const progress = Math.max(
      0,
      Math.min(1, (value - edge0) / (edge1 - edge0)),
    )

    return progress * progress * (3 - 2 * progress)
  }

  // O céu muda gradualmente entre 05:00–07:00 e 19:00–21:00,
  // criando um amanhecer e um pôr do sol em vez de um corte abrupto.
  const daylight = Math.min(
    smoothstep(5 * 60, 7 * 60, minuteOfDay),
    1 - smoothstep(19 * 60, 21 * 60, minuteOfDay),
  )
  const nightIntensity = 1 - daylight
  const visualNight = nightIntensity > 0.45

  const skyColor = new Color("#18243d").lerp(
    new Color("#9fc9e8"),
    daylight,
  )
  const groundColor = new Color("#111827").lerp(
    new Color("#4a6b3a"),
    daylight,
  )

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
        if (!zoningStart) {
          setZoningStart([x, z])
          setZoningEnd([x, z])
        } else {
          publishZoningRange(zoningStart, [x, z])
          setZoningStart(null)
          setZoningEnd(null)
        }
        selectTile({ x, z })
        return
      }

      if (tool === "DEMOLISH") {
        if (tile?.occupiedBy) {
          void demolish(x, z)
        }

        return
      }

      if (
        (tool === "BUILD" ||
          tool === "ROAD") &&
        selectedBuilding
      ) {
        if (canPlace(tile)) {
          void build(
            x,
            z,
            selectedBuilding,
            buildRotation,
          )
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

      <ambientLight
        intensity={0.28 + daylight * 0.47}
      />

      <hemisphereLight
        args={[
          new Color("#445b92").lerp(new Color("#dcefff"), daylight).getStyle(),
          groundColor.getStyle(),
          0.16 + daylight * 0.54,
        ]}
      />

      <directionalLight
        position={[
          18,
          28,
          12,
        ]}
        intensity={0.35 + daylight * 1.15}
        castShadow
        shadow-mapSize={[
          2048,
          2048,
        ]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-bias={-0.0004}
      />

      <Suspense fallback={null}>
        {tool === "ZONING" && state?.regions?.flatMap((region) => region.tiles.map((tile) => <mesh key={`region-${region.id}-${tile.x}-${tile.z}`} rotation={[-Math.PI / 2, 0, 0]} position={[tileToWorld(tile.x), 0.04, tileToWorld(tile.z)]}><planeGeometry args={[TILE_SIZE * 0.92, TILE_SIZE * 0.92]} /><meshBasicMaterial color={regionColor(region)} transparent opacity={0.68} /></mesh>))}
        {tool === "ZONING" && zoningStart && zoningEnd && Array.from({ length: Math.abs(zoningEnd[0] - zoningStart[0]) + 1 }, (_, ix) => ix).flatMap((ix) => Array.from({ length: Math.abs(zoningEnd[1] - zoningStart[1]) + 1 }, (_, iz) => iz)).map((_, index) => {
          const minX = Math.min(zoningStart[0], zoningEnd[0])
          const minZ = Math.min(zoningStart[1], zoningEnd[1])
          const width = Math.abs(zoningEnd[1] - zoningStart[1]) + 1
          const x = minX + Math.floor(index / width)
          const z = minZ + index % width
          const previewRegion = { zone: "RESIDENTIAL", citizenClass: "MIDDLE" }
          return <mesh key={`zone-preview-${x}-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[tileToWorld(x), 0.035, tileToWorld(z)]}><planeGeometry args={[TILE_SIZE * 0.92, TILE_SIZE * 0.92]} /><meshBasicMaterial color={regionColor(previewRegion)} transparent opacity={0.72} /></mesh>
        })}
        {tool === "HEATMAP" && Array.from({ length: 30 * 30 }, (_, index) => { const x = index % 30; const z = Math.floor(index / 30); const region = state?.regions?.find((item) => item.tiles.some((tile) => tile.x === x && tile.z === z)); const value = heatValue(heatMetric, state, region); return <mesh key={`heat-${x}-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[tileToWorld(x), 0.034, tileToWorld(z)]}><planeGeometry args={[TILE_SIZE * 0.94, TILE_SIZE * 0.94]} /><meshBasicMaterial color={heatColor(value)} transparent opacity={0.62} /></mesh> })}
        <GroundTiles
          tiles={tiles}
          onSelect={handleSelect}
          allowDragSelect={false}
          hoverControllerRef={
            hoverControllerRef
          }
        />

        {/* Placed buildings */}

        {buildings.map((b) => {
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
          timeStage={
            state?.timeStage === "DAY"
              ? "DAY"
              : "NIGHT"
          }
        />

        <SelectionIndicator
          ref={hoverControllerRef}
          tiles={tiles}
          tool={tool}
          selectedBuilding={selectedBuilding}
          rotation={buildRotation}
          editingBuilding={editingBuilding}
          editingRotation={editingRotation}
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
