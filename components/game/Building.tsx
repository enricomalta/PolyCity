"use client"

import { memo } from "react"
import type { BuildingType } from "@/types/game"
import { getBuilding } from "@/lib/game/buildings"
import { Tree } from "./Tree"

const WINDOW = "#7fd0ff"
const DOOR = "#5b3a26"

// A thin plot slab so every building visually "sits" on the tile.
function Foundation({
  color = "#8a8f7a",
}: {
  color?: string
}) {
  return (
    <mesh
      receiveShadow
      position={[0, 0.03, 0]}
    >
      <boxGeometry
        args={[
          0.94,
          0.06,
          0.94,
        ]}
      />

      <meshStandardMaterial
        color={color}
        flatShading
      />
    </mesh>
  )
}

// Low-poly building models composed from primitive geometry.
function Model({
  type,
}: {
  type: BuildingType
}) {
  const def = getBuilding(type)

  const c = def.color
  const roof =
    def.roofColor ?? c

  switch (type) {
    case "HOUSE":
      return (
        <group>
          <Foundation color="#9a8f6a" />

          {/* body */}
          <mesh
            castShadow
            receiveShadow
            position={[
              0,
              def.height / 2 + 0.06,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.7,
                def.height,
                0.7,
              ]}
            />

            <meshStandardMaterial
              color={c}
              flatShading
            />
          </mesh>

          {/* pitched roof */}
          <mesh
            castShadow
            position={[
              0,
              def.height + 0.24,
              0,
            ]}
            rotation={[
              0,
              Math.PI / 4,
              0,
            ]}
          >
            <coneGeometry
              args={[
                0.62,
                0.42,
                4,
              ]}
            />

            <meshStandardMaterial
              color={roof}
              flatShading
            />
          </mesh>

          {/* door */}
          <mesh
            position={[
              0,
              0.2,
              0.36,
            ]}
          >
            <boxGeometry
              args={[
                0.16,
                0.28,
                0.02,
              ]}
            />

            <meshStandardMaterial
              color={DOOR}
              flatShading
            />
          </mesh>

          {/* windows */}
          {[-0.2, 0.2].map(
            (x) => (
              <mesh
                key={x}
                position={[
                  x,
                  0.42,
                  0.36,
                ]}
              >
                <boxGeometry
                  args={[
                    0.14,
                    0.14,
                    0.02,
                  ]}
                />

                <meshStandardMaterial
                  color={WINDOW}
                  emissive={WINDOW}
                  emissiveIntensity={
                    0.15
                  }
                  flatShading
                />
              </mesh>
            ),
          )}
        </group>
      )

    case "SMALL_APARTMENT":
      return (
        <group>
          <Foundation color="#b7b0a2" />

          <mesh
            castShadow
            receiveShadow
            position={[
              0,
              def.height / 2 + 0.06,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.72,
                def.height,
                0.72,
              ]}
            />

            <meshStandardMaterial
              color={c}
              flatShading
            />
          </mesh>

          {/* window grid on the front face */}
          {[0.45, 0.85, 1.25].map(
            (y) =>
              [-0.18, 0.18].map(
                (x) => (
                  <mesh
                    key={`${y}-${x}`}
                    position={[
                      x,
                      y,
                      0.37,
                    ]}
                  >
                    <boxGeometry
                      args={[
                        0.2,
                        0.16,
                        0.02,
                      ]}
                    />

                    <meshStandardMaterial
                      color={WINDOW}
                      emissive={WINDOW}
                      emissiveIntensity={
                        0.12
                      }
                      flatShading
                    />
                  </mesh>
                ),
              ),
          )}

          <mesh
            castShadow
            position={[
              0,
              def.height + 0.11,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.76,
                0.1,
                0.76,
              ]}
            />

            <meshStandardMaterial
              color={roof}
              flatShading
            />
          </mesh>
        </group>
      )

    case "SHOP":
      return (
        <group>
          <Foundation color="#7a8f95" />

          <mesh
            castShadow
            receiveShadow
            position={[
              0,
              def.height / 2 + 0.06,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.8,
                def.height,
                0.8,
              ]}
            />

            <meshStandardMaterial
              color={c}
              flatShading
            />
          </mesh>

          {/* storefront glass */}
          <mesh
            position={[
              0,
              0.32,
              0.41,
            ]}
          >
            <boxGeometry
              args={[
                0.6,
                0.34,
                0.02,
              ]}
            />

            <meshStandardMaterial
              color={WINDOW}
              emissive={WINDOW}
              emissiveIntensity={
                0.2
              }
              flatShading
            />
          </mesh>

          <mesh
            castShadow
            position={[
              0,
              def.height + 0.06,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.86,
                0.12,
                0.86,
              ]}
            />

            <meshStandardMaterial
              color={roof}
              flatShading
            />
          </mesh>

          {/* awning */}
          <mesh
            position={[
              0,
              0.56,
              0.44,
            ]}
            rotation={[
              Math.PI / 2.6,
              0,
              0,
            ]}
          >
            <planeGeometry
              args={[
                0.72,
                0.22,
              ]}
            />

            <meshStandardMaterial
              color="#e8963a"
              side={2}
              flatShading
            />
          </mesh>
        </group>
      )

    case "FACTORY":
      return (
        <group>
          <Foundation color="#6f747a" />

          <mesh
            castShadow
            receiveShadow
            position={[
              0,
              def.height / 2 + 0.06,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.82,
                def.height,
                0.82,
              ]}
            />

            <meshStandardMaterial
              color={c}
              flatShading
            />
          </mesh>

          {/* sawtooth-ish roof block */}
          <mesh
            castShadow
            position={[
              0,
              def.height + 0.11,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.86,
                0.12,
                0.86,
              ]}
            />

            <meshStandardMaterial
              color={roof}
              flatShading
            />
          </mesh>

          {[0.22, -0.05].map(
            (x, i) => (
              <mesh
                key={x}
                castShadow
                position={[
                  x,
                  def.height + 0.28,
                  i === 0
                    ? -0.15
                    : 0.1,
                ]}
              >
                <cylinderGeometry
                  args={[
                    0.09,
                    0.12,
                    0.5,
                    6,
                  ]}
                />

                <meshStandardMaterial
                  color="#3f4249"
                  flatShading
                />
              </mesh>
            ),
          )}
        </group>
      )

    case "PARK":
      return (
        <group>
          <mesh
            receiveShadow
            position={[
              0,
              def.height / 2 + 0.03,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.92,
                def.height,
                0.92,
              ]}
            />

            <meshStandardMaterial
              color={c}
              flatShading
            />
          </mesh>

          {/* winding path */}
          <mesh
            rotation={[
              -Math.PI / 2,
              0,
              0,
            ]}
            position={[
              0,
              def.height + 0.04,
              0,
            ]}
          >
            <planeGeometry
              args={[
                0.18,
                0.9,
              ]}
            />

            <meshStandardMaterial
              color="#cbb487"
            />
          </mesh>

          <Tree
            position={[
              -0.22,
              def.height,
              -0.2,
            ]}
            scale={0.8}
          />

          <Tree
            position={[
              0.24,
              def.height,
              0.18,
            ]}
            scale={1}
          />

          <Tree
            position={[
              0.2,
              def.height,
              -0.28,
            ]}
            scale={0.6}
          />
        </group>
      )

    case "POWER_PLANT":
      return (
        <group>
          <Foundation color="#6f5a3a" />

          <mesh
            castShadow
            receiveShadow
            position={[
              0,
              def.height / 2 + 0.06,
              0,
            ]}
          >
            <boxGeometry
              args={[
                0.85,
                def.height,
                0.85,
              ]}
            />

            <meshStandardMaterial
              color={c}
              flatShading
            />
          </mesh>

          {[-0.2, 0.2].map(
            (x) => (
              <group key={x}>
                <mesh
                  castShadow
                  position={[
                    x,
                    def.height + 0.34,
                    -0.1,
                  ]}
                >
                  <cylinderGeometry
                    args={[
                      0.13,
                      0.16,
                      0.68,
                      8,
                    ]}
                  />

                  <meshStandardMaterial
                    color={roof}
                    flatShading
                  />
                </mesh>

                {/* smoke cap */}
                <mesh
                  position={[
                    x,
                    def.height + 0.7,
                    -0.1,
                  ]}
                >
                  <cylinderGeometry
                    args={[
                      0.16,
                      0.13,
                      0.08,
                      8,
                    ]}
                  />

                  <meshStandardMaterial
                    color="#2c2f33"
                    flatShading
                  />
                </mesh>
              </group>
            ),
          )}
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
          ].map(
            ([x, z], i) => (
              <mesh
                key={i}
                castShadow
                position={[
                  x,
                  0.45,
                  z,
                ]}
                rotation={[
                  0,
                  0,
                  x > 0
                    ? -0.08
                    : 0.08,
                ]}
              >
                <cylinderGeometry
                  args={[
                    0.04,
                    0.04,
                    0.9,
                    5,
                  ]}
                />

                <meshStandardMaterial
                  color={roof}
                  flatShading
                />
              </mesh>
            ),
          )}

          <mesh
            castShadow
            position={[
              0,
              1.05,
              0,
            ]}
          >
            <cylinderGeometry
              args={[
                0.34,
                0.34,
                0.55,
                10,
              ]}
            />

            <meshStandardMaterial
              color={c}
              flatShading
            />
          </mesh>

          <mesh
            castShadow
            position={[
              0,
              1.42,
              0,
            ]}
          >
            <coneGeometry
              args={[
                0.36,
                0.3,
                10,
              ]}
            />

            <meshStandardMaterial
              color={roof}
              flatShading
            />
          </mesh>
        </group>
      )

    default:
      return null
  }
}

// A placed building.
export const BuildingMesh = memo(
  function Building({
    type,
    position,
    rotation = 0,
  }: {
    type: BuildingType
    position: [
      number,
      number,
      number,
    ]
    rotation?: number
  }) {
    return (
      <group
        position={position}
        rotation={[
          0,
          (rotation *
            Math.PI) /
            2,
          0,
        ]}
      >
        <Model type={type} />
      </group>
    )
  },
)