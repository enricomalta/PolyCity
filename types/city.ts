import type { BuildingType } from "./game"

// A city is owned by a single user. The backend is the source of truth
// for ownership and for the authoritative CityState.

export interface City {
  id: string
  ownerId: string
  name: string
  createdAt: string
  updatedAt: string
}

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

export interface CityState extends ResourceState {
  buildings: Building[]
}
