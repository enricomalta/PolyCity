import type { City, CityState } from "@/types/city"
import type { GameAction, GameResponse } from "@/types/game"
import { apiRequest } from "@/lib/api/client"
import type { GameService } from "./gameService"

// Real backend implementation. It only sends INTENTIONS to the API and
// renders whatever authoritative state comes back. All game rules, economy
// and validation live on the server.
export const apiGameService: GameService = {
  getCity(cityId) {
    return apiRequest<{ city: City; state: CityState }>(`/api/cities/${cityId}`)
  },

  performAction(cityId, action: GameAction) {
    return apiRequest<GameResponse>(`/api/cities/${cityId}/actions`, {
      method: "POST",
      body: action,
    })
  },
}
