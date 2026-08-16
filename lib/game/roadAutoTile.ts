import type { Building } from "@/types/city"

export const ROAD_N = 1
export const ROAD_E = 2
export const ROAD_S = 4
export const ROAD_W = 8

export type RoadConnectionMask = number

export type RoadShape =
  | "ISOLATED"
  | "END"
  | "STRAIGHT"
  | "CURVE"
  | "T"
  | "CROSS"

export interface RoadAutoTile {
  mask: RoadConnectionMask
  shape: RoadShape
  rotation: number
}

function key(x: number, z: number): string {
  return `${x}:${z}`
}

export function createRoadSet(
  buildings: Building[],
): Set<string> {
  const roads = new Set<string>()

  for (const building of buildings) {
    if (building.type !== "ROAD") {
      continue
    }

    roads.add(key(building.x, building.z))
  }

  return roads
}

export function getRoadConnectionMask(
  x: number,
  z: number,
  roads: Set<string>,
): RoadConnectionMask {
  let mask = 0

  if (roads.has(key(x, z - 1))) {
    mask |= ROAD_N
  }

  if (roads.has(key(x + 1, z))) {
    mask |= ROAD_E
  }

  if (roads.has(key(x, z + 1))) {
    mask |= ROAD_S
  }

  if (roads.has(key(x - 1, z))) {
    mask |= ROAD_W
  }

  return mask
}

export function getRoadShape(
  mask: RoadConnectionMask,
): RoadShape {
  if (mask === 0) {
    return "ISOLATED"
  }

  const connections = countConnections(mask)

  if (connections === 1) {
    return "END"
  }

  if (connections === 2) {
    const straight =
      mask === (ROAD_N | ROAD_S) ||
      mask === (ROAD_E | ROAD_W)

    return straight ? "STRAIGHT" : "CURVE"
  }

  if (connections === 3) {
    return "T"
  }

  return "CROSS"
}

export function countConnections(
  mask: RoadConnectionMask,
): number {
  let count = 0

  if (mask & ROAD_N) count++
  if (mask & ROAD_E) count++
  if (mask & ROAD_S) count++
  if (mask & ROAD_W) count++

  return count
}

export function getRoadAutoTile(
  x: number,
  z: number,
  roads: Set<string>,
): RoadAutoTile {
  const mask = getRoadConnectionMask(
    x,
    z,
    roads,
  )

  return {
    mask,
    shape: getRoadShape(mask),
    rotation: getRoadRotation(mask),
  }
}

function getRoadRotation(
  mask: RoadConnectionMask,
): number {
  switch (mask) {
    // END
    case ROAD_N:
      return 0

    case ROAD_E:
      return 1

    case ROAD_S:
      return 2

    case ROAD_W:
      return 3

    // CURVE
    case ROAD_N | ROAD_E:
      return 0

    case ROAD_E | ROAD_S:
      return 1

    case ROAD_S | ROAD_W:
      return 2

    case ROAD_W | ROAD_N:
      return 3

    // STRAIGHT
    case ROAD_N | ROAD_S:
      return 0

    case ROAD_E | ROAD_W:
      return 1

    // T
    case ROAD_N | ROAD_E | ROAD_S:
      return 0

    case ROAD_E | ROAD_S | ROAD_W:
      return 1

    case ROAD_S | ROAD_W | ROAD_N:
      return 2

    case ROAD_W | ROAD_N | ROAD_E:
      return 3

    // CROSS
    case ROAD_N | ROAD_E | ROAD_S | ROAD_W:
      return 0

    default:
      return 0
  }
}