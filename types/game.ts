import type { CityState } from "./city"

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

export type TerrainType = "GRASS" | "WATER" | "ROCK"

export interface Tile {
  x: number
  z: number
  terrain: TerrainType
  // id of the building occupying this tile, or null when empty
  occupiedBy: string | null
}

// The frontend sends INTENTIONS, never final state. The backend validates
// everything (ownership, cost, terrain, cooldown, rules) and replies with
// the authoritative result.
export type GameAction =
  | { type: "BUILD"; buildingType: BuildingType; x: number; z: number; rotation: number }
  | { type: "DEMOLISH"; x: number; z: number }

// Standard envelope returned by every action so the UI can react uniformly.
export interface GameResponse {
  success: boolean
  // The full, authoritative city state after applying the action.
  state: CityState
  // Optional human-friendly message (e.g. why an action was rejected).
  message?: string
}

// Interaction tools available in the HUD.
export type ToolMode = "SELECT" | "BUILD" | "ROAD" | "DEMOLISH"
