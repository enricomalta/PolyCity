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

interface SelectionIndicatorProps {
  hovered: Coord | null
  selected: Coord | null
  tool: ToolMode
  selectedBuilding: BuildingType | null
  rotation: number
  valid: boolean
}

// Visual feedback for the cursor: a tile highlight (green=valid, red=invalid),
// a ghost preview of the armed building, and a marker on the selected tile.
export function SelectionIndicator({
  hovered,
  selected,
  tool,
  selectedBuilding,
  rotation,
  valid,
}: SelectionIndicatorProps) {
  const isBuilding =
    tool === "BUILD" ||
    tool === "ROAD"

  const highlight = valid
    ? "#4ade80"
    : "#f87171"

  const selectedDefinition =
    selectedBuilding
      ? getBuilding(selectedBuilding)
      : null

  const rotationRadians =
    (rotation * Math.PI) / 2

  return (
    <group>
      {/* ----------------------------------------------------------------- */}
      {/* Hovered tile                                                      */}
      {/* ----------------------------------------------------------------- */}

      {hovered && (
        <group
          position={[
            tileToWorld(hovered.x),
            0,
            tileToWorld(hovered.z),
          ]}
        >
          {/* ------------------------------------------------------------- */}
          {/* Tile footprint                                                 */}
          {/* ------------------------------------------------------------- */}

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
            />
          </mesh>

          {/* ------------------------------------------------------------- */}
          {/* Building preview                                               */}
          {/* ------------------------------------------------------------- */}

          {isBuilding &&
            selectedBuilding &&
            selectedDefinition && (
              <>
                {/* ------------------------------------------------------- */}
                {/* ROAD PREVIEW                                             */}
                {/* ------------------------------------------------------- */}

                {selectedBuilding === "ROAD" ? (
                  <group
                    rotation={[
                      0,
                      rotationRadians,
                      0,
                    ]}
                  >
                    {/* Asphalt */}

                    <mesh
                      position={[
                        0,
                        selectedDefinition.height / 2 +
                          0.03,
                        0,
                      ]}
                    >
                      <boxGeometry
                        args={[
                          TILE_SIZE * 0.98,
                          selectedDefinition.height,
                          TILE_SIZE * 0.98,
                        ]}
                      />

                      <meshStandardMaterial
                        color={
                          valid
                            ? selectedDefinition.color
                            : "#f87171"
                        }
                        transparent
                        opacity={0.55}
                        flatShading
                      />
                    </mesh>

                    {/* Curbs */}

                    {[
                      -TILE_SIZE * 0.49,
                      TILE_SIZE * 0.49,
                    ].map((x) => (
                      <mesh
                        key={x}
                        position={[
                          x,
                          selectedDefinition.height +
                            0.045,
                          0,
                        ]}
                      >
                        <boxGeometry
                          args={[
                            0.07,
                            0.05,
                            TILE_SIZE * 0.96,
                          ]}
                        />

                        <meshStandardMaterial
                          color={
                            valid
                              ? "#9aa0a6"
                              : "#b94a4a"
                          }
                          transparent
                          opacity={0.75}
                          flatShading
                        />
                      </mesh>
                    ))}

                    {/* Center lane */}

                    {[-0.3, 0, 0.3].map(
                      (z) => (
                        <mesh
                          key={z}
                          position={[
                            0,
                            selectedDefinition.height +
                              0.052,
                            z,
                          ]}
                          rotation={[
                            -Math.PI / 2,
                            0,
                            0,
                          ]}
                        >
                          <planeGeometry
                            args={[
                              0.08,
                              0.18,
                            ]}
                          />

                          <meshBasicMaterial
                            color="#e8c33a"
                            transparent
                            opacity={0.9}
                          />
                        </mesh>
                      ),
                    )}
                  </group>
                ) : (
                  /* ------------------------------------------------------- */
                  /* NORMAL BUILDING PREVIEW                                 */
                  /* ------------------------------------------------------- */

                  <group
                    rotation={[
                      0,
                      rotationRadians,
                      0,
                    ]}
                  >
                    <mesh
                      position={[
                        0,
                        selectedDefinition.height / 2 +
                          0.03,
                        0,
                      ]}
                    >
                      <boxGeometry
                        args={[
                          0.75,
                          Math.max(
                            0.1,
                            selectedDefinition.height,
                          ),
                          0.75,
                        ]}
                      />

                      <meshStandardMaterial
                        color={
                          valid
                            ? selectedDefinition.color
                            : "#f87171"
                        }
                        transparent
                        opacity={0.5}
                        flatShading
                      />
                    </mesh>
                  </group>
                )}
              </>
            )}

          {/* ------------------------------------------------------------- */}
          {/* Demolish marker                                                */}
          {/* ------------------------------------------------------------- */}

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

      {/* ----------------------------------------------------------------- */}
      {/* Selected tile                                                     */}
      {/* ----------------------------------------------------------------- */}

      {selected &&
        tool === "SELECT" && (
          <mesh
            rotation={[
              -Math.PI / 2,
              0,
              0,
            ]}
            position={[
              tileToWorld(selected.x),
              0.03,
              tileToWorld(selected.z),
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