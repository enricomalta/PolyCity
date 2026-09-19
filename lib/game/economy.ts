import type { Budget, Building, CityPolicy, CityState, Citizen, CitizenClass, PublicService, ResourceState, ServiceIndices } from "@/types/city"
import {
  createGameClock,
} from "@/lib/game/clock"
import { getBuilding } from "./buildings"
import { hasBuildingUtility, hasBuildingUtilityToEdge } from "./utilityNetwork"

// IMPORTANT: economy math here is the SAME code the backend runs. The server
// imports these helpers so the authoritative economy and the optimistic
// client previews never drift apart. The server's result always wins.

export const DEFAULT_PRICES = {
  jobs: [
    { title: "Atendente de comércio", sector: "COMMERCE", salary: 14, class: "LOW" },
    { title: "Operário industrial", sector: "INDUSTRY", salary: 22, class: "LOW" },
    { title: "Professor", sector: "PUBLIC", salary: 32, class: "MIDDLE" },
    { title: "Técnico de serviços", sector: "SERVICES", salary: 38, class: "MIDDLE" },
    { title: "Engenheiro de tecnologia", sector: "TECHNOLOGY", salary: 72, class: "HIGH" },
    { title: "Gestor logístico", sector: "LOGISTICS", salary: 58, class: "HIGH" },
  ],
  salary: { LOW: 12, MIDDLE: 28, HIGH: 65 },
  rent: { LOW: 5, MIDDLE: 12, HIGH: 28 },
  consumption: { market: 8, water: 2, energy: 3, fuel: 4, transit: 3 },
} as const

export const DEFAULT_POLICY: CityPolicy = {
  taxRate: 8,
  economicModel: "SOCIAL_MARKET",
  ideology: "SOCIAL_DEMOCRACY",
  classTaxRates: { LOW: 3, MIDDLE: 8, HIGH: 14 },
  selectiveTaxes: { consumption: 4, energy: 3, water: 2, fuel: 5 },
  services: { education: 1, health: 1, security: 1, prevention: 1, waste: 1, transit: 1, roads: 1, sewage: 1 },
  utilityFunding: { energy: 2, sewage: 2 },
  prices: DEFAULT_PRICES,
}

export const PUBLIC_SERVICES: PublicService[] = ["education", "health", "security", "prevention", "waste", "transit", "roads", "sewage"]

export const SERVICE_LABELS: Record<PublicService, string> = {
  education: "Educação",
  health: "Saúde",
  security: "Segurança",
  prevention: "Prevenção",
  waste: "Coleta de lixo",
  transit: "Transporte",
  roads: "Estradas",
  sewage: "Tratamento de esgoto",
}

// How many citizens one funding "level" can serve for each service.
const SERVICE_CAPACITY_PER_LEVEL: Record<PublicService, number> = {
  education: 45,
  health: 40,
  security: 55,
  prevention: 70,
  waste: 60,
  transit: 50,
  roads: 70,
  sewage: 55,
}

// Monthly cost of one funding level (scaled by population inside the model).
const SERVICE_BASE_COST = 40
const SERVICE_COST_PER_CITIZEN = 1.2

// Average per-citizen income used to size tax revenue.
const INCOME_PER_CITIZEN = 9
const INCOME_PER_JOB = 5

// Uma casa (RESIDENTIAL) só soma população e consome energia/água quando
// ocupada — ou seja, quando um NPC já dirigiu até ela pela rede viária (ver
// lib/game/traffic.ts). Prédios não-residenciais (loja, fábrica, parque
// etc.) sempre contam integralmente, não têm esse conceito de ocupação.
function isActiveResident(b: Building, def: ReturnType<typeof getBuilding>): boolean {
  if (def.category !== "RESIDENTIAL") return true
  return b.occupied === true
}

export function affordable(state: ResourceState, cost: number): boolean {
  return state.money >= cost
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}

// Quality index (0-100) of a single service, from its funding vs. the city's
// demand (population). No population means an empty city, so any funding keeps
// the index healthy.
function serviceIndex(service: PublicService, level: number, population: number): number {
  const fundingCoverage = [0, 30, 50, 100][level] ?? 0
  if (population <= 0) return fundingCoverage
  const capacityCoverage = (level * SERVICE_CAPACITY_PER_LEVEL[service] / population) * 100
  return clamp(Math.round(Math.min(fundingCoverage, capacityCoverage)))
}

export function calculateCitizenOpinion(citizen: Citizen, policy: CityPolicy, services: ServiceIndices, neighborhoodBonus = 0): Citizen["opinion"] {
  const classTax = policy.classTaxRates[citizen.citizenClass]
  const selectiveTax = Object.values(policy.selectiveTaxes).reduce((sum, rate) => sum + rate, 0) / Object.values(policy.selectiveTaxes).length
  const taxScore = clamp(100 - classTax * 3.5 - selectiveTax * 1.5)
  const affordability = clamp(Math.round((citizen.salary - citizen.monthlyExpenses) / Math.max(1, citizen.salary) * 100))
  const serviceScore = Math.round((services.education + services.health + services.security + services.prevention) / 4)
  const government = clamp(Math.round(serviceScore * 0.45 + taxScore * 0.25 + affordability * 0.2 + neighborhoodBonus * 0.1))
  return { score: government, government, economy: affordability, services: serviceScore, taxes: taxScore, housing: clamp(affordability + neighborhoodBonus) }
}

export function deriveServiceIndices(policy: CityPolicy, population: number): ServiceIndices {
  return Object.fromEntries(
    PUBLIC_SERVICES.map((service) => [service, serviceIndex(service, policy.services[service], population)]),
  ) as ServiceIndices
}

export function deriveBudget(policy: CityPolicy, population: number, jobs: number): Budget {
  const taxRevenue = Math.round(
    (population * INCOME_PER_CITIZEN + jobs * INCOME_PER_JOB) * (policy.taxRate / 100),
  )
  let serviceExpenses = 0
  for (const s of PUBLIC_SERVICES) {
    const level = policy.services[s]
    serviceExpenses += Math.round(level * (SERVICE_BASE_COST + population * SERVICE_COST_PER_CITIZEN))
  }
  return { taxRevenue, serviceExpenses, net: taxRevenue - serviceExpenses }
}

// Recompute the full authoritative city state from the building list, the
// treasury and the mayor's policy.
export function deriveState(buildings: Building[], money: number, policy: CityPolicy, clockStartedAt: number, now: number = Date.now()): CityState {
  let population = 0
  let jobs = 0
  let buildingHappiness = 0
  let energyProduction = 0
  let edgeEnergyProduction = 0
  let energyConsumption = 0
  let edgeEnergyConsumption = 0
  let waterProduction = 0
  let edgeWaterProduction = 0
  let waterConsumption = 0
  let edgeWaterConsumption = 0

  const hasElectricUtility = (building: Building) => hasBuildingUtility(buildings, building, "ELECTRIC_GRID")
  const hasSewerUtility = (building: Building) => hasBuildingUtility(buildings, building, "SEWER_NETWORK")
  const connectedTowers = buildings.filter((building) => building.type === "WATER_TOWER" && hasSewerUtility(building))

  for (const b of buildings) {
    const def = getBuilding(b.type)
    const active = isActiveResident(b, def)

    if (active) population += def.population

    jobs += def.jobs
    buildingHappiness += def.happiness
    if (def.energyConsumption > 0 && hasElectricUtility(b)) {
      energyConsumption += def.energyConsumption
      if (hasBuildingUtilityToEdge(buildings, b, "ELECTRIC_GRID")) edgeEnergyConsumption += def.energyConsumption
    }
    if (def.waterConsumption > 0 && hasSewerUtility(b)) {
      waterConsumption += def.waterConsumption
      if (hasBuildingUtilityToEdge(buildings, b, "SEWER_NETWORK")) edgeWaterConsumption += def.waterConsumption
    }
    // A produção local entra no balanço assim que o produtor está ligado à
    // sua rede. A ligação até a borda é uma condição de exportação, não de
    // existência do recurso dentro da cidade.
    if (b.type === "POWER_PLANT" && hasElectricUtility(b)) {
      energyProduction += def.energyProduction
      if (hasBuildingUtilityToEdge(buildings, b, "ELECTRIC_GRID")) edgeEnergyProduction += def.energyProduction
    }
    if (b.type === "WATER_TOWER" && hasSewerUtility(b)) {
      waterProduction += def.waterProduction
      if (hasBuildingUtilityToEdge(buildings, b, "SEWER_NETWORK")) edgeWaterProduction += def.waterProduction
    }
    if (b.type === "SEWAGE_TREATMENT_PLANT" && hasSewerUtility(b) && connectedTowers.length > 0) {
      waterConsumption = Math.max(0, waterConsumption - def.waterConsumption)
    }
  }

  const services = deriveServiceIndices(policy, population)
  const budget = deriveBudget(policy, population, jobs)

  // Policy effects on civic mood: taxes hurt, well-funded services help.
  const avgServiceIndex =
    PUBLIC_SERVICES.reduce((sum, s) => sum + services[s], 0) / PUBLIC_SERVICES.length
  const taxPenalty = policy.taxRate * 0.8
  const serviceBonus = (avgServiceIndex - 50) * 0.4

  const happiness = clamp(Math.round(60 + buildingHappiness + serviceBonus - taxPenalty))

  const clock = createGameClock(
    clockStartedAt,
    now,
  )

  return {
    money: Math.round(money),
    population,
    happiness,
    energy: energyProduction - energyConsumption,
    water: waterProduction - waterConsumption,
    // A produção isolada participa do balanço interno, mas não pode ser
    // exportada. O consumo da cidade inteira reduz o excedente exportável:
    // assim, uma usina ligada à borda pode compensar a demanda de um bairro
    // isolado, mas nunca exportar a produção desse bairro.
    // Cada recurso é validado separadamente, sem exigir que água e energia
    // estejam exportando ao mesmo tempo.
    energyExport: Math.max(0, edgeEnergyProduction - energyConsumption),
    waterExport: Math.max(0, edgeWaterProduction - waterConsumption),
    buildings,
    policy,
    regions: [],
    services,
    budget,
    timeStage: clock.stage,
    clock,
  }
}

// A monthly budget tick lasts this long in real time. Every tick applies the
// net budget (tax revenue - service expenses) to the treasury.
export const TICK_MS = 30_000

// Advance the treasury by however many whole ticks elapsed since `lastTickAt`.
// Returns the new money value and the timestamp of the last applied tick so
// the remainder carries over. Money never drops below zero.
export function applyBudgetTicks(
  money: number,
  buildings: Building[],
  policy: CityPolicy,
  lastTickAt: number,
  now: number,
): { money: number; lastTickAt: number } {
  const elapsed = now - lastTickAt
  if (elapsed < TICK_MS) return { money, lastTickAt }
  const ticks = Math.floor(elapsed / TICK_MS)
  let population = 0
  let jobs = 0
  for (const b of buildings) {
    const def = getBuilding(b.type)
    if (isActiveResident(b, def)) {
      population += def.population
    }
    jobs += def.jobs
  }
  const { net } = deriveBudget(policy, population, jobs)
  const nextMoney = Math.max(0, money + net * ticks)
  return { money: nextMoney, lastTickAt: lastTickAt + ticks * TICK_MS }
}
