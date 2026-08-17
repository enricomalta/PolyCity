// ---------------------------------------------------------------------------
// Relógio autoritativo do jogo.
//
// 20 minutos reais = 1 dia no jogo.
// 10 minutos reais = 1 estágio do dia.
//
// Estágio 0 = período "casa"
// Estágio 1 = período "trabalho"
// ---------------------------------------------------------------------------

export const GAME_MINUTES_PER_REAL_MINUTE = 1

export const GAME_DAY_MINUTES = 1

export const GAME_STAGE_MINUTES = 1

export const REAL_MS_PER_GAME_MINUTE =
  60_000 / GAME_MINUTES_PER_REAL_MINUTE

export type CitizenRoutine =
  | "HOME"
  | "TO_WORK"
  | "WORK"
  | "TO_HOME"

export function getRoutineForStage(
  stage: number,
): CitizenRoutine {
  return stage === 0
    ? "HOME"
    : "WORK"
}

export interface GameTime {
  totalMinutes: number
}

export interface TimeAdvanceResult {
  time: GameTime
  elapsedRealMs: number
  elapsedGameMinutes: number
  completedDays: number
  previousStage: number
  currentStage: number
  stageChanges: number
}

export function createGameTime(): GameTime {
  return {
    totalMinutes: 0,
  }
}

export function getGameStage(
  totalMinutes: number,
): number {
  return (
    Math.floor(
      totalMinutes / GAME_STAGE_MINUTES,
    ) % 2
  )
}

export function getGameDay(
  totalMinutes: number,
): number {
  return Math.floor(
    totalMinutes / GAME_DAY_MINUTES,
  )
}

export function getGameMinuteOfDay(
  totalMinutes: number,
): number {
  return (
    totalMinutes %
    GAME_DAY_MINUTES
  )
}

export function advanceGameTime(
  time: GameTime,
  lastTickAt: number,
  now: number,
): TimeAdvanceResult {
  const elapsedRealMs = Math.max(
    0,
    now - lastTickAt,
  )

  const elapsedGameMinutes = Math.floor(
    elapsedRealMs /
      REAL_MS_PER_GAME_MINUTE,
  )

  const previousStage = getGameStage(
    time.totalMinutes,
  )

  if (elapsedGameMinutes <= 0) {
    return {
      time,
      elapsedRealMs,
      elapsedGameMinutes: 0,
      completedDays: 0,
      previousStage,
      currentStage: previousStage,
      stageChanges: 0,
    }
  }

  const nextTotalMinutes =
    time.totalMinutes +
    elapsedGameMinutes

  const previousDay = getGameDay(
    time.totalMinutes,
  )

  const currentDay =
    getGameDay(nextTotalMinutes)

  const currentStage = getGameStage(
    nextTotalMinutes,
  )

  const previousStageAbsolute = Math.floor(
    time.totalMinutes /
      GAME_STAGE_MINUTES,
  )

  const currentStageAbsolute = Math.floor(
    nextTotalMinutes /
      GAME_STAGE_MINUTES,
  )

  return {
    time: {
      totalMinutes:
        nextTotalMinutes,
    },

    elapsedRealMs,

    elapsedGameMinutes,

    completedDays: Math.max(
      0,
      currentDay - previousDay,
    ),

    previousStage,

    currentStage,

    stageChanges: Math.max(
      0,
      currentStageAbsolute -
        previousStageAbsolute,
    ),
  }
}