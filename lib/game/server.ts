import "server-only"

import type { DecodedIdToken } from "firebase-admin/auth"

import type {
  City,
  CityPolicy,
  CityState,
  Building,
  Citizen,
  FundingLevel,
} from "@/types/city"

import type {
  GameAction,
  GameResponse,
} from "@/types/game"

import { adminDb } from "@/lib/firebase/admin"

import { getBuilding } from "./buildings"

import {
  applyBudgetTicks,
  deriveState,
  DEFAULT_POLICY,
  PUBLIC_SERVICES,
} from "./economy"

import {
  generateTerrain,
  applyOccupancy,
  canPlace,
} from "./grid"

import {
  isHouseReachable,
} from "./traffic"

import {
  GRID_SIZE,
  STARTING_MONEY,
} from "./constants"

import {
  createGameTime,
  type GameTime,
} from "./time"

import {
  createGameClock,
} from "@/lib/game/clock"

import {
  canCitizenWork,
  createCitizen,
  updateCitizenWorkStates,
} from "./citizens"

// The authoritative game state, stored one document per city (keyed by the
// owner's Firebase uid). This module is the ONLY place that mutates game data.

interface CityDoc {
  id: string
  ownerId: string
  name: string
  seed: number
  createdAt: string
  updatedAt: string
  money: number
  lastTickAt: number
  clockStartedAt: number
  gameTime: GameTime
  timeStage: number
  policy: CityPolicy
  buildings: Building[]
  citizens: Citizen[]
}

function makeId(): string {
  return `b_${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

// Deterministic seed from the user id so each player gets a unique but stable
// procedural world.
function seedFromUid(
  uid: string,
): number {
  let h = 2166136261

  for (
    let i = 0;
    i < uid.length;
    i++
  ) {
    h ^= uid.charCodeAt(i)
    h = Math.imul(
      h,
      16777619,
    )
  }

  return h >>> 0
}

// Find a handful of buildable tiles near the center to seed a starter town so
// the world never opens completely empty (and never on water/rock).
function starterBuildings(
  seed: number,
): Building[] {
  const terrain =
    generateTerrain(seed)

  const center =
    Math.floor(
      GRID_SIZE / 2,
    )

  const wanted: {
    type: Building["type"]
    dx: number
    dz: number
  }[] = [
      {
        type: "HOUSE",
        dx: 0,
        dz: 0,
      },
      {
        type: "HOUSE",
        dx: 1,
        dz: 0,
      },
      {
        type: "ROAD",
        dx: 0,
        dz: 1,
      },
      {
        type: "ROAD",
        dx: 1,
        dz: 1,
      },
      {
        type: "SHOP",
        dx: 2,
        dz: 0,
      },
    ]

  const placed: Building[] = []

  for (const w of wanted) {
    // spiral out from the desired offset until we hit a buildable tile
    for (
      let r = 0;
      r < 8;
      r++
    ) {
      const tx =
        center +
        w.dx +
        (r % 2 === 0
          ? r
          : -r)

      const tz =
        center +
        w.dz

      const tile =
        terrain[tx]?.[tz]

      if (
        tile &&
        tile.terrain !== "WATER" &&
        tile.terrain !== "ROCK" &&
        !placed.some(
          (p) =>
            p.x === tx &&
            p.z === tz,
        )
      ) {
        placed.push({
          id: makeId(),
          type: w.type,
          x: tx,
          z: tz,
          rotation: 0,
          level: 1,
        })

        break
      }
    }
  }

  return placed
}

function sanitizePolicy(
  input: unknown,
): CityPolicy {
  const p =
    (input ?? {}) as Partial<CityPolicy>

  const taxRate =
    Math.max(
      0,
      Math.min(
        20,
        Math.round(
          Number(
            p.taxRate ??
            DEFAULT_POLICY.taxRate,
          ),
        ),
      ),
    )

  const services = {
    ...DEFAULT_POLICY.services,
  }

  for (const s of PUBLIC_SERVICES) {
    const raw =
      Number(
        (
          p.services as
          | Record<string, number>
          | undefined
        )?.[s] ??
        DEFAULT_POLICY.services[s],
      )

    services[s] =
      Math.max(
        0,
        Math.min(
          3,
          Math.round(raw),
        ),
      ) as FundingLevel
  }

  return {
    taxRate,
    services,
  }
}

function docToState(
  doc: CityDoc,
): CityState {
  const state =
    deriveState(
      doc.buildings,
      doc.money,
      doc.policy,
      doc.clockStartedAt,
      Date.now(),
    )

  return {
    ...state,
    citizens:
      doc.citizens ?? [],
  }
}

function docToCity(
  doc: CityDoc,
): City {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    name: doc.name,
    seed: doc.seed,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    clockStartedAt:
      doc.clockStartedAt,
  }
}

function createHousehold(
  size: number,
  homeBuildingId: string,
): Citizen[] {
  const citizens: Citizen[] = []

  const adultAge =
    18 +
    Math.floor(
      Math.random() * 47,
    )

  citizens.push(
    createCitizen(
      `c_${Math.random()
        .toString(36)
        .slice(2, 10)}`,
      "Cidadão 1",
      adultAge,
      homeBuildingId,
    ),
  )

  for (
    let i = 1;
    i < size;
    i++
  ) {
    let age: number

    const roll =
      Math.random()

    if (roll < 0.15) {
      age = Math.floor(
        Math.random() * 4,
      )
    } else if (roll < 0.4) {
      age =
        4 +
        Math.floor(
          Math.random() * 8,
        )
    } else if (roll < 0.65) {
      age =
        12 +
        Math.floor(
          Math.random() * 6,
        )
    } else if (roll < 0.92) {
      age =
        18 +
        Math.floor(
          Math.random() * 47,
        )
    } else {
      age =
        65 +
        Math.floor(
          Math.random() * 25,
        )
    }

    citizens.push(
      createCitizen(
        `c_${Math.random()
          .toString(36)
          .slice(2, 10)}`,
        `Cidadão ${i + 1}`,
        age,
        homeBuildingId,
      ),
    )
  }

  return citizens
}

function assignCitizensToWorkplaces(
  citizens: Citizen[],
  buildings: Building[],
): Citizen[] {
  const workplaces =
    buildings.filter(
      (building) => {
        const def =
          getBuilding(
            building.type,
          )

        return (
          !building.closed &&
          def.category !==
          "RESIDENTIAL" &&
          def.jobs > 0
        )
      },
    )

  const employedByWorkplace =
    new Map<
      string,
      number
    >()

  return citizens.map(
    (citizen) => {
      if (
        !canCitizenWork(
          citizen,
        )
      ) {
        const {
          workplaceBuildingId:
          _oldWorkplaceBuildingId,
          ...citizenWithoutWorkplace
        } = citizen

        return {
          ...citizenWithoutWorkplace,
          employed: false,
          workState: "HOME",
        }
      }

      let selectedWorkplace:
        | Building
        | undefined

      for (
        const workplace of workplaces
      ) {
        const current =
          employedByWorkplace.get(
            workplace.id,
          ) ?? 0

        const capacity =
          getBuilding(
            workplace.type,
          ).jobs

        if (
          current <
          capacity
        ) {
          selectedWorkplace =
            workplace

          break
        }
      }

      if (
        !selectedWorkplace
      ) {
        const {
          workplaceBuildingId:
          _oldWorkplaceBuildingId,
          ...citizenWithoutWorkplace
        } = citizen

        return {
          ...citizenWithoutWorkplace,
          employed: false,
          workState: "HOME",
        }
      }

      const current =
        employedByWorkplace.get(
          selectedWorkplace.id,
        ) ?? 0

      employedByWorkplace.set(
        selectedWorkplace.id,
        current + 1,
      )

      const workplaceChanged =
        citizen.workplaceBuildingId !==
        selectedWorkplace.id

      return {
        ...citizen,
        employed: true,
        workplaceBuildingId:
          selectedWorkplace.id,
        workState:
          workplaceChanged
            ? "HOME"
            : citizen.workState,
      }
    },
  )
}

// Load the caller's city, creating the account + city on first login.
// Economy ticks are still based on lastTickAt.
// DAY/NIGHT is derived exclusively from clock.ts.
export async function getOrCreateCity(
  user: DecodedIdToken,
): Promise<{
  city: City
  state: CityState
}> {
  const db = adminDb()

  const cityRef =
    db
      .collection("cities")
      .doc(user.uid)

  const snap =
    await cityRef.get()

  const now =
    Date.now()

  if (!snap.exists) {
    const seed =
      seedFromUid(
        user.uid,
      )

    const nowIso =
      new Date(
        now,
      ).toISOString()

    const displayName =
      (user.name as
        | string
        | undefined) ??
      user.email
        ?.split("@")[0] ??
      "Prefeito"

    const doc: CityDoc = {
      id: user.uid,
      ownerId: user.uid,
      name:
        `Cidade de ${displayName}`,
      seed,
      createdAt: nowIso,
      updatedAt: nowIso,
      money:
        STARTING_MONEY,
      lastTickAt: now,
      clockStartedAt: now,
      gameTime:
        createGameTime(),
      timeStage: 0,
      policy:
        DEFAULT_POLICY,
      buildings:
        starterBuildings(seed),
      citizens: [],
    }

    await db
      .collection("users")
      .doc(user.uid)
      .set({
        uid: user.uid,
        email:
          user.email ??
          null,
        displayName,
        photoURL:
          (user.picture as
            | string
            | undefined) ??
          null,
        cityId: user.uid,
        createdAt: nowIso,
      })

    await cityRef.set(doc)

    return {
      city:
        docToCity(doc),
      state:
        docToState(doc),
    }
  }

  const doc =
    snap.data() as CityDoc

  if (
    !Array.isArray(
      doc.citizens,
    )
  ) {
    doc.citizens = []
  }

  if (
    typeof doc.clockStartedAt !==
    "number" ||
    !Number.isFinite(
      doc.clockStartedAt,
    )
  ) {
    doc.clockStartedAt =
      now

    await cityRef.update({
      clockStartedAt:
        doc.clockStartedAt,
    })
  }

  if (
    !Number.isFinite(
      doc.timeStage,
    )
  ) {
    doc.timeStage =
      0
  }

  if (!doc.gameTime) {
    doc.gameTime =
      createGameTime()
  }

  const currentClock =
    createGameClock(
      doc.clockStartedAt,
      now,
    )

  const currentTimeStage =
    currentClock.stage ===
      "DAY"
      ? 1
      : 0

  const previousTimeStage =
    doc.timeStage

  const stageChanged =
    currentTimeStage !==
    previousTimeStage

  doc.timeStage =
    currentTimeStage

  if (stageChanged) {
    doc.citizens =
      updateCitizenWorkStates(
        doc.citizens,
        doc.timeStage,
      )

    doc.citizens =
      assignCitizensToWorkplaces(
        doc.citizens,
        doc.buildings,
      )
  }

  const ticked =
    applyBudgetTicks(
      doc.money,
      doc.buildings,
      doc.policy,
      doc.lastTickAt ??
      now,
      now,
    )

  const economyChanged =
    ticked.money !==
    doc.money ||
    ticked.lastTickAt !==
    doc.lastTickAt

  doc.money =
    ticked.money

  doc.lastTickAt =
    ticked.lastTickAt

  const shouldPersist =
    economyChanged ||
    stageChanged

  if (
    shouldPersist
  ) {
    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      timeStage:
        doc.timeStage,
      citizens:
        doc.citizens,
      updatedAt:
        doc.updatedAt,
    })
  }

  return {
    city:
      docToCity(doc),
    state:
      docToState(doc),
  }
}

// Apply a player INTENTION authoritatively and return the new state.
export async function performAction(
  user: DecodedIdToken,
  action: GameAction,
): Promise<GameResponse> {
  const db = adminDb()

  const cityRef =
    db
      .collection("cities")
      .doc(user.uid)

  const snap =
    await cityRef.get()

  if (!snap.exists) {
    await getOrCreateCity(user)
  }

  const fresh =
    await cityRef.get()

  const doc =
    fresh.data() as CityDoc

  if (
    !Array.isArray(
      doc.citizens,
    )
  ) {
    doc.citizens = []
  }

  const now =
    Date.now()

  if (
    typeof doc.clockStartedAt !==
    "number" ||
    !Number.isFinite(
      doc.clockStartedAt,
    )
  ) {
    doc.clockStartedAt =
      now
  }

  if (!doc.gameTime) {
    doc.gameTime =
      createGameTime()
  }

  const previousClock =
    createGameClock(
      doc.clockStartedAt,
      doc.lastTickAt ??
      now,
    )

  const currentClock =
    createGameClock(
      doc.clockStartedAt,
      now,
    )

  const currentTimeStage =
    currentClock.stage ===
      "DAY"
      ? 1
      : 0

  const stageChanged =
    currentTimeStage !==
    doc.timeStage

  const dayCompleted =
    currentClock.day >
    previousClock.day

  if (
    stageChanged
  ) {
    doc.timeStage =
      currentTimeStage

    doc.citizens =
      updateCitizenWorkStates(
        doc.citizens,
        doc.timeStage,
      )

    doc.citizens =
      assignCitizensToWorkplaces(
        doc.citizens,
        doc.buildings,
      )
  }

  const ticked =
    applyBudgetTicks(
      doc.money,
      doc.buildings,
      doc.policy,
      doc.lastTickAt ??
      now,
      now,
    )

  doc.money =
    ticked.money

  doc.lastTickAt =
    ticked.lastTickAt

  const reject = (
    message: string,
  ): GameResponse => ({
    success: false,
    state:
      docToState(doc),
    message,
  })

  if (
    stageChanged ||
    dayCompleted
  ) {
    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      buildings:
        doc.buildings,
      citizens:
        doc.citizens,
      timeStage:
        doc.timeStage,
      lastTickAt:
        doc.lastTickAt,
      money:
        doc.money,
      updatedAt:
        doc.updatedAt,
    })
  }

  if (
    action.type ===
    "SYNC_TIME_STAGE"
  ) {
    return {
      success: true,
      state:
        docToState(doc),
      message: null,
    }
  }

  if (
    action.type ===
    "BUILD"
  ) {
    const def =
      getBuilding(
        action.buildingType,
      )

    const terrain =
      applyOccupancy(
        generateTerrain(
          doc.seed,
        ),
        doc.buildings,
      )

    const tile =
      terrain[action.x]?.[
      action.z
      ]

    if (
      !canPlace(tile)
    ) {
      return reject(
        "Não é possível construir aqui.",
      )
    }

    if (
      doc.money <
      def.cost
    ) {
      return reject(
        "Dinheiro insuficiente.",
      )
    }

    doc.buildings = [
      ...doc.buildings,
      {
        id: makeId(),
        type:
          action.buildingType,
        x: action.x,
        z: action.z,
        rotation:
          action.rotation,
        level: 1,
        occupied: false,
        closed: false,
      },
    ]

    doc.citizens =
      assignCitizensToWorkplaces(
        doc.citizens,
        doc.buildings,
      )

    doc.money -=
      def.cost

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      buildings:
        doc.buildings,
      citizens:
        doc.citizens,
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        `${def.name} construída.`,
    }
  }

  if (action.type === "MOVE") {
    const idx =
      doc.buildings.findIndex(
        (b) =>
          b.x === action.x &&
          b.z === action.z,
      )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const building =
      doc.buildings[idx]

    if (
      building.type === "ROAD"
    ) {
      return reject(
        "Estradas não podem ser movidas por este modo.",
      )
    }

    const terrain =
      applyOccupancy(
        generateTerrain(doc.seed),
        doc.buildings,
      )

    const targetTile =
      terrain[action.toX]?.[
        action.toZ
      ]

    if (!targetTile) {
      return reject(
        "Não é possível mover a construção para esse local.",
      )
    }

    const occupiedByOther =
      doc.buildings.some(
        (b, buildingIndex) =>
          buildingIndex !== idx &&
          b.x === action.toX &&
          b.z === action.toZ,
      )

    if (occupiedByOther) {
      return reject(
        "Esse terreno já está ocupado.",
      )
    }

    const normalizedRotation =
      ((action.rotation % 4) + 4) %
      4

    doc.buildings[idx] = {
      ...building,
      x: action.toX,
      z: action.toZ,
      rotation:
        normalizedRotation,
    }

    doc.updatedAt =
      new Date(now).toISOString()

    await cityRef.update({
      buildings: doc.buildings,
      citizens: doc.citizens,
      money: doc.money,
      lastTickAt: doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        "Construção movida.",
    }
  }

  if (
    action.type ===
    "DEMOLISH"
  ) {
    const idx =
      doc.buildings.findIndex(
        (b) =>
          b.x === action.x &&
          b.z === action.z,
      )

    if (idx === -1) {
      return reject(
        "Nada para demolir aqui.",
      )
    }

    const [removed] =
      doc.buildings.splice(
        idx,
        1,
      )

    doc.money +=
      Math.floor(
        getBuilding(
          removed.type,
        ).cost * 0.25,
      )

    doc.citizens =
      assignCitizensToWorkplaces(
        doc.citizens,
        doc.buildings,
      )

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      buildings:
        doc.buildings,
      citizens:
        doc.citizens,
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        "Construção demolida.",
    }
  }

  if (
    action.type ===
    "ROTATE"
  ) {
    const idx =
      doc.buildings.findIndex(
        (b) =>
          b.x === action.x &&
          b.z === action.z,
      )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const normalizedRotation =
      ((action.rotation % 4) +
        4) %
      4

    doc.buildings[idx] = {
      ...doc.buildings[idx],
      rotation:
        normalizedRotation,
    }

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      buildings:
        doc.buildings,
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        "Construção rotacionada.",
    }
  }

  if (
    action.type ===
    "SET_POLICY"
  ) {
    doc.policy =
      sanitizePolicy(
        action.policy,
      )

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      policy:
        doc.policy,
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        "Política municipal atualizada.",
    }
  }

  if (
    action.type ===
    "OCCUPY"
  ) {
    const idx =
      doc.buildings.findIndex(
        (b) =>
          b.x === action.x &&
          b.z === action.z,
      )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const building =
      doc.buildings[idx]

    const def =
      getBuilding(
        building.type,
      )

    if (
      def.category !==
      "RESIDENTIAL"
    ) {
      return reject(
        "Esta construção não é residencial.",
      )
    }

    if (
      building.occupied
    ) {
      return reject(
        "Esta casa já está ocupada.",
      )
    }

    if (
      building.closed
    ) {
      return reject(
        "Esta residência está fechada.",
      )
    }

    if (
      !isHouseReachable(
        action.x,
        action.z,
        doc.buildings,
      )
    ) {
      return reject(
        "Esta casa não está conectada à rede viária da cidade.",
      )
    }

    doc.buildings[idx] = {
      ...building,
      occupied: true,
    }

    const householdSize =
      getBuilding(
        building.type,
      ).population

    const household =
      createHousehold(
        householdSize,
        building.id,
      )

    doc.citizens = [
      ...doc.citizens,
      ...household,
    ]

    doc.citizens =
      assignCitizensToWorkplaces(
        doc.citizens,
        doc.buildings,
      )

    doc.citizens =
      updateCitizenWorkStates(
        doc.citizens,
        doc.timeStage,
      )

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      buildings:
        doc.buildings,
      citizens:
        doc.citizens,
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        `Uma família se mudou para ${def.name.toLowerCase()}.`,
    }
  }

  if (
    action.type ===
    "ARRIVE_WORK"
  ) {
    const citizen =
      doc.citizens.find(
        (c) =>
          c.id ===
          action.citizenId,
      )

    if (!citizen) {
      return reject(
        "Cidadão não encontrado.",
      )
    }

    if (
      citizen.lifeStage !==
      "ADULT" ||
      !citizen.employed ||
      !citizen.workplaceBuildingId
    ) {
      return reject(
        "Este cidadão não possui um emprego válido.",
      )
    }

    if (
      citizen.workState !==
      "TO_WORK"
    ) {
      return reject(
        "Este cidadão não está indo para o trabalho.",
      )
    }

    const workplace =
      doc.buildings.find(
        (b) =>
          b.id ===
          citizen.workplaceBuildingId,
      )

    if (!workplace) {
      return reject(
        "Local de trabalho não encontrado.",
      )
    }

    if (
      workplace.closed
    ) {
      return reject(
        "O local de trabalho está fechado.",
      )
    }

    doc.citizens =
      doc.citizens.map(
        (c) =>
          c.id ===
            citizen.id
            ? {
              ...c,
              workState:
                "WORK",
            }
            : c,
      )

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      citizens:
        doc.citizens,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        "Cidadão chegou ao trabalho.",
    }
  }

  if (
    action.type ===
    "ARRIVE_HOME"
  ) {
    const citizen =
      doc.citizens.find(
        (c) =>
          c.id ===
          action.citizenId,
      )

    if (!citizen) {
      return reject(
        "Cidadão não encontrado.",
      )
    }

    if (
      citizen.lifeStage !==
      "ADULT" ||
      !citizen.employed ||
      !citizen.workplaceBuildingId
    ) {
      return reject(
        "Este cidadão não possui um emprego válido.",
      )
    }

    if (
      citizen.workState !==
      "TO_HOME"
    ) {
      return reject(
        "Este cidadão não está retornando para casa.",
      )
    }

    const home =
      doc.buildings.find(
        (b) =>
          b.id ===
          citizen.homeBuildingId,
      )

    if (!home) {
      return reject(
        "Residência do cidadão não encontrada.",
      )
    }

    doc.citizens =
      doc.citizens.map(
        (c) =>
          c.id ===
            citizen.id
            ? {
              ...c,
              workState:
                "HOME",
            }
            : c,
      )

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      citizens:
        doc.citizens,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        "Cidadão chegou em casa.",
    }
  }

  if (
    action.type ===
    "VACATE"
  ) {
    const idx =
      doc.buildings.findIndex(
        (b) =>
          b.x === action.x &&
          b.z === action.z,
      )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const building =
      doc.buildings[idx]

    const def =
      getBuilding(
        building.type,
      )

    if (
      def.category !==
      "RESIDENTIAL" &&
      def.category !==
      "COMMERCIAL" &&
      def.category !==
      "INDUSTRIAL"
    ) {
      return reject(
        "Esta construção não possui ocupação.",
      )
    }

    if (
      !building.occupied
    ) {
      return reject(
        "Esta construção já está desocupada.",
      )
    }

    if (
      building.closed
    ) {
      return reject(
        "Esta construção está fechada.",
      )
    }

    doc.buildings[idx] = {
      ...building,
      occupied: false,
    }

    doc.citizens =
      doc.citizens.filter(
        (citizen) =>
          citizen.homeBuildingId !==
          building.id,
      )

    doc.citizens =
      assignCitizensToWorkplaces(
        doc.citizens,
        doc.buildings,
      )

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      buildings:
        doc.buildings,
      citizens:
        doc.citizens,
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        def.category ===
          "RESIDENTIAL"
          ? "Os moradores deixaram a residência."
          : "Os trabalhadores deixaram a construção.",
    }
  }

  if (
    action.type ===
    "CLOSE"
  ) {
    const idx =
      doc.buildings.findIndex(
        (b) =>
          b.x === action.x &&
          b.z === action.z,
      )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const building =
      doc.buildings[idx]

    if (
      building.closed
    ) {
      return reject(
        "Esta construção já está fechada.",
      )
    }

    doc.buildings[idx] = {
      ...building,
      closed: true,
    }

    doc.citizens =
      assignCitizensToWorkplaces(
        doc.citizens,
        doc.buildings,
      )

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      buildings:
        doc.buildings,
      citizens:
        doc.citizens,
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        "Construção fechada.",
    }
  }

  if (
    action.type ===
    "OPEN"
  ) {
    const idx =
      doc.buildings.findIndex(
        (b) =>
          b.x === action.x &&
          b.z === action.z,
      )

    if (idx === -1) {
      return reject(
        "Nenhuma construção encontrada aqui.",
      )
    }

    const building =
      doc.buildings[idx]

    if (
      !building.closed
    ) {
      return reject(
        "Esta construção já está aberta.",
      )
    }

    doc.buildings[idx] = {
      ...building,
      closed: false,
    }

    doc.citizens =
      assignCitizensToWorkplaces(
        doc.citizens,
        doc.buildings,
      )

    doc.updatedAt =
      new Date(
        now,
      ).toISOString()

    await cityRef.update({
      buildings:
        doc.buildings,
      citizens:
        doc.citizens,
      money:
        doc.money,
      lastTickAt:
        doc.lastTickAt,
      updatedAt:
        doc.updatedAt,
    })

    return {
      success: true,
      state:
        docToState(doc),
      message:
        "Construção reaberta.",
    }
  }

  return reject(
    "Ação desconhecida.",
  )
}