"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo
} from "react"

import { Canvas } from "@react-three/fiber"

import {
  OrbitControls,
  ContactShadows,
} from "@react-three/drei"

import {
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

import { Building } from "./Building"
import { Road } from "./Road"
import { GroundTiles } from "./GroundTiles"
import { SelectionIndicator } from "./SelectionIndicator"
import { CameraController } from "./CameraController"
import { PerformanceMonitor } from "./PerformanceMonitor"

import { createRoadSet } from "@/lib/game/roadAutoTile"
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

    setHoveredTile,
    selectTile,

    build,
    demolish,

    rotateBuilding,
  } = useGame()

  const buildings =
    state?.buildings ?? []

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

      if (!selectedBuilding) {
        return
      }

      if (
        tool !== "BUILD" &&
        tool !== "ROAD"
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
    tool,
    rotateBuilding,
  ])

  // ---------------------------------------------------------------------------
  // Tile interaction
  //
  // Memoizados com useCallback para que GroundTiles não receba novas
  // referências de handler a cada render de CityScene (ex.: quando `state`
  // muda após um build/demolish).
  // ---------------------------------------------------------------------------

  const handleHover = useCallback(
    (x: number, z: number) => {
      setHoveredTile({ x, z })
    },
    [setHoveredTile],
  )

  const handleLeave = useCallback(() => {
    setHoveredTile(null)
  }, [setHoveredTile])

  const handleSelect = useCallback(
    (x: number, z: number) => {
      const tile =
        tiles[x]?.[z]

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
      selectedBuilding,
      buildRotation,
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
        args={["#9fc9e8"]}
      />

      <fog
        attach="fog"
        args={[
          "#9fc9e8",
          55,
          120,
        ]}
      />

      <ambientLight
        intensity={0.75}
      />

      <hemisphereLight
        args={[
          "#dcefff",
          "#4a6b3a",
          0.7,
        ]}
      />

      <directionalLight
        position={[
          18,
          28,
          12,
        ]}
        intensity={1.5}
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
        <GroundTiles
          tiles={tiles}
          onHover={handleHover}
          onLeave={handleLeave}
          onSelect={handleSelect}
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
            <Building
              key={b.id}
              type={b.type}
              position={position}
              rotation={
                b.rotation
              }
            />
          )
        })}

        <SelectionIndicator
          tiles={tiles}
          tool={tool}
          selectedBuilding={
            selectedBuilding
          }
          rotation={buildRotation}
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