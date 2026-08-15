import type { Building } from "@/types/city"
import type { Tile, TerrainType } from "@/types/game"
import { GRID_SIZE } from "./constants"

// Deterministic pseudo-random so the terrain looks the same every load
// without pulling in a dependency. Used only for visuals; the backend will
// eventually own the real terrain.
function hash(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return n - Math.floor(n)
}

export function generateTerrain(size = GRID_SIZE): Tile[][] {
  const tiles: Tile[][] = []
  for (let x = 0; x < size; x++) {
    const row: Tile[] = []
    for (let z = 0; z < size; z++) {
      // a small pond in one corner + occasional rocks, everything else grass
      const inPond = x < 5 && z > size - 6 && hash(x, z) > 0.35
      const isRock = !inPond && hash(x * 2.3, z * 1.7) > 0.94
      const terrain: TerrainType = inPond ? "WATER" : isRock ? "ROCK" : "GRASS"
      row.push({ x, z, terrain, occupiedBy: null })
    }
    tiles.push(row)
  }
  return tiles
}

export function isInBounds(x: number, z: number, size = GRID_SIZE): boolean {
  return x >= 0 && z >= 0 && x < size && z < size
}

// Rebuild an occupancy map from the authoritative building list.
export function applyOccupancy(tiles: Tile[][], buildings: Building[]): Tile[][] {
  const next = tiles.map((row) => row.map((t) => ({ ...t, occupiedBy: null as string | null })))
  for (const b of buildings) {
    if (isInBounds(b.x, b.z) && next[b.x][b.z]) {
      next[b.x][b.z].occupiedBy = b.id
    }
  }
  return next
}

// Client-side validity check used only to gate the preview and avoid sending
// obviously invalid actions. The backend remains the final authority.
export function canPlace(tile: Tile | undefined): boolean {
  if (!tile) return false
  if (tile.terrain === "WATER") return false
  if (tile.occupiedBy) return false
  return true
}
