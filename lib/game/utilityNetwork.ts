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
  // A rede de saneamento tem duas fontes distintas: a estação trata o
  // esgoto, enquanto a caixa d'água produz água. Ambas devem ativar o mesmo
  // fluxo, sem obrigar uma fonte a estar conectada à outra.
  const sourceTypes = type === "ELECTRIC_GRID"
    ? new Set(["POWER_PLANT"])
    : new Set(["SEWAGE_TREATMENT_PLANT", "WATER_TOWER"])
  const sourceSeeds = buildings.filter((b) => sourceTypes.has(b.type)).flatMap((b) =>
    DIRECTIONS.map(([dx, dz]) => key(b.x + dx, b.z + dz)),
  )
  const edgeTiles = flood(utilities, edgeSeeds)
  const sourceTiles = flood(utilities, sourceSeeds)
  return { tiles: new Set([...edgeTiles, ...sourceTiles]), edgeTiles, sourceTiles }
}

export function getUtilityNetwork(buildings: Building[], type: UtilityType) {
  return getUtilityFlow(buildings, type).tiles
}

function componentFromTiles(buildings: Building[], building: Building, tiles: Set<string>) {
  const utilities = new Set(buildings.filter((b) => b.type === "ELECTRIC_GRID" || b.type === "SEWER_NETWORK").map((b) => key(b.x, b.z)))
  const attachedTile = DIRECTIONS
    .map(([dx, dz]) => key(building.x + dx, building.z + dz))
    .find((position) => tiles.has(position) && utilities.has(position))

  if (!attachedTile) return null
  return flood(utilities, [attachedTile])
}

export function getBuildingUtilityComponent(buildings: Building[], building: Building, type: UtilityType) {
  return componentFromTiles(buildings, building, getUtilityFlow(buildings, type).tiles)
}

// Produtores precisam ser classificados pela rede que realmente os alimenta,
// não pela primeira rede encontrada ao redor. Isso impede que uma rede da borda
// "empreste" o produtor de um bairro isolado.
export function getBuildingSourceComponent(buildings: Building[], building: Building, type: UtilityType) {
  return componentFromTiles(buildings, building, getUtilityFlow(buildings, type).sourceTiles)
}

export function hasBuildingUtility(buildings: Building[], building: Building, type: UtilityType) {
  return getBuildingUtilityComponent(buildings, building, type) !== null
}

export function hasBuildingUtilityToEdge(buildings: Building[], building: Building, type: UtilityType) {
  const flow = getUtilityFlow(buildings, type)
  const component = getBuildingUtilityComponent(buildings, building, type)
  return component !== null && [...component].some((position) => flow.edgeTiles.has(position))
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
