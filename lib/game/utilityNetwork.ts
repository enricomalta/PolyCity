import type { Building } from "@/types/city"
import { areRoadsConnected } from "./roadAutoTile"


export type UtilityType = "ELECTRIC_GRID" | "SEWER_NETWORK"

const key = (x: number, z: number) => `${x}:${z}`

function isRoad(building: Building) {
  return building.type === "ROAD" && !building.closed && building.roadCondition !== "CLOSED" && building.maintenance?.status !== "CLOSED"
}

export function getUtilityNetwork(buildings: Building[], type: UtilityType): Set<string> {
  const roads = new Set(buildings.filter(isRoad).map((building) => key(building.x, building.z)))
  const utilities = new Set(buildings.filter((building) => building.type === type).map((building) => key(building.x, building.z)))
  const connected = new Set<string>()
  const queue: string[] = []

  for (const position of utilities) {
    const [x, z] = position.split(":").map(Number)
    if (x === 0 || z === 0 || x === 31 || z === 31) {
      connected.add(position)
      queue.push(position)
    }
  }

  const sourceType = type === "ELECTRIC_GRID" ? "POWER_PLANT" : "SEWAGE_TREATMENT_PLANT"
  for (const building of buildings) {
    if (building.type !== sourceType) continue
    for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const position = key(building.x + dx, building.z + dz)
      if ((utilities.has(position) || roads.has(position)) && !connected.has(position)) {
        connected.add(position)
        queue.push(position)
      }
    }
  }

  while (queue.length) {
    const current = queue.shift()!
    const [x, z] = current.split(":").map(Number)
    const currentIsRoad = roads.has(current)

    for (const [nextX, nextZ] of [[x, z - 1], [x + 1, z], [x, z + 1], [x - 1, z]]) {
      const next = key(nextX, nextZ)
      const roadsAreConnected = !currentIsRoad || !roads.has(next) || areRoadsConnected(x, z, nextX, nextZ, roads)

      if (roadsAreConnected && (utilities.has(next) || roads.has(next)) && !connected.has(next)) {
        connected.add(next)
        queue.push(next)
      }
    }
  }

  return connected
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
