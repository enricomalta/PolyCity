"use client"

import type { BuildingType, ToolMode } from "@/types/game"
import { TILE_SIZE, tileToWorld } from "@/lib/game/constants"
import { getBuilding } from "@/lib/game/buildings"

interface Coord {
  x: number
  z: number
}

// Visual feedback for the cursor: a tile highlight (green=valid, red=invalid),
// a ghost preview of the armed building, and a marker on the selected tile.
export function SelectionIndicator({
  hovered,
  selected,
  tool,
  selectedBuilding,
  valid,
}: {
  hovered: Coord | null
  selected: Coord | null
  tool: ToolMode
  selectedBuilding: BuildingType | null
  valid: boolean
}) {
  const isBuilding = tool === "BUILD" || tool === "ROAD"
  const highlight = valid ? "#4ade80" : "#f87171"

  return (
    <group>
      {hovered && (
        <group position={[tileToWorld(hovered.x), 0, tileToWorld(hovered.z)]}>
          {/* tile footprint highlight */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
            <meshBasicMaterial color={highlight} transparent opacity={0.35} />
          </mesh>

          {/* ghost preview of the building being placed */}
          {isBuilding && selectedBuilding && (
            <mesh position={[0, getBuilding(selectedBuilding).height / 2 + 0.03, 0]}>
              <boxGeometry
                args={[0.75, Math.max(0.1, getBuilding(selectedBuilding).height), 0.75]}
              />
              <meshStandardMaterial
                color={valid ? getBuilding(selectedBuilding).color : "#f87171"}
                transparent
                opacity={0.5}
                flatShading
              />
            </mesh>
          )}

          {/* demolish marker */}
          {tool === "DEMOLISH" && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.3, 0.42, 6]} />
              <meshBasicMaterial color="#f87171" transparent opacity={0.8} />
            </mesh>
          )}
        </group>
      )}

      {selected && tool === "SELECT" && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[tileToWorld(selected.x), 0.03, tileToWorld(selected.z)]}
        >
          <ringGeometry args={[0.36, 0.46, 24]} />
          <meshBasicMaterial color="#34d0a0" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  )
}
