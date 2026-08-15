"use client"

import { TILE_SIZE } from "@/lib/game/constants"
import { getBuilding } from "@/lib/game/buildings"

// A road is a flat tile with a dashed center line. Kept separate from
// Building so the visual language for infrastructure stays consistent.
export function Road({ position }: { position: [number, number, number] }) {
  const def = getBuilding("ROAD")
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, def.height / 2, 0]}>
        <boxGeometry args={[TILE_SIZE * 0.98, def.height, TILE_SIZE * 0.98]} />
        <meshStandardMaterial color={def.color} flatShading />
      </mesh>
      {/* center lane markings */}
      {[-0.3, 0, 0.3].map((z) => (
        <mesh key={z} position={[0, def.height + 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 0.18]} />
          <meshStandardMaterial color="#e8c33a" />
        </mesh>
      ))}
    </group>
  )
}
