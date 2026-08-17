import type { Budget, Building, CityPolicy, CityState, PublicService, ResourceState, ServiceIndices } from "@/types/city"
import {
  createGameClock,
} from "@/lib/game/clock"
import { getBuilding } from "./buildings"

// IMPORTANT: economy math here is the SAME code the backend runs. The server
// imports these helpers so the authoritative economy and the optimistic
// client previews never drift apart. The server's result always wins.

export const DEFAULT_POLICY: CityPolicy = {
  taxRate: 8,
  services: { education: 1, health: 1, security: 1, prevention: 1 },
}

export const PUBLIC_SERVICES: PublicService[] = ["education", "health", "security", "prevention"]

export const SERVICE_LABELS: Record<PublicService, string> = {
  education: "Educação",
  health: "Saúde",
  security: "Segurança",
  prevention: "Prevenção",
}

// How many citizens one funding "level" can serve for each service.
const SERVICE_CAPACITY_PER_LEVEL: Record<PublicService, number> = {
  education: 45,
  health: 40,
  security: 55,
  prevention: 70,
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
  const supply = level * SERVICE_CAPACITY_PER_LEVEL[service]
  if (population <= 0) return level > 0 ? 100 : 55
  return clamp(Math.round((supply / population) * 100))
}

export function deriveServiceIndices(policy: CityPolicy, population: number): ServiceIndices {
  return {
    education: serviceIndex("education", policy.services.education, population),
    health: serviceIndex("health", policy.services.health, population),
    security: serviceIndex("security", policy.services.security, population),
    prevention: serviceIndex("prevention", policy.services.prevention, population),
  }
}

export function deriveBudget(policy: CityPolicy, population: number, jobs: number): Budget {
  const taxRevenue = Math.round(
    population * (policy.taxRate / 100) * INCOME_PER_CITIZEN + jobs * (policy.taxRate / 100) * INCOME_PER_JOB,
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
  let energyConsumption = 0
  let waterProduction = 0
  let waterConsumption = 0

  for (const b of buildings) {
    const def = getBuilding(b.type)
    const active = isActiveResident(b, def)

    if (active) {
      population += def.population
      energyConsumption += def.energyConsumption
      waterConsumption += def.waterConsumption
    }

    jobs += def.jobs
    buildingHappiness += def.happiness
    energyProduction += def.energyProduction
    waterProduction += def.waterProduction
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
    buildings,
    policy,
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
