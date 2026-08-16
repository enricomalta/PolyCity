"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { TILE_SIZE } from "@/lib/game/constants"
import { getBuilding } from "@/lib/game/buildings"
import { getRoadAutoTile } from "@/lib/game/roadAutoTile"

interface RoadProps {
  position: [number, number, number]
  x: number
  z: number
  roads: Set<string>
}

const ROAD_N = 1
const ROAD_E = 2
const ROAD_S = 4
const ROAD_W = 8

const CURB_WIDTH = 0.08
const CURB_HEIGHT = 0.05
const CURB_OFFSET = 0.05
const CURB_Y_OFFSET = 0.015

function createRoadShape(
  mask: number,
  size: number,
): THREE.Shape {
  const half = size / 2
  const width = size * 0.42
  const halfWidth = width / 2

  const shape = new THREE.Shape()

  const hasN = (mask & ROAD_N) !== 0
  const hasE = (mask & ROAD_E) !== 0
  const hasS = (mask & ROAD_S) !== 0
  const hasW = (mask & ROAD_W) !== 0

  /*
   * ---------------------------------------------------------------
   * CROSS
   * ---------------------------------------------------------------
   */

  if (hasN && hasE && hasS && hasW) {
    shape.moveTo(-halfWidth, -half)
    shape.lineTo(halfWidth, -half)
    shape.lineTo(halfWidth, -halfWidth)
    shape.lineTo(half, -halfWidth)
    shape.lineTo(half, halfWidth)
    shape.lineTo(halfWidth, halfWidth)
    shape.lineTo(halfWidth, half)
    shape.lineTo(-halfWidth, half)
    shape.lineTo(-halfWidth, halfWidth)
    shape.lineTo(-half, halfWidth)
    shape.lineTo(-half, -halfWidth)
    shape.lineTo(-halfWidth, -halfWidth)
    shape.closePath()

    return shape
  }

  /*
   * ---------------------------------------------------------------
   * T
   * ---------------------------------------------------------------
   */

  const connectionCount =
    Number(hasN) +
    Number(hasE) +
    Number(hasS) +
    Number(hasW)

  if (connectionCount === 3) {
    if (!hasN) {
      // E + S + W
      shape.moveTo(-half, -halfWidth)
      shape.lineTo(-halfWidth, -halfWidth)
      shape.lineTo(-halfWidth, half)
      shape.lineTo(halfWidth, half)
      shape.lineTo(halfWidth, -halfWidth)
      shape.lineTo(half, -halfWidth)
      shape.lineTo(half, halfWidth)
      shape.lineTo(-half, halfWidth)
      shape.lineTo(-half, -halfWidth)
      shape.closePath()
    } else if (!hasE) {
      // N + S + W
      shape.moveTo(-halfWidth, -half)
      shape.lineTo(halfWidth, -half)
      shape.lineTo(halfWidth, -halfWidth)
      shape.lineTo(-half, -halfWidth)
      shape.lineTo(-half, halfWidth)
      shape.lineTo(-halfWidth, halfWidth)
      shape.lineTo(-halfWidth, half)
      shape.lineTo(halfWidth, half)
      shape.lineTo(halfWidth, halfWidth)
      shape.lineTo(-halfWidth, halfWidth)
      shape.closePath()
    } else if (!hasS) {
      // N + E + W
      shape.moveTo(-halfWidth, -half)
      shape.lineTo(halfWidth, -half)
      shape.lineTo(halfWidth, -halfWidth)
      shape.lineTo(half, -halfWidth)
      shape.lineTo(half, halfWidth)
      shape.lineTo(halfWidth, halfWidth)
      shape.lineTo(halfWidth, half)
      shape.lineTo(-halfWidth, half)
      shape.closePath()
    } else {
      // N + E + S
      shape.moveTo(-halfWidth, -half)
      shape.lineTo(halfWidth, -half)
      shape.lineTo(halfWidth, halfWidth)
      shape.lineTo(half, halfWidth)
      shape.lineTo(half, -halfWidth)
      shape.lineTo(halfWidth, -halfWidth)
      shape.lineTo(halfWidth, half)
      shape.lineTo(-halfWidth, half)
      shape.closePath()
    }

    return shape
  }

  /*
   * ---------------------------------------------------------------
   * STRAIGHT
   * ---------------------------------------------------------------
   */

  const straightVertical =
    hasN && hasS

  const straightHorizontal =
    hasE && hasW

  if (straightVertical) {
    shape.moveTo(-halfWidth, -half)
    shape.lineTo(halfWidth, -half)
    shape.lineTo(halfWidth, half)
    shape.lineTo(-halfWidth, half)
    shape.closePath()

    return shape
  }

  if (straightHorizontal) {
    shape.moveTo(-half, -halfWidth)
    shape.lineTo(half, -halfWidth)
    shape.lineTo(half, halfWidth)
    shape.lineTo(-half, halfWidth)
    shape.closePath()

    return shape
  }

  /*
   * ---------------------------------------------------------------
   * CURVES
   * ---------------------------------------------------------------
   */

  if (connectionCount === 2) {
    const outerRadius = half
    const innerRadius = half - width

    let startAngle = 0
    let endAngle = Math.PI / 2

    if (hasN && hasE) {
      startAngle = Math.PI / 2
      endAngle = Math.PI
    } else if (hasE && hasS) {
      startAngle = Math.PI
      endAngle = Math.PI * 1.5
    } else if (hasS && hasW) {
      startAngle = Math.PI * 1.5
      endAngle = Math.PI * 2
    } else if (hasW && hasN) {
      startAngle = 0
      endAngle = Math.PI / 2
    } else {
      shape.moveTo(-halfWidth, -half)
      shape.lineTo(halfWidth, -half)
      shape.lineTo(halfWidth, half)
      shape.lineTo(-halfWidth, half)
      shape.closePath()

      return shape
    }

    const steps = 12

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const angle =
        startAngle +
        (endAngle - startAngle) * t

      const x =
        Math.cos(angle) * outerRadius

      const z =
        Math.sin(angle) * outerRadius

      if (i === 0) {
        shape.moveTo(x, z)
      } else {
        shape.lineTo(x, z)
      }
    }

    for (let i = steps; i >= 0; i--) {
      const t = i / steps
      const angle =
        startAngle +
        (endAngle - startAngle) * t

      const x =
        Math.cos(angle) * innerRadius

      const z =
        Math.sin(angle) * innerRadius

      shape.lineTo(x, z)
    }

    shape.closePath()

    return shape
  }

  /*
   * ---------------------------------------------------------------
   * END / ISOLATED
   * ---------------------------------------------------------------
   */

  if (connectionCount === 1) {
    if (hasN || hasS) {
      shape.moveTo(-halfWidth, -half)
      shape.lineTo(halfWidth, -half)
      shape.lineTo(halfWidth, half)
      shape.quadraticCurveTo(
        0,
        half + halfWidth * 0.35,
        -halfWidth,
        half,
      )
      shape.closePath()

      return shape
    }

    shape.moveTo(-half, -halfWidth)
    shape.lineTo(half, -halfWidth)
    shape.quadraticCurveTo(
      half + halfWidth * 0.35,
      0,
      half,
      halfWidth,
    )
    shape.lineTo(-half, halfWidth)
    shape.closePath()

    return shape
  }

  /*
   * ---------------------------------------------------------------
   * ISOLATED
   * ---------------------------------------------------------------
   */

  shape.moveTo(-halfWidth, -half)
  shape.lineTo(halfWidth, -half)
  shape.lineTo(halfWidth, half)
  shape.lineTo(-halfWidth, half)
  shape.closePath()

  return shape
}

function RoadSurface({
  mask,
  size,
  height,
  color,
}: {
  mask: number
  size: number
  height: number
  color: string
}) {
  const shape = useMemo(
    () => createRoadShape(mask, size),
    [mask, size],
  )

  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, height + 0.001, 0]}
    >
      <shapeGeometry args={[shape]} />

      <meshStandardMaterial
        color={color}
        flatShading
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function RoadBase({
  size,
  height,
  color,
}: {
  size: number
  height: number
  color: string
}) {
  return (
    <mesh
      receiveShadow
      position={[0, height / 2, 0]}
    >
      <boxGeometry
        args={[
          size,
          height,
          size,
        ]}
      />

      <meshStandardMaterial
        color={color}
        flatShading
      />
    </mesh>
  )
}

function EndCurb({
  mask,
  size,
  height,
}: {
  mask: number
  size: number
  height: number
}) {
  const half = size / 2
  const y = height + 0.015

  // Rua continua para N → fechamento no S
  if (mask === ROAD_N) {
    return (
      <mesh position={[0, y, half - 0.05]}>
        <boxGeometry
          args={[size, 0.05, 0.08]}
        />
        <meshStandardMaterial
          color="#9aa0a6"
          flatShading
        />
      </mesh>
    )
  }

  // Rua continua para S → fechamento no N
  if (mask === ROAD_S) {
    return (
      <mesh position={[0, y, -half + 0.05]}>
        <boxGeometry
          args={[size, 0.05, 0.08]}
        />
        <meshStandardMaterial
          color="#9aa0a6"
          flatShading
        />
      </mesh>
    )
  }

  // Rua continua para E → fechamento no W
  if (mask === ROAD_E) {
    return (
      <mesh position={[-half + 0.05, y, 0]}>
        <boxGeometry
          args={[0.08, 0.05, size]}
        />
        <meshStandardMaterial
          color="#9aa0a6"
          flatShading
        />
      </mesh>
    )
  }

  // Rua continua para W → fechamento no E
  if (mask === ROAD_W) {
    return (
      <mesh position={[half - 0.05, y, 0]}>
        <boxGeometry
          args={[0.08, 0.05, size]}
        />
        <meshStandardMaterial
          color="#9aa0a6"
          flatShading
        />
      </mesh>
    )
  }

  return null
}

function CurveCurbs({
  mask,
  size,
  height,
}: {
  mask: number
  size: number
  height: number
}) {
  const half = size / 2
  const y = height + 0.015

  const curb = 0.08
  const curbHeight = 0.05
  const inset = 0.08
  /*
   * Cada curva recebe dois passeios retos.
   *
   * N + E:
   *   passeio no lado W e no lado S
   *
   * E + S:
   *   passeio no lado N e no lado W
   *
   * S + W:
   *   passeio no lado E e no lado N
   *
   * W + N:
   *   passeio no lado E e no lado S
   */

  if (mask === (ROAD_N | ROAD_E)) {
    return (
      <>
        {/* W */}
        <mesh
          position={[
            -half + 0.05,
            y,
            -half + 0.95 / 2,
          ]}
        >
          <boxGeometry
            args={[
              curb,
              curbHeight,
              size,
            ]}
          />

          <meshStandardMaterial
            color="#9aa0a6"
            flatShading
          />
        </mesh>

        {/* S */}
        <mesh
          position={[
            half -0.95 / 2,
            y,
            half - 0.05,
          ]}
        >
          <boxGeometry
            args={[
              size,
              curbHeight,
              curb,
            ]}
          />

          <meshStandardMaterial
            color="#9aa0a6"
            flatShading
          />
        </mesh>
      </>
    )
  }

  if (mask === (ROAD_E | ROAD_S)) {
    return (
      <>
        {/* N */}
        <mesh
          position={[
            -half +1 / 2,
            y,
            -half + 0.05,
          ]}
        >
          <boxGeometry
            args={[
              size,
              curbHeight,
              curb,
            ]}
          />

          <meshStandardMaterial
            color="#9aa0a6"
            flatShading
          />
        </mesh>

        {/* W */}
        <mesh
          position={[
            -half + 0.05,
            y,
            half -0.95 / 2,
          ]}
        >
          <boxGeometry
            args={[
              curb,
              curbHeight,
              size,
            ]}
          />

          <meshStandardMaterial
            color="#9aa0a6"
            flatShading
          />
        </mesh>
      </>
    )
  }

  if (mask === (ROAD_S | ROAD_W)) {
    return (
      <>
        {/* E */}
        <mesh
          position={[
            half - 0.05,
            y,
            half - 0.95 / 2,
          ]}
        >
          <boxGeometry
            args={[
              curb,
              curbHeight,
              size,
            ]}
          />

          <meshStandardMaterial
            color="#9aa0a6"
            flatShading
          />
        </mesh>

        {/* N */}
        <mesh
          position={[
            half -1 / 2,
            y,
            -half + 0.05,
          ]}
        >
          <boxGeometry
            args={[
              size,
              curbHeight,
              curb,
            ]}
          />

          <meshStandardMaterial
            color="#9aa0a6"
            flatShading
          />
        </mesh>
      </>
    )
  }

  if (mask === (ROAD_W | ROAD_N)) {
    return (
      <>
        {/* E */}
        <mesh
          position={[
            half - 0.05,
            y,
            -half + 0.95 / 2,
          ]}
        >
          <boxGeometry
            args={[
              curb,
              curbHeight,
              size,
            ]}
          />

          <meshStandardMaterial
            color="#9aa0a6"
            flatShading
          />
        </mesh>

        {/* S */}
        <mesh
          position={[
            -half + 0.95 / 2,
            y,
            half - 0.05,
          ]}
        >
          <boxGeometry
            args={[
              size,
              curbHeight,
              curb,
            ]}
          />

          <meshStandardMaterial
            color="#9aa0a6"
            flatShading
          />
        </mesh>
      </>
    )
  }

  return null
}

function TCurbs({
  mask,
  size,
  height,
}: {
  mask: number
  size: number
  height: number
}) {
  const half = size / 2
  const y = height + CURB_Y_OFFSET

  /*
   * O passeio de fechamento fica exatamente no lado
   * que NÃO possui conexão.
   */

  if (!(mask & ROAD_N)) {
    return (
      <mesh
        position={[
          0,
          y,
          -half + CURB_OFFSET,
        ]}
      >
        <boxGeometry
          args={[
            size,
            CURB_HEIGHT,
            CURB_WIDTH,
          ]}
        />

        <meshStandardMaterial
          color="#9aa0a6"
          flatShading
        />
      </mesh>
    )
  }

  if (!(mask & ROAD_E)) {
    return (
      <mesh
        position={[
          half - CURB_OFFSET,
          y,
          0,
        ]}
      >
        <boxGeometry
          args={[
            CURB_WIDTH,
            CURB_HEIGHT,
            size * 0.42,
          ]}
        />

        <meshStandardMaterial
          color="#9aa0a6"
          flatShading
        />
      </mesh>
    )
  }

  if (!(mask & ROAD_S)) {
    return (
      <mesh
        position={[
          0,
          y,
          half - CURB_OFFSET,
        ]}
      >
        <boxGeometry
          args={[
            size * 0.42,
            CURB_HEIGHT,
            CURB_WIDTH,
          ]}
        />

        <meshStandardMaterial
          color="#9aa0a6"
          flatShading
        />
      </mesh>
    )
  }

  if (!(mask & ROAD_W)) {
    return (
      <mesh
        position={[
          -half + CURB_OFFSET,
          y,
          0,
        ]}
      >
        <boxGeometry
          args={[
            CURB_WIDTH,
            CURB_HEIGHT,
            size * 0.42,
          ]}
        />

        <meshStandardMaterial
          color="#9aa0a6"
          flatShading
        />
      </mesh>
    )
  }

  return null
}

function StraightMarkings({
  size,
  height,
  horizontal,
}: {
  size: number
  height: number
  horizontal: boolean
}) {
  const positions = [-0.3, 0, 0.3]

  return (
    <>
      {positions.map((offset) => (
        <mesh
          key={offset}
          position={
            horizontal
              ? [
                  offset,
                  height + 0.006,
                  0,
                ]
              : [
                  0,
                  height + 0.006,
                  offset,
                ]
          }
          rotation={[
            -Math.PI / 2,
            0,
            horizontal
              ? Math.PI / 2
              : 0,
          ]}
        >
          <planeGeometry
            args={[
              0.08,
              0.18,
            ]}
          />

          <meshStandardMaterial
            color="#e8c33a"
          />
        </mesh>
      ))}
    </>
  )
}

export function Road({
  position,
  x,
  z,
  roads,
}: RoadProps) {
  const def = getBuilding("ROAD")

  const size = TILE_SIZE * 0.98

  const autoTile = getRoadAutoTile(
    x,
    z,
    roads,
  )

  const {
    mask,
    shape,
  } = autoTile

  const isVertical =
    mask === ROAD_N ||
    mask === ROAD_S ||
    mask === (ROAD_N | ROAD_S)

  const isHorizontal =
    mask === ROAD_E ||
    mask === ROAD_W ||
    mask === (ROAD_E | ROAD_W)

  return (
    <group position={position}>
      {/* ----------------------------------------------------------------- */}
      {/* Base                                                               */}
      {/* ----------------------------------------------------------------- */}

      <RoadBase
        size={size}
        height={def.height}
        color={def.color}
      />

      {/* ----------------------------------------------------------------- */}
      {/* AutoTile surface                                                   */}
      {/* ----------------------------------------------------------------- */}

      <RoadSurface
        mask={mask}
        size={size}
        height={def.height}
        color={def.color}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Curbs / Passeio                                                    */}
      {/* ----------------------------------------------------------------- */}

      {(shape === "STRAIGHT" || shape === "END") && isVertical && (
          <>
            <mesh
              position={[
                -size / 2 + CURB_OFFSET,
                def.height + CURB_Y_OFFSET,
                0,
              ]}
            >
              <boxGeometry
                args={[
                  CURB_WIDTH,
                  CURB_HEIGHT,
                  size,
                ]}
              />

              <meshStandardMaterial
                color="#9aa0a6"
                flatShading
              />
            </mesh>

            <mesh
              position={[
                size / 2 - CURB_OFFSET,
                def.height + CURB_Y_OFFSET,
                0,
              ]}
            >
              <boxGeometry
                args={[
                  CURB_WIDTH,
                  CURB_HEIGHT,
                  size,
                ]}
              />

              <meshStandardMaterial
                color="#9aa0a6"
                flatShading
              />
            </mesh>
          </>
        )}

      {(shape === "STRAIGHT" || shape === "END") && isHorizontal && (
          <>
            <mesh
              position={[
                0,
                def.height + CURB_Y_OFFSET,
                -size / 2 + CURB_OFFSET,
              ]}
            >
              <boxGeometry
                args={[
                  size,
                  CURB_HEIGHT,
                  CURB_WIDTH,
                ]}
              />

              <meshStandardMaterial
                color="#9aa0a6"
                flatShading
              />
            </mesh>

            <mesh
              position={[
                0,
                def.height + CURB_Y_OFFSET,
                size / 2 - CURB_OFFSET,
              ]}
            >
              <boxGeometry
                args={[
                  size,
                  CURB_HEIGHT,
                  CURB_WIDTH,
                ]}
              />

              <meshStandardMaterial
                color="#9aa0a6"
                flatShading
              />
            </mesh>
          </>
        )}

      {shape === "END" && (
        <EndCurb
          mask={mask}
          size={size}
          height={def.height}
        />
      )}

      {shape === "CURVE" && (
        <CurveCurbs
          mask={mask}
          size={size}
          height={def.height}
        />
      )}

      {shape === "T" && (
        <TCurbs
          mask={mask}
          size={size}
          height={def.height}
        />
      )}

      {shape === "ISOLATED" && (
        <>
          {/* N */}
          <mesh
            position={[
              0,
              def.height + 0.015,
              -size / 2 + 0.05,
            ]}
          >
            <boxGeometry
              args={[
                size,
                0.05,
                0.08,
              ]}
            />

            <meshStandardMaterial
              color="#9aa0a6"
              flatShading
            />
          </mesh>

          {/* S */}
          <mesh
            position={[
              0,
              def.height + 0.015,
              size / 2 - 0.05,
            ]}
          >
            <boxGeometry
              args={[
                size,
                0.05,
                0.08,
              ]}
            />

            <meshStandardMaterial
              color="#9aa0a6"
              flatShading
            />
          </mesh>

          {/* W */}
          <mesh
            position={[
              -size / 2 + 0.05,
              def.height + 0.015,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.08,
                0.05,
                size,
              ]}
            />

            <meshStandardMaterial
              color="#9aa0a6"
              flatShading
            />
          </mesh>

          {/* E */}
          <mesh
            position={[
              size / 2 - 0.05,
              def.height + 0.015,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.08,
                0.05,
                size,
              ]}
            />

            <meshStandardMaterial
              color="#9aa0a6"
              flatShading
            />
          </mesh>
        </>
      )}
      
      {/* CROSS não recebe fechamento adicional */}

      {/* ----------------------------------------------------------------- */}
      {/* Center lane markings                                               */}
      {/* ----------------------------------------------------------------- */}

      {(shape === "STRAIGHT" ||
        shape === "END") && (
        <StraightMarkings
          size={size}
          height={def.height}
          horizontal={isHorizontal}
        />
      )}
    </group>
  )
}
