import { apiGameService } from "./apiGameService"
import { mockGameService } from "./mockGameService"
import type { GameService } from "./gameService"

export type { GameService } from "./gameService"

// Single switch point between mock and real API. Use the real API only when
// a base URL is configured; otherwise fall back to the mock so the game is
// always playable. This is the ONE place that decides which implementation
// the whole app uses.
const useRealApi = Boolean(process.env.NEXT_PUBLIC_API_URL)

export const gameService: GameService = useRealApi ? apiGameService : mockGameService
