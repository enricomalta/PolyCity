"use client"

import type {
  BuildingType,
  ToolMode,
} from "@/types/game"

import {
  TILE_SIZE,
  tileToWorld,
} from "@/lib/game/constants"

import {
  getBuilding,
} from "@/lib/game/buildings"

interface Coord {
  x: number
  z: number
}

// Visual feedback for the cursor:
// - tile highlight
// - building ghost preview
// - direction indicator
// - selected tile marker
export function SelectionIndicator({
  hovered,
  selected,
  tool,
  selectedBuilding,
  valid,
  rotation,
}: {
  hovered: Coord | null
  selected: Coord | null
  tool: ToolMode
  selectedBuilding:
    | BuildingType
    | null
  valid: boolean
  rotation: number
}) {
  const isBuilding =
    tool === "BUILD" ||
    tool === "ROAD"

  const highlight =
    valid
      ? "#4ade80"
      : "#f87171"

  const building =
    selectedBuilding
      ? getBuilding(
          selectedBuilding,
        )
      : null

  const rotationRadians =
    (rotation * Math.PI) / 2

  return (
    <group>
      {hovered && (
        <group
          position={[
            tileToWorld(
              hovered.x,
            ),
            0,
            tileToWorld(
              hovered.z,
            ),
          ]}
        >
          {/* ============================================================= */}
          {/* TILE HIGHLIGHT                                                 */}
          {/* ============================================================= */}

          <mesh
            rotation={[
              -Math.PI / 2,
              0,
              0,
            ]}
            position={[
              0,
              0.02,
              0,
            ]}
          >
            <planeGeometry
              args={[
                TILE_SIZE,
                TILE_SIZE,
              ]}
            />

            <meshBasicMaterial
              color={highlight}
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>

          {/* ============================================================= */}
          {/* BUILDING PREVIEW                                               */}
          {/* ============================================================= */}

          {isBuilding &&
            selectedBuilding &&
            building && (
              <group
                rotation={[
                  0,
                  rotationRadians,
                  0,
                ]}
              >
                {/* ------------------------------------------------------- */}
                {/* Ghost building body                                      */}
                {/* ------------------------------------------------------- */}

                <mesh
                  position={[
                    0,
                    building.height / 2 +
                      0.04,
                    0,
                  ]}
                >
                  <boxGeometry
                    args={[
                      0.75,
                      Math.max(
                        0.1,
                        building.height,
                      ),
                      0.75,
                    ]}
                  />

                  <meshStandardMaterial
                    color={
                      valid
                        ? building.color
                        : "#f87171"
                    }
                    transparent
                    opacity={0.38}
                    flatShading
                    depthWrite={false}
                  />
                </mesh>

                {/* ------------------------------------------------------- */}
                {/* Building front/facade                                    */}
                {/* ------------------------------------------------------- */}

                <mesh
                  position={[
                    0,
                    0.28,
                    0.39,
                  ]}
                >
                  <boxGeometry
                    args={[
                      0.42,
                      0.22,
                      0.035,
                    ]}
                  />

                  <meshBasicMaterial
                    color={
                      valid
                        ? "#ffffff"
                        : "#ffd0d0"
                    }
                    transparent
                    opacity={0.9}
                    depthWrite={false}
                  />
                </mesh>

                {/* ------------------------------------------------------- */}
                {/* Entrance                                                  */}
                {/* ------------------------------------------------------- */}

                <mesh
                  position={[
                    0,
                    0.15,
                    0.415,
                  ]}
                >
                  <boxGeometry
                    args={[
                      0.14,
                      0.25,
                      0.045,
                    ]}
                  />

                  <meshBasicMaterial
                    color={
                      valid
                        ? "#6b4226"
                        : "#8f3030"
                    }
                    transparent
                    opacity={0.95}
                    depthWrite={false}
                  />
                </mesh>

                {/* ------------------------------------------------------- */}
                {/* Direction arrow                                           */}
                {/* ------------------------------------------------------- */}

                <group
                  position={[
                    0,
                    0.06,
                    0.58,
                  ]}
                >
                  <mesh
                    rotation={[
                      -Math.PI / 2,
                      0,
                      0,
                    ]}
                  >
                    <coneGeometry
                      args={[
                        0.10,
                        0.22,
                        4,
                      ]}
                    />

                    <meshBasicMaterial
                      color={
                        valid
                          ? "#ffffff"
                          : "#ffd0d0"
                      }
                      transparent
                      opacity={0.95}
                      depthWrite={false}
                    />
                  </mesh>
                </group>

                {/* ------------------------------------------------------- */}
                {/* Direction line                                            */}
                {/* ------------------------------------------------------- */}

                <mesh
                  position={[
                    0,
                    0.055,
                    0.48,
                  ]}
                  rotation={[
                    0,
                    0,
                    0,
                  ]}
                >
                  <boxGeometry
                    args={[
                      0.035,
                      0.025,
                      0.25,
                    ]}
                  />

                  <meshBasicMaterial
                    color={
                      valid
                        ? "#ffffff"
                        : "#ffd0d0"
                    }
                    transparent
                    opacity={0.9}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            )}

          {/* ============================================================= */}
          {/* DEMOLISH MARKER                                                */}
          {/* ============================================================= */}

          {tool === "DEMOLISH" && (
            <mesh
              rotation={[
                -Math.PI / 2,
                0,
                0,
              ]}
              position={[
                0,
                0.05,
                0,
              ]}
            >
              <ringGeometry
                args={[
                  0.3,
                  0.42,
                  6,
                ]}
              />

              <meshBasicMaterial
                color="#f87171"
                transparent
                opacity={0.8}
              />
            </mesh>
          )}
        </group>
      )}

      {/* =============================================================== */}
      {/* SELECTED TILE                                                    */}
      {/* =============================================================== */}

      {selected &&
        tool === "SELECT" && (
          <mesh
            rotation={[
              -Math.PI / 2,
              0,
              0,
            ]}
            position={[
              tileToWorld(
                selected.x,
              ),
              0.03,
              tileToWorld(
                selected.z,
              ),
            ]}
          >
            <ringGeometry
              args={[
                0.36,
                0.46,
                24,
              ]}
            />

            <meshBasicMaterial
              color="#34d0a0"
              transparent
              opacity={0.9}
            />
          </mesh>
        )}
    </group>
  )
}