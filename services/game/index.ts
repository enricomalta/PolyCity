import { apiGameService } from "./apiGameService"
import type { GameService } from "./gameService"

export type { GameService } from "./gameService"

// The game always talks to the real backend (Next.js API routes backed by
// Firebase/Firestore). There is no mock anymore: every piece of state is
// authoritative and persisted per player.
export const gameService: GameService = apiGameService
