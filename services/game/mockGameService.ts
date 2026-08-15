import type { City, Building, CityState } from "@/types/city"
import type { GameAction, GameResponse } from "@/types/game"
import { getBuilding } from "@/lib/game/buildings"
import { deriveState } from "@/lib/game/economy"
import { DEFAULT_CITY_ID } from "@/lib/game/constants"
import type { GameService } from "./gameService"

// A stand-in for the real backend so the frontend is fully playable before
// the API exists. It mimics server behaviour: it validates the action and
// returns the authoritative CityState. When the real API is ready, swap this
// for ApiGameService — no component changes required.

const STARTING_MONEY = 5000

function makeId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}`
}

// In-memory "database" of cities keyed by id, seeded with a starter city.
const store = new Map<string, { city: City; buildings: Building[]; money: number }>()

function seed(cityId: string) {
  if (store.has(cityId)) return
  const now = new Date().toISOString()
  const buildings: Building[] = [
    { id: makeId(), type: "HOUSE", x: 14, z: 14, rotation: 0, level: 1 },
    { id: makeId(), type: "HOUSE", x: 15, z: 14, rotation: 0, level: 1 },
    { id: makeId(), type: "ROAD", x: 14, z: 15, rotation: 0, level: 1 },
    { id: makeId(), type: "ROAD", x: 15, z: 15, rotation: 0, level: 1 },
    { id: makeId(), type: "SHOP", x: 16, z: 14, rotation: 0, level: 1 },
  ]
  store.set(cityId, {
    city: { id: cityId, ownerId: "local", name: "Nova Cidade", createdAt: now, updatedAt: now },
    buildings,
    money: STARTING_MONEY,
  })
}

function stateFor(cityId: string): CityState {
  const entry = store.get(cityId)!
  return deriveState(entry.buildings, entry.money)
}

// Simulate network latency so loading states are exercised.
function delay(ms = 220): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export const mockGameService: GameService = {
  async getCity(cityId = DEFAULT_CITY_ID) {
    seed(cityId)
    await delay(300)
    const entry = store.get(cityId)!
    return { city: entry.city, state: stateFor(cityId) }
  },

  async performAction(cityId, action: GameAction): Promise<GameResponse> {
    seed(cityId)
    await delay()
    const entry = store.get(cityId)!

    if (action.type === "BUILD") {
      const def = getBuilding(action.buildingType)
      const occupied = entry.buildings.some((b) => b.x === action.x && b.z === action.z)
      if (occupied) {
        return { success: false, state: stateFor(cityId), message: "Este terreno já está ocupado." }
      }
      if (entry.money < def.cost) {
        return { success: false, state: stateFor(cityId), message: "Dinheiro insuficiente." }
      }
      entry.buildings.push({
        id: makeId(),
        type: action.buildingType,
        x: action.x,
        z: action.z,
        rotation: action.rotation,
        level: 1,
      })
      entry.money -= def.cost
      entry.city.updatedAt = new Date().toISOString()
      return { success: true, state: stateFor(cityId), message: `${def.name} construída.` }
    }

    if (action.type === "DEMOLISH") {
      const idx = entry.buildings.findIndex((b) => b.x === action.x && b.z === action.z)
      if (idx === -1) {
        return { success: false, state: stateFor(cityId), message: "Nada para demolir aqui." }
      }
      const [removed] = entry.buildings.splice(idx, 1)
      // refund a fraction of the cost
      entry.money += Math.floor(getBuilding(removed.type).cost * 0.25)
      entry.city.updatedAt = new Date().toISOString()
      return { success: true, state: stateFor(cityId), message: "Construção demolida." }
    }

    return { success: false, state: stateFor(cityId), message: "Ação desconhecida." }
  },
}
