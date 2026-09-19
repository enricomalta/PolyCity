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
  isNight = false,
  nightIntensity = isNight ? 1 : 0,
  occupied = false,
}: {
  type: BuildingType
  isNight?: boolean
  nightIntensity?: number
  occupied?: boolean
}) {
  const def = getBuilding(type)

  const c = def.color
  const roof = def.roofColor ?? c
  const modelType: BuildingType =
    type === "SMALL_APARTMENT" || type === "LOW_INCOME_APARTMENT" || type === "MIDDLE_INCOME_APARTMENT" || type === "HIGH_INCOME_APARTMENT" || type === "COMMERCIAL_BUILDING" || type === "HIGH_INCOME_HOUSE"
      ? "SMALL_APARTMENT"
      : ["SHOP", "GROCERY_STORE", "GAS_STATION", "CLOTHING_STORE", "CAR_DEALERSHIP", "BUILDING_SUPPLY_STORE"].includes(type)
        ? "SHOP"
        : ["FACTORY", "CONSTRUCTION_FACTORY", "AUTOMOTIVE_FACTORY", "TECH_FACTORY"].includes(type)
          ? "FACTORY"
          : ["PARK", "POWER_PLANT", "WATER_TOWER", "SEWAGE_TREATMENT_PLANT", "CEMETERY", "RELIGIOUS_CENTER", "ELEMENTARY_SCHOOL", "HIGH_SCHOOL", "UNIVERSITY", "MEDICAL_CENTER", "HOSPITAL", "POLICE_STATION", "POLICE_DEPARTMENT", "CIVIL_DEFENSE", "FIRE_STATION", "GARBAGE_COLLECTION", "BUS_STOP", "BUS_TERMINAL", "BUS_BRIDGE"].includes(type)
            ? type
            : "HOUSE"

  switch (modelType) {
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

    case "SEWAGE_TREATMENT_PLANT":
      return (
        <group>
          <Foundation color="#456c70" />
          <mesh castShadow receiveShadow position={[-0.22, def.height / 2 + 0.06, 0.08]}>
            <boxGeometry args={[0.42, def.height, 0.58]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[-0.22, def.height + 0.14, 0.08]}>
            <boxGeometry args={[0.48, 0.12, 0.64]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          {[-0.28, 0.12].map((z, index) => (
            <group key={index}>
              <mesh castShadow position={[0.2, 0.18, z]}>
                <cylinderGeometry args={[0.17, 0.19, 0.2, 16]} />
                <meshStandardMaterial color="#78aeb0" flatShading />
              </mesh>
              <mesh position={[0.2, 0.29, z]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.12, 0.025, 6, 16]} />
                <meshStandardMaterial color="#c3e2df" flatShading />
              </mesh>
            </group>
          ))}
          <mesh castShadow position={[0.38, 0.42, 0.08]}>
            <cylinderGeometry args={[0.055, 0.07, 0.52, 8]} />
            <meshStandardMaterial color="#789399" flatShading />
          </mesh>
          <mesh position={[0.38, 0.7, 0.08]}>
            <torusGeometry args={[0.08, 0.02, 6, 12]} />
            <meshStandardMaterial color="#b6d5d3" flatShading />
          </mesh>
          <mesh position={[0.02, 0.12, 0.38]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.32, 8]} />
            <meshBasicMaterial color="#9bd0ca" />
          </mesh>
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

    case "CEMETERY":
      return (
        <group>
          <Foundation color="#6d7d64" />
          <mesh receiveShadow position={[0, 0.08, 0]}>
            <boxGeometry args={[0.92, 0.1, 0.92]} />
            <meshStandardMaterial color="#8aa07a" flatShading />
          </mesh>

          <mesh castShadow position={[0, 0.18, 0]}>
            <boxGeometry args={[0.7, 0.04, 0.7]} />
            <meshStandardMaterial color="#758a6d" flatShading />
          </mesh>

          {[-0.26, 0, 0.26].map((x) => (
            [-0.26, 0, 0.26].map((z, index) => (
              <group key={`${x}-${z}`} position={[x, 0.12, z]}>
                <mesh castShadow position={[0, 0.12 + (index % 2) * 0.03, 0]}>
                  <boxGeometry args={[0.09, 0.22, 0.04]} />
                  <meshStandardMaterial color="#e2e8dd" flatShading />
                </mesh>
                <mesh castShadow position={[0, 0.22, 0]}>
                  <boxGeometry args={[0.04, 0.08, 0.04]} />
                  <meshStandardMaterial color="#e2e8dd" flatShading />
                </mesh>
              </group>
            ))
          ))}

          <mesh castShadow position={[0, 0.26, 0]}>
            <boxGeometry args={[0.14, 0.4, 0.14]} />
            <meshStandardMaterial color="#dfe5de" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[0.05, 0.2, 0.05]} />
            <meshStandardMaterial color="#dfe5de" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.56, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.18, 0.05, 0.05]} />
            <meshStandardMaterial color="#dfe5de" flatShading />
          </mesh>
        </group>
      )

    case "RELIGIOUS_CENTER":
      return (
        <group>
          <Foundation color="#a19175" />

          <mesh castShadow receiveShadow position={[0, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.72, def.height, 0.68]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>

          <mesh castShadow position={[0, def.height + 0.18, 0]}>
            <coneGeometry args={[0.18, 0.32, 6]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>

          <mesh castShadow position={[0, 0.18, 0.34]}>
            <boxGeometry args={[0.26, 0.28, 0.04]} />
            <meshStandardMaterial color="#f8f7f2" emissive="#d6c4a0" emissiveIntensity={0.08} flatShading />
          </mesh>

          <mesh castShadow position={[-0.18, 0.2, 0.34]}>
            <boxGeometry args={[0.08, 0.24, 0.04]} />
            <meshStandardMaterial color="#d2b784" flatShading />
          </mesh>
          <mesh castShadow position={[0.18, 0.2, 0.34]}>
            <boxGeometry args={[0.08, 0.24, 0.04]} />
            <meshStandardMaterial color="#d2b784" flatShading />
          </mesh>
        </group>
      )

    case "ELEMENTARY_SCHOOL":
      return (
        <group>
          <Foundation color="#7a8b8a" />
          <mesh castShadow receiveShadow position={[0, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.8, def.height, 0.7]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.12, 0]}>
            <coneGeometry args={[0.48, 0.28, 4]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.22, 0.38]}>
            <boxGeometry args={[0.34, 0.18, 0.04]} />
            <meshStandardMaterial color="#fffbe8" emissive="#ebd68c" emissiveIntensity={0.12} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.5, 0.38]}>
            <boxGeometry args={[0.14, 0.28, 0.04]} />
            <meshStandardMaterial color="#fff3db" flatShading />
          </mesh>
          <mesh castShadow position={[-0.2, 0.48, 0.38]}>
            <boxGeometry args={[0.08, 0.16, 0.02]} />
            <meshStandardMaterial color={WINDOW} emissive={WINDOW} emissiveIntensity={0.2} flatShading />
          </mesh>
          <mesh castShadow position={[0.2, 0.48, 0.38]}>
            <boxGeometry args={[0.08, 0.16, 0.02]} />
            <meshStandardMaterial color={WINDOW} emissive={WINDOW} emissiveIntensity={0.2} flatShading />
          </mesh>
        </group>
      )

    case "HIGH_SCHOOL":
      return (
        <group>
          <Foundation color="#75838d" />
          <mesh castShadow receiveShadow position={[-0.18, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.42, def.height, 0.7]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow receiveShadow position={[0.2, def.height / 2 + 0.08, 0]}>
            <boxGeometry args={[0.44, def.height + 0.08, 0.72]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0.04, def.height + 0.12, 0]}>
            <boxGeometry args={[0.7, 0.12, 0.8]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0.18, 0.28, 0.38]}>
            <boxGeometry args={[0.26, 0.22, 0.04]} />
            <meshStandardMaterial color="#fdfdfd" emissive="#e4d0a0" emissiveIntensity={0.1} flatShading />
          </mesh>
          <mesh castShadow position={[0.18, 0.52, 0.38]}>
            <boxGeometry args={[0.06, 0.32, 0.04]} />
            <meshStandardMaterial color="#d8d0bb" flatShading />
          </mesh>
        </group>
      )

    case "UNIVERSITY":
      return (
        <group>
          <Foundation color="#7f7a78" />
          <mesh castShadow receiveShadow position={[-0.2, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.26, def.height, 0.62]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow receiveShadow position={[0.2, def.height / 2 + 0.08, 0]}>
            <boxGeometry args={[0.26, def.height + 0.12, 0.62]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.18, 0]}>
            <boxGeometry args={[0.78, 0.12, 0.78]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.18, 0.38]}>
            <boxGeometry args={[0.42, 0.24, 0.04]} />
            <meshStandardMaterial color="#f6f2ec" emissive="#d7d0c6" emissiveIntensity={0.1} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.5, 0.38]}>
            <boxGeometry args={[0.12, 0.18, 0.04]} />
            <meshStandardMaterial color="#d7c29a" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.82, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.32, 8]} />
            <meshStandardMaterial color="#d9cab0" flatShading />
          </mesh>
        </group>
      )

    case "MEDICAL_CENTER":
      return (
        <group>
          <Foundation color="#8b7d7d" />
          <mesh castShadow receiveShadow position={[0, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.78, def.height, 0.74]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.12, 0]}>
            <boxGeometry args={[0.82, 0.1, 0.8]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0.4]}>
            <boxGeometry args={[0.22, 0.22, 0.04]} />
            <meshStandardMaterial color="#fffbf2" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0.4]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.22, 0.05, 0.05]} />
            <meshStandardMaterial color="#d95b7c" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0.4]}>
            <boxGeometry args={[0.05, 0.22, 0.05]} />
            <meshStandardMaterial color="#d95b7c" flatShading />
          </mesh>
        </group>
      )

    case "HOSPITAL":
      return (
        <group>
          <Foundation color="#7f6966" />
          <mesh castShadow receiveShadow position={[-0.18, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.42, def.height, 0.72]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow receiveShadow position={[0.22, def.height / 2 + 0.08, 0]}>
            <boxGeometry args={[0.42, def.height + 0.12, 0.72]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.15, 0]}>
            <boxGeometry args={[0.9, 0.12, 0.88]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0.38]}>
            <boxGeometry args={[0.26, 0.26, 0.04]} />
            <meshStandardMaterial color="#f9fcff" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0.38]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.26, 0.06, 0.06]} />
            <meshStandardMaterial color="#d93f5f" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0.38]}>
            <boxGeometry args={[0.06, 0.26, 0.06]} />
            <meshStandardMaterial color="#d93f5f" flatShading />
          </mesh>
        </group>
      )

    case "POLICE_STATION":
      return (
        <group>
          <Foundation color="#7c8ca4" />
          <mesh castShadow receiveShadow position={[0, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.78, def.height, 0.68]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.12, 0]}>
            <boxGeometry args={[0.82, 0.08, 0.72]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.2, 0.36]}>
            <boxGeometry args={[0.38, 0.2, 0.04]} />
            <meshStandardMaterial color="#f5f9ff" flatShading />
          </mesh>
          <mesh castShadow position={[-0.2, 0.32, 0.36]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
            <meshStandardMaterial color="#c7d6ef" flatShading />
          </mesh>
          <mesh castShadow position={[0.2, 0.32, 0.36]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
            <meshStandardMaterial color="#c7d6ef" flatShading />
          </mesh>
        </group>
      )

    case "POLICE_DEPARTMENT":
      return (
        <group>
          <Foundation color="#6d7f96" />
          <mesh castShadow receiveShadow position={[-0.18, def.height / 2 + 0.08, 0]}>
            <boxGeometry args={[0.38, def.height + 0.1, 0.7]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow receiveShadow position={[0.22, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.4, def.height, 0.7]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.12, 0]}>
            <boxGeometry args={[0.92, 0.12, 0.82]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.22, 0.38]}>
            <boxGeometry args={[0.42, 0.2, 0.04]} />
            <meshStandardMaterial color="#edf5ff" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.52, 0.38]}>
            <boxGeometry args={[0.12, 0.18, 0.04]} />
            <meshStandardMaterial color="#8ab0e6" flatShading />
          </mesh>
        </group>
      )

    case "CIVIL_DEFENSE":
      return (
        <group>
          <Foundation color="#738b71" />
          <mesh castShadow receiveShadow position={[0, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.7, def.height, 0.68]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.12, 0]}>
            <boxGeometry args={[0.75, 0.1, 0.74]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.18, 0.38]}>
            <boxGeometry args={[0.26, 0.2, 0.04]} />
            <meshStandardMaterial color="#ffd987" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.55, 0.14]}>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#f7ffe5" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.8, 0.14]}>
            <coneGeometry args={[0.12, 0.18, 8]} />
            <meshStandardMaterial color="#dfecc2" flatShading />
          </mesh>
        </group>
      )

    case "FIRE_STATION":
      return (
        <group>
          <Foundation color="#7d5a56" />
          <mesh castShadow receiveShadow position={[-0.18, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.42, def.height, 0.72]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow receiveShadow position={[0.22, def.height / 2 + 0.08, 0]}>
            <boxGeometry args={[0.48, def.height + 0.08, 0.72]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0.18, 0.26, 0.38]}>
            <boxGeometry args={[0.3, 0.2, 0.04]} />
            <meshStandardMaterial color="#f8d8d4" flatShading />
          </mesh>
          <mesh castShadow position={[0.18, 0.55, 0.18]}>
            <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
            <meshStandardMaterial color="#d95a4a" flatShading />
          </mesh>
          <mesh castShadow position={[0.18, 0.3, -0.15]}>
            <boxGeometry args={[0.18, 0.18, 0.08]} />
            <meshStandardMaterial color="#d95a4a" flatShading />
          </mesh>
        </group>
      )

    case "GARBAGE_COLLECTION":
      return (
        <group>
          <Foundation color="#7a817b" />
          <mesh castShadow receiveShadow position={[0, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.76, def.height, 0.72]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.08, 0]}>
            <boxGeometry args={[0.8, 0.12, 0.76]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[-0.17, 0.22, 0.38]}>
            <boxGeometry args={[0.14, 0.26, 0.14]} />
            <meshStandardMaterial color="#b3b8b0" flatShading />
          </mesh>
          <mesh castShadow position={[0.17, 0.14, 0.38]}>
            <boxGeometry args={[0.18, 0.12, 0.1]} />
            <meshStandardMaterial color="#d7ddd5" flatShading />
          </mesh>
          <mesh castShadow position={[-0.17, 0.4, 0.38]}>
            <boxGeometry args={[0.08, 0.18, 0.08]} />
            <meshStandardMaterial color="#8aa68a" flatShading />
          </mesh>
        </group>
      )

    case "BUS_STOP":
      return (
        <group>
          <Foundation color="#8a7868" />
          <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
            <boxGeometry args={[0.5, 0.72, 0.1]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.86, 0]}>
            <boxGeometry args={[0.38, 0.08, 0.12]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.52, 0.12]}>
            <boxGeometry args={[0.18, 0.1, 0.02]} />
            <meshStandardMaterial color="#fff8d6" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.3, 0.12]}>
            <cylinderGeometry args={[0.04, 0.04, 0.58, 6]} />
            <meshStandardMaterial color="#d9ae5d" flatShading />
          </mesh>
        </group>
      )

    case "BUS_TERMINAL":
      return (
        <group>
          <Foundation color="#796a59" />
          <mesh castShadow receiveShadow position={[-0.18, def.height / 2 + 0.06, 0]}>
            <boxGeometry args={[0.36, def.height, 0.7]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow receiveShadow position={[0.18, def.height / 2 + 0.08, 0]}>
            <boxGeometry args={[0.4, def.height + 0.12, 0.72]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, def.height + 0.12, 0]}>
            <boxGeometry args={[0.9, 0.12, 0.82]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh castShadow position={[0.18, 0.22, 0.38]}>
            <boxGeometry args={[0.28, 0.2, 0.04]} />
            <meshStandardMaterial color="#fff6d9" flatShading />
          </mesh>
          <mesh castShadow position={[0.18, 0.5, 0.38]}>
            <boxGeometry args={[0.2, 0.08, 0.04]} />
            <meshStandardMaterial color="#d4a651" flatShading />
          </mesh>
        </group>
      )

    case "BUS_BRIDGE":
      return (
        <group>
          <Foundation color="#6d7178" />
          <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
            <boxGeometry args={[0.9, 0.12, 0.9]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0]}>
            <boxGeometry args={[0.72, 0.12, 0.18]} />
            <meshStandardMaterial color="#d4d8de" flatShading />
          </mesh>
          <mesh castShadow position={[0, 0.62, 0]}>
            <boxGeometry args={[0.18, 0.12, 0.18]} />
            <meshStandardMaterial color="#f3d78c" flatShading />
          </mesh>
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
    isNight = false,
    nightIntensity = isNight ? 1 : 0,
    occupied = false,
  }: {
    type: BuildingType
    position: [
      number,
      number,
      number,
    ]
    rotation?: number
    isNight?: boolean
    nightIntensity?: number
    occupied?: boolean
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
        <Model type={type} isNight={isNight} nightIntensity={nightIntensity} occupied={occupied} />
        {occupied && ["HOUSE", "LOW_INCOME_HOUSE", "MIDDLE_INCOME_HOUSE", "HIGH_INCOME_HOUSE", "SMALL_APARTMENT", "LOW_INCOME_APARTMENT", "MIDDLE_INCOME_APARTMENT", "HIGH_INCOME_APARTMENT"].includes(type) && nightIntensity > 0.01 && (
          <pointLight position={[0, 0.7, 0.25]} color="#ffc46b" intensity={0.7 * nightIntensity} distance={2.2} decay={2} />
        )}
      </group>
    )
  },
)
