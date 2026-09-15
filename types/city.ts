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
  clockStartedAt: number
  createdAt: string
  updatedAt: string
}


// The four public services the mayor funds. Each has a funding level that the
// mayor controls from the "Gabinete do Prefeito" page.
export type PublicService = "education" | "health" | "security" | "prevention" | "waste" | "transit"

export type PoliticalIdeology = "SOCIAL_DEMOCRACY" | "LIBERALISM" | "CONSERVATISM" | "ECOLOGISM" | "LIBERTARIANISM"

// Funding level per service: 0 = sem verba ... 3 = verba máxima.
export type FundingLevel = 0 | 1 | 2 | 3

// The mayor's governing policy. The backend applies its effects to the
// authoritative economy (tax revenue, expenses, happiness and per-service
// indices).
export type CitizenClass = "LOW" | "MIDDLE" | "HIGH"

export type SelectiveTax = "consumption" | "energy" | "water" | "fuel"

export interface EconomyPrices {
  salary: Record<CitizenClass, number>
  rent: Record<CitizenClass, number>
  consumption: { market: number; water: number; energy: number; fuel: number; transit: number }
}

export interface CityPolicy {
  // Tax rates are percentages. Municipal income tax is capped at 50%.
  taxRate: number
  ideology: PoliticalIdeology
  classTaxRates: Record<CitizenClass, number>
  selectiveTaxes: Record<SelectiveTax, number>
  services: Record<PublicService, FundingLevel>
  prices: EconomyPrices
}

export interface CitizenOpinion {
  score: number
  government: number
  economy: number
  services: number
  taxes: number
  housing: number
  education: number
  health: number
  security: number
  prevention: number
  waste: number
  transit: number
}

export interface CitizenPost {
  id: string
  citizenId: string
  citizenName: string
  tone: "praise" | "criticism"
  topic: PublicService | "taxes" | "housing" | "economy"
  message: string
  score: number
  createdAt: string
}

export interface Citizen {
  id: string
  name: string
  age: number
  lifeStage: CitizenLifeStage
  education: CitizenEducation
  homeBuildingId: string
  workplaceBuildingId?: string
  employed: boolean
  workState: string
  citizenClass: CitizenClass
  salary: number
  monthlyExpenses: number
  opinion: CitizenOpinion
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
  // Só é relevante para buildings RESIDENTIAL (HOUSE, SMALL_APARTMENT).
  // Uma casa só soma população (e consome energia/água) quando ocupada —
  // isso acontece quando um NPC dirige até ela pela rede viária, não no
  // instante em que é construída. Ver lib/game/traffic.ts e a ação OCCUPY.
  occupied?: boolean

  // A closed building remains physically present but is inactive.
  // This will later be used by economy/infrastructure systems.
  closed?: boolean
  workerBuildingId?: string
}

// Monthly budget breakdown so the mayor page can show revenue vs expenses.
export interface Budget {
  taxRevenue: number
  serviceExpenses: number
  net: number
}

export interface CityState extends ResourceState {
  buildings: Building[]
  citizens: Citizen[]
  policy: CityPolicy
  services: ServiceIndices
  budget: Budget
  timeStage: "DAY" | "NIGHT"
  clock: {
    day: number
    hour: number
    minute: number
    totalMinutes: number
    stage: "DAY" | "NIGHT"
  }
}


export type CitizenLifeStage =
  | "BABY"
  | "CHILD"
  | "TEEN"
  | "ADULT"
  | "ELDERLY"

export type CitizenEducation =
  | "NONE"
  | "ELEMENTARY"
  | "HIGH_SCHOOL"
  | "TECHNICAL"
  | "COLLEGE"
  | "POSTGRADUATE"

export type CitizenWorkState =
  | "HOME"
  | "TO_WORK"
  | "WORK"
  | "TO_HOME"

