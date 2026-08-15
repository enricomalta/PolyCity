"use client"

import { useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, Sky } from "@react-three/drei"
import { CAMERA, TILE_SIZE, tileToWorld } from "@/lib/game/constants"
import { canPlace } from "@/lib/game/grid"
import { useGame } from "@/hooks/useGame"
import { Building } from "./Building"
import { Road } from "./Road"
import { GroundTiles } from "./GroundTiles"
import { SelectionIndicator } from "./SelectionIndicator"

/**
 * The full 3D city. It reads authoritative state from the game store and
 * turns pointer interactions into INTENTIONS (build/demolish/select) that the
 * store forwards to the service. The scene never mutates game state directly.
 */
export function CityScene() {
  const {
    tiles,
    state,
    tool,
    selectedBuilding,
    hoveredTile,
    selectedTile,
    setHoveredTile,
    selectTile,
    build,
    demolish,
  } = useGame()

  const buildings = state?.buildings ?? []

  // Validity of the currently hovered tile, used to color the preview.
  const hoverValid = useMemo(() => {
    if (!hoveredTile) return false
    const tile = tiles[hoveredTile.x]?.[hoveredTile.z]
    if (tool === "DEMOLISH") return Boolean(tile?.occupiedBy)
    return canPlace(tile)
  }, [hoveredTile, tiles, tool])

  function handleSelect(x: number, z: number) {
    const tile = tiles[x]?.[z]
    if (tool === "DEMOLISH") {
      if (tile?.occupiedBy) void demolish(x, z)
      return
    }
    if ((tool === "BUILD" || tool === "ROAD") && selectedBuilding) {
      if (canPlace(tile)) void build(x, z, selectedBuilding, 0)
      return
    }
    // SELECT mode: mark the tile for the inspector panel.
    selectTile({ x, z })
  }

  return (
    <Canvas
      shadows
      camera={{ position: CAMERA.initialPosition, fov: CAMERA.fov }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#2b3550"]} />
      <fog attach="fog" args={["#2b3550", 45, 90]} />

      <Sky sunPosition={[40, 30, 20]} turbidity={6} rayleigh={1.2} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[18, 26, 12]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <Environment preset="city" />

      <GroundTiles
        tiles={tiles}
        onHover={(x, z) => setHoveredTile({ x, z })}
        onLeave={() => setHoveredTile(null)}
        onSelect={handleSelect}
      />

      {/* Placed buildings */}
      {buildings.map((b) => {
        const position: [number, number, number] = [tileToWorld(b.x), 0, tileToWorld(b.z)]
        if (b.type === "ROAD") return <Road key={b.id} position={position} />
        return <Building key={b.id} type={b.type} position={position} rotation={b.rotation} />
      })}

      <SelectionIndicator
        hovered={hoveredTile}
        selected={selectedTile}
        tool={tool}
        selectedBuilding={selectedBuilding}
        valid={hoverValid}
      />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={TILE_SIZE * 40}
        blur={2}
        far={10}
      />

      <OrbitControls
        makeDefault
        enablePan
        panSpeed={CAMERA.panSpeed}
        minDistance={CAMERA.minDistance}
        maxDistance={CAMERA.maxDistance}
        minPolarAngle={CAMERA.minPolarAngle}
        maxPolarAngle={CAMERA.maxPolarAngle}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
