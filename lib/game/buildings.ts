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
  LOW_INCOME_HOUSE: {
    type: "LOW_INCOME_HOUSE", name: "Casa de baixa renda", description: "Moradia compacta e acessível.", category: "RESIDENTIAL", cost: 70, size: { w: 1, d: 1 }, population: 3, jobs: 0, energyProduction: 0, energyConsumption: 1, waterProduction: 0, waterConsumption: 1, happiness: 0, color: "#c98f58", roofColor: "#8f3f36", height: 0.55,
  },
  MIDDLE_INCOME_HOUSE: {
    type: "MIDDLE_INCOME_HOUSE", name: "Casa de média renda", description: "Moradia confortável para famílias.", category: "RESIDENTIAL", cost: 150, size: { w: 1, d: 1 }, population: 5, jobs: 0, energyProduction: 0, energyConsumption: 2, waterProduction: 0, waterConsumption: 2, happiness: 2, color: "#e5b878", roofColor: "#b44c3e", height: 0.8,
  },
  HIGH_INCOME_HOUSE: {
    type: "HIGH_INCOME_HOUSE", name: "Casa de alta renda", description: "Residência ampla e valorizada.", category: "RESIDENTIAL", cost: 320, size: { w: 1, d: 1 }, population: 4, jobs: 0, energyProduction: 0, energyConsumption: 4, waterProduction: 0, waterConsumption: 3, happiness: 5, color: "#f2d6a2", roofColor: "#3b536b", height: 1.05,
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
  COMMERCIAL_BUILDING: {
    type: "COMMERCIAL_BUILDING", name: "Prédio comercial", description: "Centro comercial com vários serviços.", category: "COMMERCIAL", cost: 420, size: { w: 1, d: 1 }, population: 0, jobs: 14, energyProduction: 0, energyConsumption: 7, waterProduction: 0, waterConsumption: 4, happiness: 4, color: "#6c9fc2", roofColor: "#36536d", height: 1.5,
  },
  GROCERY_STORE: {
    type: "GROCERY_STORE", name: "Mercado", description: "Abastece os bairros e emprega comerciantes.", category: "COMMERCIAL", cost: 280, size: { w: 1, d: 1 }, population: 0, jobs: 8, energyProduction: 0, energyConsumption: 5, waterProduction: 0, waterConsumption: 3, happiness: 3, color: "#79b86a", roofColor: "#3f7944", height: 0.85,
  },
  GAS_STATION: {
    type: "GAS_STATION", name: "Posto de gasolina", description: "Abastece veículos e gera empregos de transporte.", category: "COMMERCIAL", cost: 300, size: { w: 1, d: 1 }, population: 0, jobs: 5, energyProduction: 0, energyConsumption: 3, waterProduction: 0, waterConsumption: 1, happiness: 1, color: "#d9a441", roofColor: "#b53f3f", height: 0.65,
  },
  CLOTHING_STORE: {
    type: "CLOTHING_STORE", name: "Loja de roupas", description: "Comércio de moda para a população.", category: "COMMERCIAL", cost: 240, size: { w: 1, d: 1 }, population: 0, jobs: 7, energyProduction: 0, energyConsumption: 4, waterProduction: 0, waterConsumption: 2, happiness: 3, color: "#c17dcc", roofColor: "#6b3f82", height: 0.9,
  },
  CAR_DEALERSHIP: {
    type: "CAR_DEALERSHIP", name: "Loja de carros", description: "Venda de veículos e empregos automotivos.", category: "COMMERCIAL", cost: 450, size: { w: 1, d: 1 }, population: 0, jobs: 9, energyProduction: 0, energyConsumption: 5, waterProduction: 0, waterConsumption: 2, happiness: 2, color: "#5b9dd6", roofColor: "#263e59", height: 0.75,
  },
  BUILDING_SUPPLY_STORE: {
    type: "BUILDING_SUPPLY_STORE", name: "Material de construção", description: "Fornece materiais para a expansão urbana.", category: "COMMERCIAL", cost: 360, size: { w: 1, d: 1 }, population: 0, jobs: 8, energyProduction: 0, energyConsumption: 4, waterProduction: 0, waterConsumption: 2, happiness: 1, color: "#b97a4d", roofColor: "#6f4835", height: 0.8,
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
  CONSTRUCTION_FACTORY: {
    type: "CONSTRUCTION_FACTORY", name: "Fábrica de construção civil", description: "Produz materiais e empregos para obras.", category: "INDUSTRIAL", cost: 650, size: { w: 1, d: 1 }, population: 0, jobs: 14, energyProduction: 0, energyConsumption: 8, waterProduction: 0, waterConsumption: 5, happiness: -2, color: "#c07a45", roofColor: "#68402d", height: 1.2,
  },
  AUTOMOTIVE_FACTORY: {
    type: "AUTOMOTIVE_FACTORY", name: "Fábrica automobilística", description: "Monta veículos e cria empregos técnicos.", category: "INDUSTRIAL", cost: 800, size: { w: 1, d: 1 }, population: 0, jobs: 18, energyProduction: 0, energyConsumption: 10, waterProduction: 0, waterConsumption: 6, happiness: -3, color: "#71849a", roofColor: "#344252", height: 1.35,
  },
  TECH_FACTORY: {
    type: "TECH_FACTORY", name: "Fábrica de tecnologia", description: "Produz tecnologia e empregos qualificados.", category: "INDUSTRIAL", cost: 950, size: { w: 1, d: 1 }, population: 0, jobs: 20, energyProduction: 0, energyConsumption: 9, waterProduction: 0, waterConsumption: 4, happiness: -1, color: "#6b9ed6", roofColor: "#263b61", height: 1.45,
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
