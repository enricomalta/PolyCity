// Central place for tuning the world. Nothing here should be duplicated in
// components; import from this module instead.

export const GRID_SIZE = 30 // 30 x 30 tiles
export const TILE_SIZE = 1 // world units per tile

// Convert a tile coordinate to a centered world position so the grid is
// centered around the origin.
export function tileToWorld(coord: number): number {
  return coord * TILE_SIZE - (GRID_SIZE * TILE_SIZE) / 2 + TILE_SIZE / 2
}

// Camera behaviour for the city-builder feel.
export const CAMERA = {
  initialPosition: [22, 24, 22] as [number, number, number],
  fov: 40,
  minDistance: 8,
  maxDistance: 55,
  // keep the camera above the horizon so you always look "down" at the city
  minPolarAngle: Math.PI / 6,
  maxPolarAngle: Math.PI / 2.6,
  panSpeed: 0.8,
}

// Treasury every brand-new city starts with.
export const STARTING_MONEY = 5000

// The player's own city is always addressed as "me": the backend resolves it
// from the authenticated Firebase user, so the client never needs a real id.
export const DEFAULT_CITY_ID = "me"
