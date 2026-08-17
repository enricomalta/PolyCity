import type { Building } from "@/types/city"
import { getBuilding } from "./buildings"
import {
  createRoadSet,
  getRoadAutoTile,
  ROAD_N,
  ROAD_E,
  ROAD_S,
  ROAD_W,
} from "./roadAutoTile"
import { GRID_SIZE } from "./constants"

// ---------------------------------------------------------------------------
// Rede viária: pontos de entrada/saída da cidade (rodovias END que tocam a
// borda do mapa) e casas vagas alcançáveis a partir delas.
//
// Isomórfico: roda tanto no cliente (pra animar os carros do TrafficSystem)
// quanto no servidor (pra validar a ação OCCUPY antes de aceitar). A mesma
// regra de conectividade vale nos dois lados — igual economy.ts já faz para
// o dinheiro/população, aqui é o mesmo princípio aplicado à malha viária.
// ---------------------------------------------------------------------------

export interface Coord {
  x: number
  z: number
}

export interface SpawnPoint extends Coord {
  // Primeiro tile de rua para dentro da cidade a partir da rodovia de borda.
  intoX: number
  intoZ: number
}

export interface VacantHouse extends Coord {
  buildingId: string
  // Tile de rua adjacente por onde o carro chega até a casa.
  roadX: number
  roadZ: number
}

function tileKey(x: number, z: number): string {
  return `${x}:${z}`
}

function neighbors4(
  x: number,
  z: number,
): Coord[] {
  return [
    { x, z: z - 1 },
    { x: x + 1, z },
    { x, z: z + 1 },
    { x: x - 1, z },
  ]
}

function openNeighbor(
  x: number,
  z: number,
  mask: number,
): Coord | null {
  if (mask === ROAD_N) return { x, z: z - 1 }
  if (mask === ROAD_E) return { x: x + 1, z }
  if (mask === ROAD_S) return { x, z: z + 1 }
  if (mask === ROAD_W) return { x: x - 1, z }
  return null
}

// Toda rodovia (shape END, edgeExit) que toca a borda do mapa — é por ali
// que os NPCs vão "entrar dirigindo" na cidade.
export function findSpawnPoints(
  buildings: Building[],
): SpawnPoint[] {
  const roads = createRoadSet(buildings)
  const points: SpawnPoint[] = []

  for (const b of buildings) {
    if (b.type !== "ROAD") continue

    const autoTile = getRoadAutoTile(
      b.x,
      b.z,
      roads,
    )

    if (autoTile.shape !== "END") {
      continue
    }

    const isMapEdge =
      b.x === 0 ||
      b.x === GRID_SIZE - 1 ||
      b.z === 0 ||
      b.z === GRID_SIZE - 1

    if (!isMapEdge) {
      continue
    }

    const into = openNeighbor(
      b.x,
      b.z,
      autoTile.mask,
    )

    if (into) {
      points.push({
        x: b.x,
        z: b.z,
        intoX: into.x,
        intoZ: into.z,
      })
    }
  }

  return points
}

// BFS a partir de todos os pontos de entrada, andando só por tiles de rua.
// Retorna o conjunto de tiles de rua alcançáveis a partir da borda do mapa.
export function reachableRoadTiles(
  buildings: Building[],
): Set<string> {
  const roads = createRoadSet(buildings)
  const spawns = findSpawnPoints(buildings)

  const visited = new Set<string>()
  const queue: Coord[] = []

  for (const s of spawns) {
    const k = tileKey(s.intoX, s.intoZ)
    if (roads.has(k) && !visited.has(k)) {
      visited.add(k)
      queue.push({ x: s.intoX, z: s.intoZ })
    }
  }

  let head = 0
  while (head < queue.length) {
    const cur = queue[head]
    head += 1

    for (const n of neighbors4(cur.x, cur.z)) {
      const k = tileKey(n.x, n.z)
      if (roads.has(k) && !visited.has(k)) {
        visited.add(k)
        queue.push(n)
      }
    }
  }

  return visited
}

// Casas RESIDENTIAL vagas que têm pelo menos um vizinho de rua alcançável a
// partir da borda do mapa — ou seja, um carro consegue chegar até elas.
export function findVacantConnectedHouses(
  buildings: Building[],
): VacantHouse[] {
  const reachable = reachableRoadTiles(buildings)
  const result: VacantHouse[] = []

  for (const b of buildings) {
    // Casas ocupadas ou fechadas não podem receber novos moradores.
    if (b.occupied) continue
    if (b.closed) continue

    const def = getBuilding(b.type)
    if (def.category !== "RESIDENTIAL") continue

    for (const n of neighbors4(b.x, b.z)) {
      if (reachable.has(tileKey(n.x, n.z))) {
        result.push({
          x: b.x,
          z: b.z,
          buildingId: b.id,
          roadX: n.x,
          roadZ: n.z,
        })
        break
      }
    }
  }

  return result
}

// Usado pelo servidor para validar um pedido de OCCUPY: precisa existir uma
// casa residencial vaga em (x,z) alcançável pela rede viária a partir de
// alguma rodovia que toque a borda do mapa. Nunca confia na palavra do
// cliente de que "o carro chegou".
export function isHouseReachable(
  x: number,
  z: number,
  buildings: Building[],
): boolean {
  return findVacantConnectedHouses(
    buildings,
  ).some((h) => h.x === x && h.z === z)
}

// BFS de menor caminho entre dois tiles de rua — usado pelo cliente pra
// animar o carro andando pela malha viária até a casa de destino.
export function findRoadPath(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  buildings: Building[],
): Coord[] | null {
  const roads = createRoadSet(buildings)
  const startKey = tileKey(fromX, fromZ)
  const goalKey = tileKey(toX, toZ)

  if (
    !roads.has(startKey) ||
    !roads.has(goalKey)
  ) {
    return null
  }

  if (startKey === goalKey) {
    return [{ x: fromX, z: fromZ }]
  }

  const cameFrom = new Map<string, string>()
  const visited = new Set<string>([startKey])
  const queue: Coord[] = [
    { x: fromX, z: fromZ },
  ]

  let head = 0
  let found = false

  while (head < queue.length) {
    const cur = queue[head]
    head += 1

    const curKey = tileKey(cur.x, cur.z)
    if (curKey === goalKey) {
      found = true
      break
    }

    for (const n of neighbors4(cur.x, cur.z)) {
      const k = tileKey(n.x, n.z)
      if (roads.has(k) && !visited.has(k)) {
        visited.add(k)
        cameFrom.set(k, curKey)
        queue.push(n)
      }
    }
  }

  if (!found) return null

  const path: Coord[] = []
  let cur = goalKey

  while (cur !== startKey) {
    const [x, z] = cur
      .split(":")
      .map(Number) as [number, number]

    path.push({ x, z })

    const prev = cameFrom.get(cur)
    if (!prev) return null

    cur = prev
  }

  path.push({ x: fromX, z: fromZ })
  path.reverse()

  return path
}

export interface WorkTrip extends Coord {
  buildingId: string
  workplaceId: string
  roadX: number
  roadZ: number
}

export function findWorkTrips(
  buildings: Building[],
): WorkTrip[] {
  const reachable =
    reachableRoadTiles(buildings)

  const result: WorkTrip[] = []

  for (const home of buildings) {
    if (!home.occupied) continue
    if (home.closed) continue
    if (!home.workerBuildingId) continue

    const workplace =
      buildings.find(
        (b) =>
          b.id ===
          home.workerBuildingId,
      )

    if (!workplace) continue
    if (workplace.closed) continue

    const workplaceDef =
      getBuilding(workplace.type)

    if (
      workplaceDef.category ===
      "RESIDENTIAL"
    ) {
      continue
    }

    if (workplaceDef.jobs <= 0) {
      continue
    }

    for (const n of neighbors4(
      home.x,
      home.z,
    )) {
      if (
        reachable.has(
          tileKey(n.x, n.z),
        )
      ) {
        result.push({
          x: home.x,
          z: home.z,
          buildingId: home.id,
          workplaceId:
            workplace.id,
          roadX: n.x,
          roadZ: n.z,
        })

        break
      }
    }
  }

  return result
}

export interface WorkTripRoute {
  buildingId: string
  workplaceId: string
  homeRoadX: number
  homeRoadZ: number
  workplaceRoadX: number
  workplaceRoadZ: number
  path: Coord[]
}

export function findWorkTripRoutes(
  buildings: Building[],
): WorkTripRoute[] {
  const trips =
    findWorkTrips(buildings)

  const result: WorkTripRoute[] = []

  for (const trip of trips) {
    const workplace =
      buildings.find(
        (b) =>
          b.id ===
          trip.workplaceId,
      )

    if (!workplace) continue

    const workplaceNeighbors =
      neighbors4(
        workplace.x,
        workplace.z,
      )

    let workplaceRoad:
      Coord | null = null

    for (const n of workplaceNeighbors) {
      if (
        buildings.some(
          (b) =>
            b.type === "ROAD" &&
            b.x === n.x &&
            b.z === n.z,
        )
      ) {
        workplaceRoad = n
        break
      }
    }

    if (!workplaceRoad) continue

    const path =
      findRoadPath(
        trip.roadX,
        trip.roadZ,
        workplaceRoad.x,
        workplaceRoad.z,
        buildings,
      )

    if (!path) continue

    result.push({
      buildingId:
        trip.buildingId,
      workplaceId:
        trip.workplaceId,
      homeRoadX:
        trip.roadX,
      homeRoadZ:
        trip.roadZ,
      workplaceRoadX:
        workplaceRoad.x,
      workplaceRoadZ:
        workplaceRoad.z,
      path,
    })
  }

  return result
}