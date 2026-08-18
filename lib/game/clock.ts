export type TimeStage =
  | "DAY"
  | "NIGHT"

export interface GameClock {
  day: number
  hour: number
  minute: number
  totalMinutes: number
  stage: TimeStage
}

export interface GameClockConfig {
  /**
   * Quantos minutos reais representam um dia inteiro no jogo.
   *
   * 20 minutos reais = 1 dia do jogo.
   */
  realMinutesPerGameDay: number

  /**
   * Minuto inicial do mundo.
   *
   * 00:00 = meia-noite.
   */
  initialGameMinute: number
}

export const DEFAULT_GAME_CLOCK_CONFIG: GameClockConfig = {
  realMinutesPerGameDay: 24,
  initialGameMinute: 7 * 60,
}

/**
 * Retorna o estágio do dia com base no horário.
 *
 * Atualmente:
 *
 * 20:00 → 05:59 = moradores em casa
 * 06:00 → 19:59 = moradores trabalhando
 */
export function getTimeStage(
  minuteOfDay: number,
): TimeStage {
  const normalized =
    ((minuteOfDay % 1440) + 1440) % 1440

  const dayStart = 6 * 60
  const nightStart = 18 * 60

  if (
    normalized >= dayStart &&
    normalized < nightStart
  ) {
    return "DAY"
  }

  return "NIGHT"
}

/**
 * Cria o relógio a partir de um timestamp.
 *
 * O timestamp representa o momento em que o relógio do jogo começou.
 * A partir dele conseguimos reconstruir o horário mesmo depois que o
 * jogador fecha o jogo.
 */
export function createGameClock(
  startedAt: number,
  now: number = Date.now(),
  config: GameClockConfig = DEFAULT_GAME_CLOCK_CONFIG,
): GameClock {
  const realElapsedMinutes =
    Math.max(0, now - startedAt) / 60000

  const gameDaysElapsed =
    realElapsedMinutes /
    config.realMinutesPerGameDay

  const elapsedGameMinutes =
    Math.floor(
      gameDaysElapsed * 1440,
    )

  const totalMinutes =
    config.initialGameMinute +
    elapsedGameMinutes

  const day =
    Math.floor(totalMinutes / 1440) + 1

  const minuteOfDay =
    ((totalMinutes % 1440) + 1440) % 1440

  const hour =
    Math.floor(minuteOfDay / 60)

  const minute =
    minuteOfDay % 60

  return {
    day,
    hour,
    minute,
    totalMinutes,
    stage: getTimeStage(
      minuteOfDay,
    ),
  }
}

/**
 * Converte o relógio para HH:MM.
 */
export function formatGameTime(
  clock: GameClock,
): string {
  return `${String(clock.hour).padStart(
    2,
    "0",
  )}:${String(clock.minute).padStart(
    2,
    "0",
  )}`
}

/**
 * Retorna quantos minutos do jogo passaram entre dois relógios.
 */
export function getElapsedGameMinutes(
  previous: GameClock,
  current: GameClock,
): number {
  return Math.max(
    0,
    current.totalMinutes -
      previous.totalMinutes,
  )
}

/**
 * Retorna quantos dias completos passaram.
 */
export function getElapsedGameDays(
  previous: GameClock,
  current: GameClock,
): number {
  return Math.floor(
    getElapsedGameMinutes(
      previous,
      current,
    ) / 1440,
  )
}