import type { City, CityState, CityPolicy } from "@/types/city"
import type { GameAction, GameResponse } from "@/types/game"

// The contract the API implementation satisfies. Components depend only on
// this interface, so the transport can change without touching the UI.
export interface GameService {
  getCity(cityId: string): Promise<{ city: City; state: CityState }>
  performAction(cityId: string, action: GameAction): Promise<GameResponse>
  // Convenience wrapper around a SET_POLICY action for the mayor page.
  updatePolicy(cityId: string, policy: CityPolicy): Promise<GameResponse>
}
