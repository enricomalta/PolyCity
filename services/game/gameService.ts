import type { City, CityState } from "@/types/city"
import type { GameAction, GameResponse } from "@/types/game"

// The contract both the mock and the real API implementations satisfy.
// Components depend only on this interface, so swapping Mock -> Api requires
// zero UI changes.
export interface GameService {
  getCity(cityId: string): Promise<{ city: City; state: CityState }>
  performAction(cityId: string, action: GameAction): Promise<GameResponse>
}
