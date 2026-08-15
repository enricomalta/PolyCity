"use client"

// Simple low-poly tree: a trunk + a couple of stacked cones. Flat shading
// keeps the faceted "poly" look.
export function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.3, 5]} />
        <meshStandardMaterial color="#7a5230" flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0]}>
        <coneGeometry args={[0.22, 0.4, 6]} />
        <meshStandardMaterial color="#3f8f47" flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0]}>
        <coneGeometry args={[0.16, 0.3, 6]} />
        <meshStandardMaterial color="#4ca554" flatShading />
      </mesh>
    </group>
  )
}
