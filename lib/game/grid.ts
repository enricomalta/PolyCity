import type { Building } from "@/types/city"
import type { Tile, TerrainType } from "@/types/game"
import { GRID_SIZE } from "./constants"

// ---------------------------------------------------------------------------
// Procedural world generation.
//
// The whole map is generated from a single integer `seed`. The same seed
// always reproduces the exact same terrain, so the backend only has to store
// the seed and both server and client can regenerate the identical world.
// ---------------------------------------------------------------------------

// Deterministic hash in [0,1) from three integers (coords + seed).
function hash2(x: number, z: number, seed: number): number {
  let h = x * 374761393 + z * 668265263 + seed * 2246822519
  h = (h ^ (h >>> 13)) >>> 0
  h = Math.imul(h, 1274126177) >>> 0
  return (h ^ (h >>> 16)) >>> 0 // 0..2^32
}

function rand2(x: number, z: number, seed: number): number {
  return hash2(x, z, seed) / 4294967296
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

// Value noise: bilinear-interpolated random lattice, in [0,1].
function valueNoise(x: number, z: number, seed: number): number {
  const x0 = Math.floor(x)
  const z0 = Math.floor(z)
  const fx = smooth(x - x0)
  const fz = smooth(z - z0)
  const v00 = rand2(x0, z0, seed)
  const v10 = rand2(x0 + 1, z0, seed)
  const v01 = rand2(x0, z0 + 1, seed)
  const v11 = rand2(x0 + 1, z0 + 1, seed)
  const top = v00 + (v10 - v00) * fx
  const bottom = v01 + (v11 - v01) * fx
  return top + (bottom - top) * fz
}

// Fractal noise (a few octaves) for more natural-looking features.
function fbm(x: number, z: number, seed: number): number {
  let amp = 0.6
  let freq = 1
  let sum = 0
  let norm = 0
  for (let o = 0; o < 4; o++) {
    sum += valueNoise(x * freq, z * freq, seed + o * 1013) * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

// Turn a seed into a full terrain grid. Elevation carves lakes and rocky
// highlands; moisture turns wetter grassland into forest; shorelines become
// sand. Everything else is buildable grass.
export function generateTerrain(seed = 1, size = GRID_SIZE): Tile[][] {
  const scale = 6.5 // larger => bigger, smoother features
  const tiles: Tile[][] = []
  for (let x = 0; x < size; x++) {
    const row: Tile[] = []
    for (let z = 0; z < size; z++) {
      const nx = x / scale
      const nz = z / scale
      const elevation = fbm(nx, nz, seed)
      const moisture = fbm(nx + 100, nz + 100, seed ^ 0x9e3779b9)

      let terrain: TerrainType
      if (elevation < 0.34) {
        terrain = "WATER"
      } else if (elevation < 0.38) {
        terrain = "SAND"
      } else if (elevation > 0.74) {
        terrain = "ROCK"
      } else if (moisture > 0.62 && elevation < 0.62) {
        terrain = "FOREST"
      } else {
        terrain = "GRASS"
      }
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

// Whether a building may be placed on a tile. WATER and ROCK are natural
// obstacles; forest/sand/grass are buildable (trees get cleared). Used for
// client previews AND by the backend as the authoritative rule.
export function canPlace(tile: Tile | undefined): boolean {
  if (!tile) return false
  if (tile.terrain === "WATER" || tile.terrain === "ROCK") return false
  if (tile.occupiedBy) return false
  return true
}
