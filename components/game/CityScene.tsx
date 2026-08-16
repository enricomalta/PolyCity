"use client"

import {
  Suspense,
  useEffect,
  useMemo,
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
/**
 * The full 3D city. It reads authoritative state from the game store and
 * turns pointer interactions into INTENTIONS (build/demolish/select) that the
 * store forwards to the service. The scene never mutates game state directly.
 *
 * Rendering is intentionally dependency-free (no remote HDR environment maps)
 * so the canvas can never blank out waiting on a network fetch.
 */
export function CityScene() {
  const {
    tiles,
    state,

    tool,
    selectedBuilding,

    hoveredTile,
    selectedTile,

    buildRotation,

    setHoveredTile,
    selectTile,

    build,
    demolish,

    rotateBuilding,
  } = useGame()

  const buildings =
    state?.buildings ?? []

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
  // Hover validity
  // ---------------------------------------------------------------------------

  const hoverValid =
    useMemo(() => {
      if (!hoveredTile) {
        return false
      }

      const tile =
        tiles[hoveredTile.x]?.[
          hoveredTile.z
        ]

      if (tool === "DEMOLISH") {
        return Boolean(
          tile?.occupiedBy,
        )
      }

      return canPlace(tile)
    }, [
      hoveredTile,
      tiles,
      tool,
    ])

  // ---------------------------------------------------------------------------
  // Tile interaction
  // ---------------------------------------------------------------------------

  function handleSelect(
    x: number,
    z: number,
  ) {
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
  }

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
          onHover={(x, z) =>
            setHoveredTile({
              x,
              z,
            })
          }
          onLeave={() =>
            setHoveredTile(null)
          }
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

          if (
            b.type === "ROAD"
          ) {
            return (
              <Road
                key={b.id}
                position={position}
                rotation={
                  b.rotation
                }
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
          hovered={hoveredTile}
          selected={selectedTile}
          tool={tool}
          selectedBuilding={
            selectedBuilding
          }
          valid={hoverValid}
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