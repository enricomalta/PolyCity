import type { BuildingCategory, BuildingType } from "@/types/game"

// Single source of truth for building gameplay data. These are INITIAL
// balance values only; the backend owns the authoritative economy. Never
// duplicate these numbers inside components.
export interface BuildingDef {
  type: BuildingType
  name: string
  description: string
  category: BuildingCategory
  cost: number
  // footprint in tiles (width x depth). V1 keeps everything 1x1.
  size: { w: number; d: number }
  // resource deltas applied while the building exists
  population: number
  jobs: number
  energyProduction: number
  energyConsumption: number
  waterProduction: number
  waterConsumption: number
  happiness: number
  // visual palette used by the low-poly renderer
  color: string
  roofColor?: string
  // approximate model height in world units
  height: number
}

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  ROAD: {
    type: "ROAD",
    name: "Estrada",
    description: "Conecta os bairros e permite o fluxo da cidade.",
    category: "INFRASTRUCTURE",
    cost: 10,
    size: { w: 1, d: 1 },
    population: 0,
    jobs: 0,
    energyProduction: 0,
    energyConsumption: 0,
    waterProduction: 0,
    waterConsumption: 0,
    happiness: 0,
    color: "#3f4756",
    height: 0.06,
  },
  HOUSE: {
    type: "HOUSE",
    name: "Casa",
    description: "Moradia familiar. Abriga alguns cidadãos.",
    category: "RESIDENTIAL",
    cost: 100,
    size: { w: 1, d: 1 },
    population: 4,
    jobs: 0,
    energyProduction: 0,
    energyConsumption: 2,
    waterProduction: 0,
    waterConsumption: 2,
    happiness: 1,
    color: "#f4b860",
    roofColor: "#c0433a",
    height: 0.7,
  },
  SMALL_APARTMENT: {
    type: "SMALL_APARTMENT",
    name: "Prédio Residencial",
    description: "Concentra mais moradores em menos espaço.",
    category: "RESIDENTIAL",
    cost: 260,
    size: { w: 1, d: 1 },
    population: 14,
    jobs: 0,
    energyProduction: 0,
    energyConsumption: 6,
    waterProduction: 0,
    waterConsumption: 6,
    happiness: 0,
    color: "#e8e2d6",
    roofColor: "#7d8a99",
    height: 1.6,
  },
  SHOP: {
    type: "SHOP",
    name: "Loja",
    description: "Comércio local que gera empregos e felicidade.",
    category: "COMMERCIAL",
    cost: 200,
    size: { w: 1, d: 1 },
    population: 0,
    jobs: 6,
    energyProduction: 0,
    energyConsumption: 4,
    waterProduction: 0,
    waterConsumption: 2,
    happiness: 3,
    color: "#4fb0c6",
    roofColor: "#2d6e7e",
    height: 0.9,
  },
  FACTORY: {
    type: "FACTORY",
    name: "Fábrica",
    description: "Muitos empregos, mas consome energia e reduz felicidade.",
    category: "INDUSTRIAL",
    cost: 500,
    size: { w: 1, d: 1 },
    population: 0,
    jobs: 10,
    energyProduction: 0,
    energyConsumption: 5,
    waterProduction: 0,
    waterConsumption: 3,
    happiness: -2,
    color: "#9aa0a6",
    roofColor: "#5b6169",
    height: 1.1,
  },
  PARK: {
    type: "PARK",
    name: "Parque",
    description: "Área verde que aumenta a felicidade dos cidadãos.",
    category: "SERVICES",
    cost: 120,
    size: { w: 1, d: 1 },
    population: 0,
    jobs: 1,
    energyProduction: 0,
    energyConsumption: 0,
    waterProduction: 0,
    waterConsumption: 2,
    happiness: 5,
    color: "#4c9a52",
    height: 0.25,
  },
  POWER_PLANT: {
    type: "POWER_PLANT",
    name: "Usina de Energia",
    description: "Gera energia para toda a cidade.",
    category: "SERVICES",
    cost: 1000,
    size: { w: 1, d: 1 },
    population: 0,
    jobs: 8,
    energyProduction: 100,
    energyConsumption: 0,
    waterProduction: 0,
    waterConsumption: 4,
    happiness: -1,
    color: "#d9772f",
    roofColor: "#3f4756",
    height: 1.3,
  },
  WATER_TOWER: {
    type: "WATER_TOWER",
    name: "Caixa d'Água",
    description: "Fornece água potável para a cidade.",
    category: "SERVICES",
    cost: 400,
    size: { w: 1, d: 1 },
    population: 0,
    jobs: 2,
    energyProduction: 0,
    energyConsumption: 3,
    waterProduction: 100,
    waterConsumption: 0,
    happiness: 0,
    color: "#7fc8e8",
    roofColor: "#4a7fa5",
    height: 1.5,
  },
}

export const BUILDING_LIST: BuildingDef[] = Object.values(BUILDINGS)

export const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  INFRASTRUCTURE: "Infraestrutura",
  RESIDENTIAL: "Residencial",
  COMMERCIAL: "Comercial",
  INDUSTRIAL: "Industrial",
  SERVICES: "Serviços",
}

export const CATEGORY_ORDER: BuildingCategory[] = [
  "INFRASTRUCTURE",
  "RESIDENTIAL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "SERVICES",
]

export function getBuilding(type: BuildingType): BuildingDef {
  return BUILDINGS[type]
}
