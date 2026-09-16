import type { BuildingType, TerrainType } from "./game"

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
export type PublicService = "education" | "health" | "security" | "prevention" | "waste" | "transit" | "roads" | "sewage"

export type EconomicModel = "SANDBOX" | "SOCIAL_MARKET" | "FREE_MARKET" | "PLANNED_ECONOMY" | "WELFARE_STATE"

export type PoliticalIdeology =
  | "SOCIAL_DEMOCRACY"
  | "LIBERALISM"
  | "CONSERVATISM"
  | "ECOLOGISM"
  | "LIBERTARIANISM"
  | "SOCIALISM"
  | "NEOLIBERALISM"
  | "WELFARE_STATE"
  | "FISCAL_AUSTERITY"
  | "DEVELOPMENTALISM"
  | "ECO_SOCIALISM"
  | "STATE_CAPITALISM"
  | "PROGRESSIVISM"
  | "TECHNOCRACY"

// Funding level per service: 0 = sem verba ... 3 = verba máxima.
export type FundingLevel = 0 | 1 | 2 | 3

// The mayor's governing policy. The backend applies its effects to the
// authoritative economy (tax revenue, expenses, happiness and per-service
// indices).
export type CitizenClass = "LOW" | "MIDDLE" | "HIGH"

export type SelectiveTax = "consumption" | "energy" | "water" | "fuel"

export type EmploymentSector = "PUBLIC" | "COMMERCE" | "INDUSTRY" | "TECHNOLOGY" | "SERVICES" | "LOGISTICS" | "AGRICULTURE"

export interface JobSalary {
  title: string
  sector: EmploymentSector
  salary: number
  class: CitizenClass
}

export type RegionZone = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "MIXED" | "PARK"

export interface CityRegion {
  id: string
  name: string
  zone: RegionZone
  citizenClass?: CitizenClass
  tiles: Array<{ x: number; z: number }>
  taxRate?: number
  createdAt: string
}

export interface EconomyPrices {
  jobs: JobSalary[]
  salary: Record<CitizenClass, number>
  rent: Record<CitizenClass, number>
  consumption: { market: number; water: number; energy: number; fuel: number; transit: number }
}

export interface CityPolicy {
  // Tax rates are percentages. Municipal income tax is capped at 50%.
  taxRate: number
  economicModel: EconomicModel
  ideology: PoliticalIdeology
  classTaxRates: Record<CitizenClass, number>
  selectiveTaxes: Record<SelectiveTax, number>
  services: Record<PublicService, FundingLevel>
  utilityFunding: { energy: FundingLevel; sewage: FundingLevel }
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
  energy: number // net available (production - consumption), including isolated local production
  water: number // net available (production - consumption), including isolated local production
  // Only the surplus from producer networks that reach the city edge can be exported.
  energyExport?: number
  waterExport?: number
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

  // Estradas usam três estados: regular, irregular (operante) e fechada.
  maintenance?: {
    status: "REGULAR" | "IRREGULAR" | "CLOSED"
    wear: number
    degradationRate: number
    lastMaintainedAt: string
  }
  roadCondition?: "REGULAR" | "IRREGULAR" | "CLOSED"
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
  terrainOverrides?: Record<string, TerrainType>
  buildings: Building[]
  citizens: Citizen[]
  policy: CityPolicy
  regions: CityRegion[]
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

