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
  findWorkTrips,
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
    () => findVacantConnectedHouses(buildings),
    [buildings],
  )

  const workTrips = useMemo(
    () => findWorkTrips(buildings),
    [buildings],
  )

  // Casas que sumiram (demolidas, ou já ocupadas por outro caminho) não
  // continuam reservadas indefinidamente.
  useEffect(() => {
    const validKeys = new Set(
      vacantHouses.map(
        (h) => `${h.x}:${h.z}`,
      ),
    )

    for (const key of Array.from(
      claimedHouses.current,
    )) {
      if (!validKeys.has(key)) {
        claimedHouses.current.delete(key)
      }
    }
  }, [vacantHouses])

  useEffect(() => {
    let cancelled = false
    let timeoutId: number

    function trySpawn() {
      if (spawnPoints.length === 0) return

      if (
        carsRef.current.length >= MAX_CARS
      ) {
        return
      }

      // -------------------------------------------------------------------------
      // ESTÁGIO 0 — carros entrando na cidade para ocupar casas
      // -------------------------------------------------------------------------

      const availableHouses =
        vacantHouses.filter(
          (h) =>
            !claimedHouses.current.has(
              `${h.x}:${h.z}`,
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
          claimedHouses.current.add(
            `${house.x}:${house.z}`,
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

      // -------------------------------------------------------------------------
      // ESTÁGIO 1 — moradores indo trabalhar
      // -------------------------------------------------------------------------

      const availableTrips =
        workTrips.filter(
          (trip) =>
            !claimedHouses.current.has(
              `${trip.buildingId}:WORK`,
            ),
        )

      if (
        availableTrips.length === 0
      ) {
        return
      }

      const trip =
        availableTrips[
          Math.floor(
            Math.random() *
              availableTrips.length,
          )
        ]

      const spawn = spawnPoints[
        Math.floor(
          Math.random() *
            spawnPoints.length,
        )
      ]

      const path = findRoadPath(
        spawn.intoX,
        spawn.intoZ,
        trip.roadX,
        trip.roadZ,
        buildings,
      )

      if (
        !path ||
        path.length === 0
      ) {
        return
      }

      claimedHouses.current.add(
        `${trip.buildingId}:WORK`,
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
          houseX: trip.x,
          houseZ: trip.z,
          workplaceId:
            trip.workplaceId,
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

      timeoutId = window.setTimeout(() => {
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
    // Recalcula o agendamento só quando a malha viária/casas disponíveis
    // mudam de verdade (build/demolish) — não a cada carro que entra/sai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnPoints, vacantHouses, buildings])

  function handleArrive(
    car: ActiveCar,
  ) {
    setCars((prev) =>
      prev.filter(
        (c) => c.id !== car.id,
      ),
    )

    if (
      car.tripType === "OCCUPY"
    ) {
      claimedHouses.current.delete(
        `${car.houseX}:${car.houseZ}`,
      )

      void occupyHouse(
        car.houseX,
        car.houseZ,
      )

      return
    }

    if (
      car.tripType === "WORK"
    ) {
      claimedHouses.current.delete(
        `${car.houseX}:WORK`,
      )

      return
    }

    if (
      car.tripType === "HOME"
    ) {
      claimedHouses.current.delete(
        `${car.houseX}:HOME`,
      )
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

    let from = worldPath[segmentRef.current]
    let to =
      worldPath[segmentRef.current + 1]

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
      (CAR_SPEED * delta) / segLength

    if (progressRef.current >= 1) {
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

      from = worldPath[segmentRef.current]
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

  const start = worldPath[0] ?? {
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
          args={[0.34, 0.16, 0.55]}
        />
        <meshStandardMaterial
          color="#d64545"
          flatShading
        />
      </mesh>

      <mesh position={[0, 0.13, -0.03]}>
        <boxGeometry
          args={[0.26, 0.1, 0.28]}
        />
        <meshStandardMaterial
          color="#cfe8ff"
          flatShading
        />
      </mesh>
    </group>
  )
}
