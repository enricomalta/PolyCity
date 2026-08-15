import type { Building, CityState, ResourceState } from "@/types/city"
import { getBuilding } from "./buildings"

// IMPORTANT: economy math here is used ONLY for optimistic client previews
// (e.g. "can I afford this?", HUD projections). The backend recomputes the
// real economy and its result always wins. Do not treat these values as
// authoritative anywhere in the app.

export function affordable(state: ResourceState, cost: number): boolean {
  return state.money >= cost
}

// Recompute derived resources from a list of buildings + a starting money
// value. This mirrors what a naive backend would do and keeps the mock
// service and HUD projections consistent.
export function deriveState(buildings: Building[], money: number): CityState {
  let population = 0
  let happiness = 60 // baseline civic mood
  let energyProduction = 0
  let energyConsumption = 0
  let waterProduction = 0
  let waterConsumption = 0

  for (const b of buildings) {
    const def = getBuilding(b.type)
    population += def.population
    happiness += def.happiness
    energyProduction += def.energyProduction
    energyConsumption += def.energyConsumption
    waterProduction += def.waterProduction
    waterConsumption += def.waterConsumption
  }

  return {
    money,
    population,
    happiness: Math.max(0, Math.min(100, happiness)),
    energy: energyProduction - energyConsumption,
    water: waterProduction - waterConsumption,
  }
}
