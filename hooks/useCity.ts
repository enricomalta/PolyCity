"use client"

import { useGame } from "./useGame"

// City data slice: authoritative city + resource state + build/demolish
// intents. Everything comes from the GameService (mock or real API).
export function useCity() {
  const { city, state, tiles, status, error, pending, lastMessage, build, demolish, clearMessage, reload } = useGame()
  return { city, state, tiles, status, error, pending, lastMessage, build, demolish, clearMessage, reload }
}
