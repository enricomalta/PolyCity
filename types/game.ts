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