"use client"

import { memo } from "react"
import type { BuildingType } from "@/types/game"
import { getBuilding } from "@/lib/game/buildings"
import { Tree } from "./Tree"

// Low-poly building models composed from primitive geometry. Each type has a
// small, recognizable silhouette. flatShading gives the faceted poly look.
function Model({ type }: { type: BuildingType }) {
  const def = getBuilding(type)
  const c = def.color
  const roof = def.roofColor ?? c

  switch (type) {
    case "HOUSE":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, def.height / 2, 0]}>
            <boxGeometry args={[0.7, def.height, 0.7]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.18, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.62, 0.42, 4]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
        </group>
      )
    case "SMALL_APARTMENT":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, def.height / 2, 0]}>
            <boxGeometry args={[0.72, def.height, 0.72]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          {/* window bands */}
          {[0.5, 0.95, 1.4].map((y) => (
            <mesh key={y} position={[0, y, 0.37]}>
              <boxGeometry args={[0.5, 0.14, 0.02]} />
              <meshStandardMaterial color="#4a5a72" flatShading />
            </mesh>
          ))}
          <mesh castShadow position={[0, def.height + 0.05, 0]}>
            <boxGeometry args={[0.76, 0.1, 0.76]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
        </group>
      )
    case "SHOP":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, def.height / 2, 0]}>
            <boxGeometry args={[0.8, def.height, 0.8]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.06, 0]}>
            <boxGeometry args={[0.86, 0.12, 0.86]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          {/* awning */}
          <mesh position={[0, 0.35, 0.42]} rotation={[Math.PI / 2.6, 0, 0]}>
            <planeGeometry args={[0.7, 0.22]} />
            <meshStandardMaterial color="#e8963a" side={2} flatShading />
          </mesh>
        </group>
      )
    case "FACTORY":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, def.height / 2, 0]}>
            <boxGeometry args={[0.82, def.height, 0.82]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0.22, def.height + 0.2, -0.15]}>
            <cylinderGeometry args={[0.1, 0.12, 0.5, 6]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[-0.05, def.height + 0.12, 0.1]}>
            <cylinderGeometry args={[0.08, 0.1, 0.34, 6]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
        </group>
      )
    case "PARK":
      return (
        <group>
          <mesh receiveShadow position={[0, def.height / 2, 0]}>
            <boxGeometry args={[0.9, def.height, 0.9]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <Tree position={[-0.2, def.height, -0.2]} scale={0.8} />
          <Tree position={[0.22, def.height, 0.18]} scale={1} />
        </group>
      )
    case "POWER_PLANT":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, def.height / 2, 0]}>
            <boxGeometry args={[0.85, def.height, 0.85]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          {[-0.2, 0.2].map((x) => (
            <mesh key={x} castShadow position={[x, def.height + 0.28, -0.1]}>
              <cylinderGeometry args={[0.13, 0.16, 0.56, 8]} />
              <meshStandardMaterial color={roof} flatShading />
            </mesh>
          ))}
        </group>
      )
    case "WATER_TOWER":
      return (
        <group>
          {/* legs */}
          {[
            [-0.25, -0.25],
            [0.25, -0.25],
            [-0.25, 0.25],
            [0.25, 0.25],
          ].map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0.45, z]}>
              <cylinderGeometry args={[0.04, 0.04, 0.9, 5]} />
              <meshStandardMaterial color={roof} flatShading />
            </mesh>
          ))}
          <mesh castShadow position={[0, 1.05, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.55, 10]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, 1.42, 0]}>
            <coneGeometry args={[0.36, 0.3, 10]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

// A placed building. Memoized because most re-renders come from unrelated UI
// state; the model only needs to re-render when its identity changes.
export const Building = memo(function Building({
  type,
  position,
  rotation = 0,
}: {
  type: BuildingType
  position: [number, number, number]
  rotation?: number
}) {
  return (
    <group position={position} rotation={[0, (rotation * Math.PI) / 2, 0]}>
      <Model type={type} />
    </group>
  )
})
