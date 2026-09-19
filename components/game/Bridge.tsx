"use client"

import { useMemo } from "react"
import { TILE_SIZE } from "@/lib/game/constants"
import { createRoadShape, RoadCurbs } from "./Road"
import { getRoadConnectionMask, getRoadShape, ROAD_E, ROAD_N, ROAD_S, ROAD_W } from "@/lib/game/roadAutoTile"
import type { Building } from "@/types/city"

interface BridgeProps {
  position: [number, number, number]
  x: number
  z: number
  buildings: Building[]
}

const BRIDGE_HEIGHT = 0.32
const ROAD_HEIGHT = 0.06
const BRIDGE_WIDTH = TILE_SIZE * 0.52
const BRIDGE_THICKNESS = 0.05
const RAMP_ANGLE = Math.atan2(BRIDGE_HEIGHT - ROAD_HEIGHT, TILE_SIZE)

function tileKey(x: number, z: number) {
  return `${x}:${z}`
}

function isBridgeAt(buildings: Building[], x: number, z: number) {
  return buildings.some((building) => building.type === "BRIDGE" && building.x === x && building.z === z)
}

function isRoadAt(buildings: Building[], x: number, z: number) {
  return buildings.some((building) => building.type === "ROAD" && building.x === x && building.z === z)
}

export function Bridge({ position, x, z, buildings }: BridgeProps) {
  const roads = useMemo(() => {
    const set = new Set<string>()
    for (const building of buildings) {
      if ((building.type === "ROAD" || building.type === "BRIDGE") && !building.closed && building.roadCondition !== "CLOSED") {
        set.add(tileKey(building.x, building.z))
      }
    }
    return set
  }, [buildings])

  const neighbors = useMemo(() => ({
    n: isBridgeAt(buildings, x, z - 1),
    e: isBridgeAt(buildings, x + 1, z),
    s: isBridgeAt(buildings, x, z + 1),
    w: isBridgeAt(buildings, x - 1, z),
    roadN: isRoadAt(buildings, x, z - 1),
    roadE: isRoadAt(buildings, x + 1, z),
    roadS: isRoadAt(buildings, x, z + 1),
    roadW: isRoadAt(buildings, x - 1, z),
  }), [buildings, x, z])

  const mask = getRoadConnectionMask(x, z, roads)
  const vertical = mask === (ROAD_N | ROAD_S) || mask === ROAD_N || mask === ROAD_S
  const horizontal = mask === (ROAD_E | ROAD_W) || mask === ROAD_E || mask === ROAD_W
  const bridgeNeighborCount = Number(neighbors.n) + Number(neighbors.e) + Number(neighbors.s) + Number(neighbors.w)
  const roadDirection = neighbors.roadN ? "N" : neighbors.roadE ? "E" : neighbors.roadS ? "S" : neighbors.roadW ? "W" : null
  const rampDirection = roadDirection
  const isRamp = Boolean(rampDirection) && bridgeNeighborCount <= 1 && (vertical || horizontal)

  let rampRotation: [number, number, number] = [0, 0, 0]
  if (isRamp && rampDirection) {
    if (vertical) rampRotation = [rampDirection === "N" ? -RAMP_ANGLE : RAMP_ANGLE, 0, 0]
    else rampRotation = [0, 0, rampDirection === "W" ? RAMP_ANGLE : -RAMP_ANGLE]
  }

  const surfaceY = isRamp ? (ROAD_HEIGHT + BRIDGE_HEIGHT) / 2 : BRIDGE_HEIGHT + 0.002
  const deckTopY = surfaceY - 0.002
  const shape = useMemo(() => createRoadShape(mask, TILE_SIZE * 0.98, 0.52), [mask])
  const roadShape = getRoadShape(mask)

  return (
    <group position={position}>
      <group rotation={isRamp ? rampRotation : [0, 0, 0]}>
        <mesh position={[0, deckTopY - BRIDGE_THICKNESS / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[TILE_SIZE * 0.98, BRIDGE_THICKNESS, TILE_SIZE * 0.98]} />
          <meshStandardMaterial color="#59636f" flatShading />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, surfaceY, 0]} receiveShadow>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial color="#59636f" flatShading />
        </mesh>
        <RoadCurbs mask={mask} shape={roadShape} size={TILE_SIZE * 0.98} height={surfaceY} />
      </group>
    </group>
  )
}
