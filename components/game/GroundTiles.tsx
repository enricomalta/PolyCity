"use client"

import { useMemo, useRef } from "react"
import type { ThreeEvent } from "@react-three/fiber"
import type { Tile } from "@/types/game"
import { GRID_SIZE, TILE_SIZE, tileToWorld } from "@/lib/game/constants"
import { Tree } from "./Tree"

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

  // Water, sand, rocks and forest are painted on top of the grass base from
  // the procedural terrain data. Forest trees are skipped on occupied tiles so
  // they visually "clear" when the player builds there.
  const decor = useMemo(() => {
    const water: [number, number][] = []
    const sand: [number, number][] = []
    const rock: [number, number][] = []
    const forest: [number, number][] = []
    for (const row of tiles) {
      for (const tile of row) {
        if (tile.terrain === "WATER") water.push([tile.x, tile.z])
        else if (tile.terrain === "SAND") sand.push([tile.x, tile.z])
        else if (tile.terrain === "ROCK") rock.push([tile.x, tile.z])
        else if (tile.terrain === "FOREST" && !tile.occupiedBy) forest.push([tile.x, tile.z])
      }
    }
    return { water, sand, rock, forest }
  }, [tiles])

  function coordFromPoint(e: ThreeEvent<PointerEvent>): [number, number] | null {
    const x = Math.floor((e.point.x + half) / TILE_SIZE)
    const z = Math.floor((e.point.z + half) / TILE_SIZE)
    if (x < 0 || z < 0 || x >= GRID_SIZE || z >= GRID_SIZE) return null
    return [x, z]
  }

  // Screen position where the current pointer press started. Used to tell a
  // deliberate "tap" (build/select/demolish) apart from a camera drag: if the
  // pointer barely moved between down and up, it's a tap; otherwise the user
  // was orbiting/panning the camera and we must NOT act on the tile.
  const pressRef = useRef<{ x: number; y: number } | null>(null)
  const hoverTileRef = useRef<[number, number] | null>(null)
  const TAP_THRESHOLD_SQ = 36 // 6px of travel

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

      {/* Sand / shoreline tiles */}
      {decor.sand.map(([x, z]) => (
        <mesh
          key={`s-${x}-${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[tileToWorld(x), 0.008, tileToWorld(z)]}
        >
          <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
          <meshStandardMaterial color="#d9c48c" />
        </mesh>
      ))}

      {/* Forest tiles: a low-poly tree marks the woodland */}
      {decor.forest.map(([x, z]) => (
        <Tree key={`f-${x}-${z}`} position={[tileToWorld(x), 0, tileToWorld(z)]} scale={0.9} />
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

            if (!coord) {
                if (hoverTileRef.current !== null) {
                    hoverTileRef.current = null
                    onLeave()
                }

                return
            }

            const [x, z] = coord
            const current = hoverTileRef.current

            if (current?.[0] === x && current?.[1] === z) {
                return
            }

            hoverTileRef.current = [x, z]
            onHover(x, z)
        }}
        onPointerOut={() => {
            if (hoverTileRef.current !== null) {
                hoverTileRef.current = null
                onLeave()
            }
        }}
        onPointerDown={(e) => {
          pressRef.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
        }}
        onPointerUp={(e) => {
          const start = pressRef.current
          pressRef.current = null
          if (!start) return
          const dx = e.nativeEvent.clientX - start.x
          const dy = e.nativeEvent.clientY - start.y
          // The press turned into a camera drag: ignore it.
          if (dx * dx + dy * dy > TAP_THRESHOLD_SQ) return
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
