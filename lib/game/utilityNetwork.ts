import type { Building } from "@/types/city"

export type UtilityType = "ELECTRIC_GRID" | "SEWER_NETWORK"

const key = (x: number, z: number) => `${x}:${z}`

function isRoad(building: Building) {
  return building.type === "ROAD" && !building.closed && building.roadCondition !== "CLOSED" && building.maintenance?.status !== "CLOSED"
}

const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const
const MAP_SIZE = 32

function flood(utilities: Set<string>, seeds: Iterable<string>) {
  const connected = new Set<string>()
  const queue = [...seeds]
  while (queue.length) {
    const current = queue.shift()!
    if (!utilities.has(current) || connected.has(current)) continue
    connected.add(current)
    const [x, z] = current.split(":").map(Number)
    for (const [dx, dz] of DIRECTIONS) queue.push(key(x + dx, z + dz))
  }
  return connected
}

export interface UtilityFlow {
  tiles: Set<string>
  edgeTiles: Set<string>
  sourceTiles: Set<string>
}

export function getUtilityFlow(buildings: Building[], type: UtilityType): UtilityFlow {
  const utilities = new Set(buildings.filter((b) => b.type === type).map((b) => key(b.x, b.z)))
  const edgeSeeds = [...utilities].filter((position) => {
    const [x, z] = position.split(":").map(Number)
    return x === 0 || z === 0 || x === MAP_SIZE - 1 || z === MAP_SIZE - 1
  })
  const sourceType = type === "ELECTRIC_GRID" ? "POWER_PLANT" : "SEWAGE_TREATMENT_PLANT"
  const sourceSeeds = buildings.filter((b) => b.type === sourceType).flatMap((b) =>
    DIRECTIONS.map(([dx, dz]) => key(b.x + dx, b.z + dz)),
  )
  const edgeTiles = flood(utilities, edgeSeeds)
  const sourceTiles = flood(utilities, sourceSeeds)
  return { tiles: new Set([...edgeTiles, ...sourceTiles]), edgeTiles, sourceTiles }
}

export function getUtilityNetwork(buildings: Building[], type: UtilityType) {
  return getUtilityFlow(buildings, type).tiles
}

export function hasBuildingUtility(buildings: Building[], building: Building, type: UtilityType) {
  const flow = getUtilityFlow(buildings, type)
  return DIRECTIONS.some(([dx, dz]) => flow.tiles.has(key(building.x + dx, building.z + dz)))
}

export function hasBuildingUtilityToEdge(buildings: Building[], building: Building, type: UtilityType) {
  const flow = getUtilityFlow(buildings, type)
  return DIRECTIONS.some(([dx, dz]) => flow.edgeTiles.has(key(building.x + dx, building.z + dz)))
}

export function isUtilityConnected(buildings: Building[], x: number, z: number, type: UtilityType) {
  return getUtilityNetwork(buildings, type).has(key(x, z))
}

export function utilityDirection(buildings: Building[], x: number, z: number, type: UtilityType) {
  const connected = getUtilityNetwork(buildings, type)
  const neighbors = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const
  return neighbors.filter(([dx, dz]) => connected.has(key(x + dx, z + dz)))
}

export { key as utilityKey }
