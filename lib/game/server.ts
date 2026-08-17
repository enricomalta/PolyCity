import "server-only"
import type { DecodedIdToken } from "firebase-admin/auth"
import type { City, CityPolicy, CityState, Building, FundingLevel } from "@/types/city"
import type { GameAction, GameResponse } from "@/types/game"
import { adminDb } from "@/lib/firebase/admin"
import { getBuilding } from "./buildings"
import { applyBudgetTicks, deriveState, DEFAULT_POLICY, PUBLIC_SERVICES } from "./economy"
import { generateTerrain, applyOccupancy, canPlace } from "./grid"
import { isHouseReachable } from "./traffic"
import { GRID_SIZE, STARTING_MONEY } from "./constants"

// The authoritative game state, stored one document per city (keyed by the
// owner's Firebase uid). This module is the ONLY place that mutates game data.

interface CityDoc {
  id: string
  ownerId: string
  name: string
  seed: number
  createdAt: string
  updatedAt: string
  money: number
  lastTickAt: number
  policy: CityPolicy
  buildings: Building[]
}

function makeId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}`
}

// Deterministic seed from the user id so each player gets a unique but stable
// procedural world.
function seedFromUid(uid: string): number {
  let h = 2166136261
  for (let i = 0; i < uid.length; i++) {
    h ^= uid.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Find a handful of buildable tiles near the center to seed a starter town so
// the world never opens completely empty (and never on water/rock).
function starterBuildings(seed: number): Building[] {
  const terrain = generateTerrain(seed)
  const center = Math.floor(GRID_SIZE / 2)
  const wanted: { type: Building["type"]; dx: number; dz: number }[] = [
    { type: "HOUSE", dx: 0, dz: 0 },
    { type: "HOUSE", dx: 1, dz: 0 },
    { type: "ROAD", dx: 0, dz: 1 },
    { type: "ROAD", dx: 1, dz: 1 },
    { type: "SHOP", dx: 2, dz: 0 },
  ]
  const placed: Building[] = []
  for (const w of wanted) {
    // spiral out from the desired offset until we hit a buildable tile
    for (let r = 0; r < 8; r++) {
      const tx = center + w.dx + (r % 2 === 0 ? r : -r)
      const tz = center + w.dz
      const tile = terrain[tx]?.[tz]
      if (tile && tile.terrain !== "WATER" && tile.terrain !== "ROCK" && !placed.some((p) => p.x === tx && p.z === tz)) {
        placed.push({ id: makeId(), type: w.type, x: tx, z: tz, rotation: 0, level: 1 })
        break
      }
    }
  }
  return placed
}

function sanitizePolicy(input: unknown): CityPolicy {
  const p = (input ?? {}) as Partial<CityPolicy>
  const taxRate = Math.max(0, Math.min(20, Math.round(Number(p.taxRate ?? DEFAULT_POLICY.taxRate))))
  const services = { ...DEFAULT_POLICY.services }
  for (const s of PUBLIC_SERVICES) {
    const raw = Number((p.services as Record<string, number> | undefined)?.[s] ?? DEFAULT_POLICY.services[s])
    services[s] = Math.max(0, Math.min(3, Math.round(raw))) as FundingLevel
  }
  return { taxRate, services }
}

function docToState(doc: CityDoc): CityState {
  return deriveState(doc.buildings, doc.money, doc.policy)
}

function docToCity(doc: CityDoc): City {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    name: doc.name,
    seed: doc.seed,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// Load the caller's city, creating the account + city on first login. Applies
// any pending budget ticks and persists the updated treasury.
export async function getOrCreateCity(
  user: DecodedIdToken,
): Promise<{ city: City; state: CityState }> {
  const db = adminDb()
  const cityRef = db.collection("cities").doc(user.uid)
  const snap = await cityRef.get()
  const now = Date.now()

  if (!snap.exists) {
    // First login: create the player's profile and their procedural city.
    const seed = seedFromUid(user.uid)
    const nowIso = new Date(now).toISOString()
    const displayName = (user.name as string | undefined) ?? user.email?.split("@")[0] ?? "Prefeito"
    const doc: CityDoc = {
      id: user.uid,
      ownerId: user.uid,
      name: `Cidade de ${displayName}`,
      seed,
      createdAt: nowIso,
      updatedAt: nowIso,
      money: STARTING_MONEY,
      lastTickAt: now,
      policy: DEFAULT_POLICY,
      buildings: starterBuildings(seed),
    }
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email ?? null,
      displayName,
      photoURL: (user.picture as string | undefined) ?? null,
      cityId: user.uid,
      createdAt: nowIso,
    })
    await cityRef.set(doc)
    return { city: docToCity(doc), state: docToState(doc) }
  }

  const doc = snap.data() as CityDoc
  // Apply elapsed budget ticks to the treasury.
  const ticked = applyBudgetTicks(doc.money, doc.buildings, doc.policy, doc.lastTickAt ?? now, now)
  if (ticked.money !== doc.money || ticked.lastTickAt !== doc.lastTickAt) {
    doc.money = ticked.money
    doc.lastTickAt = ticked.lastTickAt
    await cityRef.update({ money: doc.money, lastTickAt: doc.lastTickAt })
  }
  return { city: docToCity(doc), state: docToState(doc) }
}

// Apply a player INTENTION authoritatively and return the new state.
export async function performAction(user: DecodedIdToken, action: GameAction): Promise<GameResponse> {
  const db = adminDb()
  const cityRef = db.collection("cities").doc(user.uid)
  const snap = await cityRef.get()
  if (!snap.exists) {
    // Ensure the city exists (e.g. a stale client acting before first load).
    await getOrCreateCity(user)
  }
  const fresh = await cityRef.get()
  const doc = fresh.data() as CityDoc
  const now = Date.now()

  // Keep the treasury current before spending/earning.
  const ticked = applyBudgetTicks(doc.money, doc.buildings, doc.policy, doc.lastTickAt ?? now, now)
  doc.money = ticked.money
  doc.lastTickAt = ticked.lastTickAt

  const reject = (message: string): GameResponse => ({ success: false, state: docToState(doc), message })

  if (action.type === "BUILD") {
    const def = getBuilding(action.buildingType)
    const terrain = applyOccupancy(generateTerrain(doc.seed), doc.buildings)
    const tile = terrain[action.x]?.[action.z]
    if (!canPlace(tile)) return reject("Não é possível construir aqui.")
    if (doc.money < def.cost) return reject("Dinheiro insuficiente.")
    doc.buildings = [
      ...doc.buildings,
      { id: makeId(), type: action.buildingType, x: action.x, z: action.z, rotation: action.rotation, level: 1, occupied: false },
    ]
    doc.money -= def.cost
    doc.updatedAt = new Date(now).toISOString()
    await cityRef.update({ buildings: doc.buildings, money: doc.money, lastTickAt: doc.lastTickAt, updatedAt: doc.updatedAt })
    return { success: true, state: docToState(doc), message: `${def.name} construída.` }
  }

  if (action.type === "DEMOLISH") {
    const idx = doc.buildings.findIndex((b) => b.x === action.x && b.z === action.z)
    if (idx === -1) return reject("Nada para demolir aqui.")
    const [removed] = doc.buildings.splice(idx, 1)
    doc.money += Math.floor(getBuilding(removed.type).cost * 0.25)
    doc.updatedAt = new Date(now).toISOString()
    await cityRef.update({ buildings: doc.buildings, money: doc.money, lastTickAt: doc.lastTickAt, updatedAt: doc.updatedAt })
    return { success: true, state: docToState(doc), message: "Construção demolida." }
  }

  if (action.type === "ROTATE") {
    const idx =
      doc.buildings.findIndex(
        (b) =>
          b.x === action.x &&
          b.z === action.z,
      )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const normalizedRotation =
      ((action.rotation % 4) + 4) % 4

    doc.buildings[idx] = {
      ...doc.buildings[idx],
      rotation: normalizedRotation,
    }

    doc.updatedAt =
      new Date(now).toISOString()

    await cityRef.update({
      buildings: doc.buildings,
      money: doc.money,
      lastTickAt: doc.lastTickAt,
      updatedAt: doc.updatedAt,
    })

    return {
      success: true,
      state: docToState(doc),
      message:
        "Construção rotacionada.",
    }
  }

  if (action.type === "SET_POLICY") {
    doc.policy = sanitizePolicy(action.policy)
    doc.updatedAt = new Date(now).toISOString()
    await cityRef.update({ policy: doc.policy, money: doc.money, lastTickAt: doc.lastTickAt, updatedAt: doc.updatedAt })
    return { success: true, state: docToState(doc), message: "Política municipal atualizada." }
  }

  if (action.type === "OCCUPY") {
    const idx = doc.buildings.findIndex(
      (b) => b.x === action.x && b.z === action.z,
    )

    if (idx === -1) {
      return reject("Nenhuma construção encontrada aqui.")
    }

    const building = doc.buildings[idx]
    const def = getBuilding(building.type)

    if (def.category !== "RESIDENTIAL") {
      return reject("Esta construção não é residencial.")
    }

    if (building.occupied) {
      return reject("Esta casa já está ocupada.")
    }

    if (building.closed) {
      return reject("Esta residência está fechada.")
    }

    // Nunca confia na palavra do cliente de que "o carro chegou": revalida
    // que a casa está mesmo conectada à rede viária a partir de uma
    // rodovia que toca a borda do mapa.
    if (!isHouseReachable(action.x, action.z, doc.buildings)) {
      return reject("Esta casa não está conectada à rede viária da cidade.")
    }

    doc.buildings[idx] = { ...building, occupied: true }
    doc.updatedAt = new Date(now).toISOString()
    await cityRef.update({ buildings: doc.buildings, money: doc.money, lastTickAt: doc.lastTickAt, updatedAt: doc.updatedAt })
    return {
      success: true,
      state: docToState(doc),
      message: `Uma família se mudou para ${def.name.toLowerCase()}.`,
    }
  }

  if (action.type === "VACATE") {
    const idx = doc.buildings.findIndex(
      (b) => b.x === action.x && b.z === action.z,
    )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const building = doc.buildings[idx]
    const def = getBuilding(building.type)

    if (
      def.category !== "RESIDENTIAL" &&
      def.category !== "COMMERCIAL" &&
      def.category !== "INDUSTRIAL"
    ) {
      return reject(
        "Esta construção não possui ocupação.",
      )
    }

    if (!building.occupied) {
      return reject(
        "Esta construção já está desocupada.",
      )
    }

    if (building.closed) {
      return reject(
        "Esta construção está fechada.",
      )
    }

    doc.buildings[idx] = {
      ...building,
      occupied: false,
    }

    doc.updatedAt =
      new Date(now).toISOString()

    await cityRef.update({
      buildings: doc.buildings,
      money: doc.money,
      lastTickAt: doc.lastTickAt,
      updatedAt: doc.updatedAt,
    })

    return {
      success: true,
      state: docToState(doc),
      message:
        def.category === "RESIDENTIAL"
          ? "Os moradores deixaram a residência."
          : "Os trabalhadores deixaram a construção.",
    }
  }

  if (action.type === "CLOSE") {
    const idx = doc.buildings.findIndex(
      (b) => b.x === action.x && b.z === action.z,
    )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const building = doc.buildings[idx]

    if (building.closed) {
      return reject(
        "Esta construção já está fechada.",
      )
    }

    doc.buildings[idx] = {
      ...building,
      closed: true,
    }

    doc.updatedAt =
      new Date(now).toISOString()

    await cityRef.update({
      buildings: doc.buildings,
      money: doc.money,
      lastTickAt: doc.lastTickAt,
      updatedAt: doc.updatedAt,
    })

    return {
      success: true,
      state: docToState(doc),
      message: "Construção fechada.",
    }
  }

  if (action.type === "OPEN") {
    const idx = doc.buildings.findIndex(
      (b) => b.x === action.x && b.z === action.z,
    )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const building = doc.buildings[idx]

    if (!building.closed) {
      return reject(
        "Esta construção já está aberta.",
      )
    }

    doc.buildings[idx] = {
      ...building,
      closed: false,
    }

    doc.updatedAt =
      new Date(now).toISOString()

    await cityRef.update({
      buildings: doc.buildings,
      money: doc.money,
      lastTickAt: doc.lastTickAt,
      updatedAt: doc.updatedAt,
    })

    return {
      success: true,
      state: docToState(doc),
      message: "Construção reaberta.",
    }
  }

  return reject("Ação desconhecida.")
}
