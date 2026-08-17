"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  createGameClock,
  DEFAULT_GAME_CLOCK_CONFIG,
  type GameClock,
} from "@/lib/game/clock"

export function useGameClock(
  clockStartedAt: number | null,
): GameClock | null {
  const [clock, setClock] =
    useState<GameClock | null>(() => {
      if (!clockStartedAt) {
        return null
      }

      return createGameClock(
        clockStartedAt,
        Date.now(),
        DEFAULT_GAME_CLOCK_CONFIG,
      )
    })

  useEffect(() => {
    if (!clockStartedAt) {
      setClock(null)
      return
    }

    const update = () => {
      setClock(
        createGameClock(
          clockStartedAt,
          Date.now(),
          DEFAULT_GAME_CLOCK_CONFIG,
        ),
      )
    }

    update()

    const interval =
      window.setInterval(
        update,
        1000,
      )

    return () => {
      window.clearInterval(interval)
    }
  }, [clockStartedAt])

  return clock
}