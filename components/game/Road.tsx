"use client"

import { TILE_SIZE } from "@/lib/game/constants"
import { getBuilding } from "@/lib/game/buildings"

// A road is a flat asphalt tile with light-gray curbs on the sides and a
// dashed center line. Kept separate from Building so the visual language for
// infrastructure stays consistent.
export function Road({ position }: { position: [number, number, number] }) {
  const def = getBuilding("ROAD")
  const size = TILE_SIZE * 0.98

  return (
    <group position={position}>
      {/* asphalt */}
      <mesh receiveShadow position={[0, def.height / 2, 0]}>
        <boxGeometry args={[size, def.height, size]} />
        <meshStandardMaterial color={def.color} flatShading />
      </mesh>

      {/* curbs on the left/right edges */}
      {[-size / 2 + 0.05, size / 2 - 0.05].map((x) => (
        <mesh key={x} position={[x, def.height + 0.015, 0]}>
          <boxGeometry args={[0.08, 0.05, size]} />
          <meshStandardMaterial color="#9aa0a6" flatShading />
        </mesh>
      ))}

      {/* center lane markings */}
      {[-0.3, 0, 0.3].map((z) => (
        <mesh key={z} position={[0, def.height + 0.006, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 0.18]} />
          <meshStandardMaterial color="#e8c33a" />
        </mesh>
      ))}
    </group>
  )
}
