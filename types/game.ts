import type { CityState, CityPolicy } from "./city"

// The set of buildings available in V1. Kept as a string union so it is easy
// to serialize into API actions and to key the building catalog.
export type BuildingType =
  | "ROAD"
  | "HOUSE"
  | "SMALL_APARTMENT"
  | "SHOP"
  | "FACTORY"
  | "PARK"
  | "POWER_PLANT"
  | "WATER_TOWER"

export type BuildingCategory =
  | "INFRASTRUCTURE"
  | "RESIDENTIAL"
  | "COMMERCIAL"
  | "INDUSTRIAL"
  | "SERVICES"

export type TerrainType =
  | "GRASS"
  | "WATER"
  | "ROCK"
  | "FOREST"
  | "SAND"

export interface Tile {
  x: number
  z: number
  terrain: TerrainType
  occupiedBy: string | null
}

// The frontend sends INTENTIONS, never final state.
export type GameAction =
  | {
      type: "BUILD"
      buildingType: BuildingType
      x: number
      z: number
      rotation: number
    }
  | {
      type: "DEMOLISH"
      x: number
      z: number
    }
  | {
      type: "ROTATE"
      x: number
      z: number
      rotation: number
    }
  | {
      type: "SET_POLICY"
      policy: CityPolicy
    }
  | {
      // Disparada pelo sistema de tráfego (client) quando um carro chega a
      // uma casa vaga. O servidor revalida tudo: a casa existe, é
      // residencial, está vaga, e está conectada à rede viária a partir de
      // uma rodovia que toca a borda do mapa — nunca confia só no cliente.
      type: "OCCUPY"
      x: number
      z: number
    }
  | {
      type: "VACATE"
      x: number
      z: number
    }
  | {
      type: "CLOSE"
      x: number
      z: number
    }
  | {
      type: "OPEN"
      x: number
      z: number
    }

export interface GameResponse {
  success: boolean
  state: CityState
  message?: string
}

export type ToolMode =
  | "SELECT"
  | "BUILD"
  | "ROAD"
  | "DEMOLISH"