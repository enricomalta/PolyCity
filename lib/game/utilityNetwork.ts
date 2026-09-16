import type { Building } from "@/types/city"

export type UtilityType = "ELECTRIC_GRID" | "SEWER_NETWORK"

const key = (x: number, z: number) => `${x}:${z}`

function isRoad(building: Building) {
  return building.type === "ROAD" && !building.closed && building.roadCondition !== "CLOSED" && building.maintenance?.status !== "CLOSED"
}

export function getUtilityNetwork(buildings: Building[], type: UtilityType): Set<string> {
  // A road is only the surface where a utility tile may be placed. It is not
  // itself a utility conductor: otherwise an empty road tile bridges two
  // otherwise disconnected sections of the network.
  const utilities = new Set(
    buildings
      .filter((building) => building.type === type)
      .map((building) => key(building.x, building.z)),
  )
  const connected = new Set<string>()
  const queue: string[] = []

  const enqueue = (position: string) => {
    if (!utilities.has(position) || connected.has(position)) return
    connected.add(position)
    queue.push(position)
  }

  // A utility can import service from the map edge, but only through a
  // continuous sequence of utility tiles.
  for (const position of utilities) {
    const [x, z] = position.split(":").map(Number)
    if (x === 0 || z === 0 || x === 31 || z === 31) enqueue(position)
  }

  const sourceType = type === "ELECTRIC_GRID" ? "POWER_PLANT" : "SEWAGE_TREATMENT_PLANT"
  for (const building of buildings) {
    if (building.type !== sourceType) continue
    for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      enqueue(key(building.x + dx, building.z + dz))
    }
  }

  while (queue.length) {
    const current = queue.shift()!
    const [x, z] = current.split(":").map(Number)

    for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      enqueue(key(x + dx, z + dz))
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
