"use client"

import { useMemo } from "react"
import type { ThreeEvent } from "@react-three/fiber"
import type { Tile } from "@/types/game"
import { GRID_SIZE, TILE_SIZE, tileToWorld } from "@/lib/game/constants"

interface GroundTilesProps {
  tiles: Tile[][]
  onHover: (x: number, z: number) => void
  onLeave: () => void
  onSelect: (x: number, z: number) => void
}

/**
 * The base terrain: a grass plane, a soil rim for depth, a grid overlay, and
 * a single large invisible picking plane. We derive the tile coordinate from
 * the pointer's world position instead of rendering thousands of meshes, which
 * keeps the scene light even on a 30x30 grid.
 */
export function GroundTiles({ tiles, onHover, onLeave, onSelect }: GroundTilesProps) {
  const worldSize = GRID_SIZE * TILE_SIZE
  const half = worldSize / 2

  // Ponds and rocks are painted on top of the grass base from terrain data.
  const decor = useMemo(() => {
    const water: [number, number][] = []
    const rock: [number, number][] = []
    for (const row of tiles) {
      for (const tile of row) {
        if (tile.terrain === "WATER") water.push([tile.x, tile.z])
        else if (tile.terrain === "ROCK") rock.push([tile.x, tile.z])
      }
    }
    return { water, rock }
  }, [tiles])

  function coordFromPoint(e: ThreeEvent<PointerEvent>): [number, number] | null {
    const x = Math.floor((e.point.x + half) / TILE_SIZE)
    const z = Math.floor((e.point.z + half) / TILE_SIZE)
    if (x < 0 || z < 0 || x >= GRID_SIZE || z >= GRID_SIZE) return null
    return [x, z]
  }

  return (
    <group>
      {/* Grass base */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[worldSize, worldSize]} />
        <meshStandardMaterial color="#5a8f4e" />
      </mesh>

      {/* Grid overlay */}
      <gridHelper args={[worldSize, GRID_SIZE, "#3f6b39", "#4a7a42"]} position={[0, 0.002, 0]} />

      {/* Soil rim around the plot for depth */}
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[worldSize, 0.7, worldSize]} />
        <meshStandardMaterial color="#6b4a33" />
      </mesh>

      {/* Water tiles */}
      {decor.water.map(([x, z]) => (
        <mesh
          key={`w-${x}-${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[tileToWorld(x), 0.012, tileToWorld(z)]}
        >
          <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
          <meshStandardMaterial color="#3f8fb0" />
        </mesh>
      ))}

      {/* Rock tiles */}
      {decor.rock.map(([x, z]) => (
        <mesh
          key={`r-${x}-${z}`}
          castShadow
          receiveShadow
          position={[tileToWorld(x), 0.12, tileToWorld(z)]}
        >
          <dodecahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#8a8f96" flatShading />
        </mesh>
      ))}

      {/* Single invisible picking plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        onPointerMove={(e) => {
          e.stopPropagation()
          const coord = coordFromPoint(e)
          if (coord) onHover(coord[0], coord[1])
          else onLeave()
        }}
        onPointerOut={() => onLeave()}
        onClick={(e) => {
          e.stopPropagation()
          const coord = coordFromPoint(e)
          if (coord) onSelect(coord[0], coord[1])
        }}
      >
        <planeGeometry args={[worldSize, worldSize]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
