import type { BuildingType } from "./game"

// A city is owned by a single user. The backend is the source of truth
// for ownership and for the authoritative CityState.

export interface City {
  id: string
  ownerId: string
  name: string
  // Deterministic seed used to procedurally generate the world's terrain.
  // The same seed always reproduces the exact same map, so the terrain is
  // persistent without storing every tile.
  seed: number
  createdAt: string
  updatedAt: string
}

// The four public services the mayor funds. Each has a funding level that the
// mayor controls from the "Gabinete do Prefeito" page.
export type PublicService = "education" | "health" | "security" | "prevention"

// Funding level per service: 0 = sem verba ... 3 = verba máxima.
export type FundingLevel = 0 | 1 | 2 | 3

// The mayor's governing policy. The backend applies its effects to the
// authoritative economy (tax revenue, expenses, happiness and per-service
// indices).
export interface CityPolicy {
  // Tax rate as a percentage of citizen income, 0-20.
  taxRate: number
  // Funding level for each public service.
  services: Record<PublicService, FundingLevel>
}

// Per-service quality index (0-100) derived from funding vs. demand. Shown on
// the mayor page so the player can see the impact of their budget.
export type ServiceIndices = Record<PublicService, number>

// Resources tracked by the simulation. These values are ALWAYS returned by
// the server. The client never computes the official value, only previews.
export interface ResourceState {
  money: number
  population: number
  happiness: number // 0-100
  energy: number // net available (production - consumption)
  water: number // net available (production - consumption)
}

export interface Building {
  id: string
  type: BuildingType
  x: number
  z: number
  rotation: number // in 90deg steps: 0,1,2,3
  level: number
}

// Monthly budget breakdown so the mayor page can show revenue vs expenses.
export interface Budget {
  taxRevenue: number
  serviceExpenses: number
  net: number
}

export interface CityState extends ResourceState {
  buildings: Building[]
  policy: CityPolicy
  services: ServiceIndices
  budget: Budget
}
