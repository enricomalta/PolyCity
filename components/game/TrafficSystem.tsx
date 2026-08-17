"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

import type { Building } from "@/types/city"
import { tileToWorld } from "@/lib/game/constants"

import {
  findRoadPath,
  findSpawnPoints,
  findVacantConnectedHouses,
  findWorkTripRoutes,
  type Coord,
} from "@/lib/game/traffic"
// Quantos tiles por segundo o carro percorre.
const CAR_SPEED = 2.4

// Intervalo (em segundos) entre tentativas de spawnar um novo carro.
const SPAWN_INTERVAL_MIN = 4
const SPAWN_INTERVAL_MAX = 9

// Quantos carros podem estar circulando ao mesmo tempo.
const MAX_CARS = 6

interface ActiveCar {
  id: string
  path: Coord[]
  houseX: number
  houseZ: number
  homeBuildingId?: string
  workplaceId?: string
  tripType: "OCCUPY" | "WORK" | "HOME"
}

let carSeq = 0

// Renderiza e anima o tráfego. Não desenha nada quando não há pontos de
// entrada (nenhuma rodovia tocando a borda do mapa) ou nenhuma casa vaga
// alcançável — nesse caso simplesmente não spawna carros, silenciosamente.
export function TrafficSystem({
  buildings,
  occupyHouse,
}: {
  buildings: Building[]
  occupyHouse: (
    x: number,
    z: number,
  ) => Promise<void>
}) {
  const [cars, setCars] = useState<
    ActiveCar[]
  >([])

  // Espelha `cars` num ref pra o loop de spawn (rodando fora do ciclo de
  // render, num setTimeout) sempre ver a contagem atual sem precisar
  // reiniciar o agendamento a cada carro que entra/sai.
  const carsRef = useRef<ActiveCar[]>([])

  useEffect(() => {
    carsRef.current = cars
  }, [cars])

  // Casas "reservadas" por um carro a caminho, pra dois carros não mirarem
  // a mesma casa vaga ao mesmo tempo.
  const claimedHouses = useRef<Set<string>>(
    new Set(),
  )

  const spawnPoints = useMemo(
    () => findSpawnPoints(buildings),
    [buildings],
  )

  const vacantHouses = useMemo(
    () =>
      findVacantConnectedHouses(
        buildings,
      ),
    [buildings],
  )

  const workTripRoutes = useMemo(
    () => findWorkTripRoutes(buildings),
    [buildings],
  )

  // Casas que sumiram (demolidas, ou já ocupadas por outro caminho) não
  // continuam reservadas indefinidamente.
  useEffect(() => {
    const validKeys = new Set<string>()

    for (const house of vacantHouses) {
      validKeys.add(
        `${house.x}:${house.z}`,
      )
    }

    for (const trip of workTripRoutes) {
      validKeys.add(
        `${trip.buildingId}:WORK`,
      )
    }

    for (const key of Array.from(
      claimedHouses.current,
    )) {
      if (!validKeys.has(key)) {
        claimedHouses.current.delete(key)
      }
    }
  }, [vacantHouses, workTripRoutes])

  /*
   * Spawn loop.
   *
   * Priority:
   *
   * 1. New residents entering the city.
   * 2. Existing residents going to work.
   */
  useEffect(() => {
    let cancelled = false
    let timeoutId: number

    function trySpawn() {
      if (spawnPoints.length === 0) {
        return
      }

      if (
        carsRef.current.length >= MAX_CARS
      ) {
        return
      }

      // ---------------------------------------------------------------
      // ESTÁGIO 0 — novo morador entrando na cidade
      // ---------------------------------------------------------------

      const availableHouses =
        vacantHouses.filter(
          (house) =>
            !claimedHouses.current.has(
              `${house.x}:${house.z}`,
            ),
        )

      if (availableHouses.length > 0) {
        const spawn =
          spawnPoints[
            Math.floor(
              Math.random() *
                spawnPoints.length,
            )
          ]

        const house =
          availableHouses[
            Math.floor(
              Math.random() *
                availableHouses.length,
            )
          ]

        const path = findRoadPath(
          spawn.intoX,
          spawn.intoZ,
          house.roadX,
          house.roadZ,
          buildings,
        )

        if (
          path &&
          path.length > 0
        ) {
          const houseKey =
            `${house.x}:${house.z}`

          claimedHouses.current.add(
            houseKey,
          )

          carSeq += 1

          setCars((prev) => [
            ...prev,
            {
              id: `car_${carSeq}`,
              path: [
                {
                  x: spawn.x,
                  z: spawn.z,
                },
                ...path,
              ],
              houseX: house.x,
              houseZ: house.z,
              tripType: "OCCUPY",
            },
          ])

          return
        }
      }

      // ---------------------------------------------------------------
      // ESTÁGIO 1 — morador saindo de casa para trabalhar
      // ---------------------------------------------------------------

      const availableTrips =
        workTripRoutes.filter(
          (trip) =>
            !claimedHouses.current.has(
              `${trip.buildingId}:WORK`,
            ),
        )

      if (availableTrips.length === 0) {
        return
      }

      const trip =
        availableTrips[
          Math.floor(
            Math.random() *
              availableTrips.length,
          )
        ]

      claimedHouses.current.add(
        `${trip.buildingId}:WORK`,
      )

      carSeq += 1

      setCars((prev) => [
        ...prev,
        {
          id: `car_${carSeq}`,
          path: trip.path,
          houseX: trip.homeRoadX,
          houseZ: trip.homeRoadZ,
          homeBuildingId: trip.buildingId,
          workplaceId: trip.workplaceId,
          tripType: "WORK",
        },
      ])
    }

    function scheduleNext() {
      const delaySeconds =
        SPAWN_INTERVAL_MIN +
        Math.random() *
          (SPAWN_INTERVAL_MAX -
            SPAWN_INTERVAL_MIN)

      timeoutId =
        window.setTimeout(() => {
          if (cancelled) return

          trySpawn()
          scheduleNext()
        }, delaySeconds * 1000)
    }

    scheduleNext()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }

    // O loop reinicia apenas quando a malha
    // ou os destinos realmente mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    spawnPoints,
    vacantHouses,
    workTripRoutes,
    buildings,
  ])

  function handleArrive(car: ActiveCar) {
    setCars((prev) =>
      prev.filter(
        (c) => c.id !== car.id,
      ),
    )

    if (car.tripType === "OCCUPY") {
      claimedHouses.current.delete(
        `${car.houseX}:${car.houseZ}`,
      )

      void occupyHouse(
        car.houseX,
        car.houseZ,
      )

      return
    }

    if (car.tripType === "WORK") {
      claimedHouses.current.delete(
        `${car.homeBuildingId}:WORK`,
      )

      if (!car.homeBuildingId || !car.workplaceId) {
        return
      }

      const trip = workTripRoutes.find(
        (t) =>
          t.buildingId === car.homeBuildingId &&
          t.workplaceId === car.workplaceId,
      )

      if (!trip) {
        return
      }

      claimedHouses.current.add(
        `${car.homeBuildingId}:HOME`,
      )

      carSeq += 1

      setCars((prev) => [
        ...prev,
        {
          id: `car_${carSeq}`,
          path: [...trip.path].reverse(),
          houseX: trip.homeRoadX,
          houseZ: trip.homeRoadZ,
          homeBuildingId:
            trip.buildingId,
          workplaceId:
            trip.workplaceId,
          tripType: "HOME",
        },
      ])

      return
    }

    if (car.tripType === "HOME") {
      claimedHouses.current.delete(
        `${car.homeBuildingId}:HOME`,
      )

      return
    }
  }

  return (
    <>
      {cars.map((car) => (
        <Car
          key={car.id}
          path={car.path}
          onArrive={() =>
            handleArrive(car)
          }
        />
      ))}
    </>
  )
}
// Um único carro. Anima sua posição imperativamente via useFrame (sem
// re-render React a cada frame — mesmo princípio de performance do resto
// do jogo), avançando por segmentos do caminho de tile em tile.

/*
 * Retorna a primeira rua adjacente ao prédio.
 */
function findWorkplaceRoad(
  workplace: Building,
  buildings: Building[],
): Coord | null {
  const neighbors: Coord[] = [
    {
      x: workplace.x,
      z: workplace.z - 1,
    },
    {
      x: workplace.x + 1,
      z: workplace.z,
    },
    {
      x: workplace.x,
      z: workplace.z + 1,
    },
    {
      x: workplace.x - 1,
      z: workplace.z,
    },
  ]

  for (const neighbor of neighbors) {
    const road = buildings.find(
      (building) =>
        building.type === "ROAD" &&
        building.x === neighbor.x &&
        building.z === neighbor.z,
    )

    if (road) {
      return neighbor
    }
  }

  return null
}

function Car({
  path,
  onArrive,
}: {
  path: Coord[]
  onArrive: () => void
}) {
  const groupRef =
    useRef<THREE.Group>(null)

  const segmentRef = useRef(0)
  const progressRef = useRef(0)
  const arrivedRef = useRef(false)

  const worldPath = useMemo(
    () =>
      path.map((p) => ({
        x: tileToWorld(p.x),
        z: tileToWorld(p.z),
      })),
    [path],
  )

  useFrame((_, delta) => {
    if (
      arrivedRef.current ||
      !groupRef.current ||
      worldPath.length < 2
    ) {
      return
    }

    let from =
      worldPath[
        segmentRef.current
      ]

    let to =
      worldPath[
        segmentRef.current + 1
      ]

    if (!to) {
      arrivedRef.current = true
      onArrive()
      return
    }

    const segLength =
      Math.hypot(
        to.x - from.x,
        to.z - from.z,
      ) || 1

    progressRef.current +=
      (CAR_SPEED * delta) /
      segLength

    if (
      progressRef.current >= 1
    ) {
      progressRef.current = 0
      segmentRef.current += 1

      if (
        segmentRef.current >=
        worldPath.length - 1
      ) {
        const last =
          worldPath[
            worldPath.length - 1
          ]

        groupRef.current.position.set(
          last.x,
          0.12,
          last.z,
        )

        arrivedRef.current = true
        onArrive()
        return
      }

      from =
        worldPath[
          segmentRef.current
        ]

      to =
        worldPath[
          segmentRef.current + 1
        ]
    }

    const x =
      from.x +
      (to.x - from.x) *
        progressRef.current

    const z =
      from.z +
      (to.z - from.z) *
        progressRef.current

    groupRef.current.position.set(
      x,
      0.12,
      z,
    )

    groupRef.current.rotation.y =
      Math.atan2(
        to.x - from.x,
        to.z - from.z,
      )
  })

  const start =
    worldPath[0] ?? {
      x: 0,
      z: 0,
    }

  return (
    <group
      ref={groupRef}
      position={[
        start.x,
        0.12,
        start.z,
      ]}
    >
      <mesh
        castShadow
        position={[0, 0.05, 0]}
      >
        <boxGeometry
          args={[
            0.34,
            0.16,
            0.55,
          ]}
        />

        <meshStandardMaterial
          color="#d64545"
          flatShading
        />
      </mesh>

      <mesh
        position={[0, 0.13, -0.03]}
      >
        <boxGeometry
          args={[
            0.26,
            0.1,
            0.28,
          ]}
        />

        <meshStandardMaterial
          color="#cfe8ff"
          flatShading
        />
      </mesh>
    </group>
  )
}