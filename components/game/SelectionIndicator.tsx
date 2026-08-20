"use client"

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react"

import type {
  BuildingType,
  Tile,
  ToolMode,
} from "@/types/game"

import type {
  Building,
} from "@/types/city"

import {
  TILE_SIZE,
  tileToWorld,
} from "@/lib/game/constants"

import {
  getBuilding,
} from "@/lib/game/buildings"

import {
  canPlace,
} from "@/lib/game/grid"

import {
  useSelection,
} from "@/hooks/useGame"

export interface SelectionIndicatorHandle {
  setHover: (
    x: number,
    z: number,
  ) => void

  clearHover: () => void
}

interface SelectionIndicatorProps {
  tiles: Tile[][]

  tool: ToolMode

  selectedBuilding:
    | BuildingType
    | null

  rotation: number

  editingBuilding:
    | Building
    | null

  editingRotation: number
}

/**
 * Visual feedback for the cursor:
 *
 * - tile highlight
 * - building ghost preview
 * - direction indicator
 * - demolish marker
 * - selected tile marker
 *
 * IMPORTANT:
 *
 * hoveredTile is intentionally NOT read from SelectionContext.
 *
 * Hover is updated imperatively through SelectionIndicatorHandle.
 * This prevents React from rendering on every tile change.
 */
export const SelectionIndicator =
  forwardRef<
    SelectionIndicatorHandle,
    SelectionIndicatorProps
  >(
    function SelectionIndicator(
      {
        tiles,
        tool,
        selectedBuilding,
        rotation,
        editingBuilding,
        editingRotation,
      },
      ref,
    ) {
      const {
        selectedTile: selected,
      } = useSelection()

      const hoverRootRef =
        useRef<THREE.Group | null>(null)

      const highlightMaterialRef =
        useRef<THREE.MeshBasicMaterial | null>(
          null,
        )

      const previewRootRef =
        useRef<THREE.Group | null>(null)

      const buildingMaterialRef =
        useRef<THREE.MeshStandardMaterial | null>(
          null,
        )

      const facadeMaterialRef =
        useRef<THREE.MeshBasicMaterial | null>(
          null,
        )

      const entranceMaterialRef =
        useRef<THREE.MeshBasicMaterial | null>(
          null,
        )

      const arrowMaterialRef =
        useRef<THREE.MeshBasicMaterial | null>(
          null,
        )

      const lineMaterialRef =
        useRef<THREE.MeshBasicMaterial | null>(
          null,
        )

      const demolishMarkerRef =
        useRef<THREE.Mesh | null>(null)

      const previewType =
        tool === "EDIT" &&
        editingBuilding
          ? editingBuilding.type
          : selectedBuilding

      const building =
        previewType
          ? getBuilding(previewType)
          : null

      const isBuilding =
        tool === "BUILD" ||
        tool === "ROAD" ||
        tool === "EDIT"

      const previewRotation =
        tool === "EDIT"
          ? editingRotation
          : rotation

      const rotationRadians =
        (previewRotation * Math.PI) / 2

      /*
       * All hover changes happen here.
       *
       * React does not render when the mouse changes tile.
       */
      useImperativeHandle(
        ref,
        () => ({
          setHover(x, z) {
            const root =
              hoverRootRef.current

            if (!root) {
              return
            }

            root.visible = true

            root.position.set(
              tileToWorld(x),
              0,
              tileToWorld(z),
            )

            const tile =
              tiles[x]?.[z]

            let valid = false

            if (tool === "DEMOLISH") {
              valid = Boolean(tile?.occupiedBy)
            } else if (tool === "EDIT") {
              if (!editingBuilding) {
                valid = false
              } else {
                // O próprio prédio que está sendo editado
                // não deve ser considerado uma colisão.
                const isSameBuilding =
                  tile?.occupiedBy === editingBuilding.id

                if (isSameBuilding) {
                  valid = true
                } else {
                  valid = canPlace(tile)
                }
              }
            } else {
              valid = canPlace(tile)
            }

            const highlight =
              valid
                ? "#4ade80"
                : "#f87171"

            if (
              highlightMaterialRef.current
            ) {
              highlightMaterialRef.current.color.set(
                highlight,
              )
            }

            if (
              buildingMaterialRef.current &&
              building
            ) {
              buildingMaterialRef.current.color.set(
                valid
                  ? building.color
                  : "#f87171",
              )
            }

            if (
              facadeMaterialRef.current
            ) {
              facadeMaterialRef.current.color.set(
                valid
                  ? "#ffffff"
                  : "#ffd0d0",
              )
            }

            if (
              entranceMaterialRef.current
            ) {
              entranceMaterialRef.current.color.set(
                valid
                  ? "#6b4226"
                  : "#8f3030",
              )
            }

            if (
              arrowMaterialRef.current
            ) {
              arrowMaterialRef.current.color.set(
                valid
                  ? "#ffffff"
                  : "#ffd0d0",
              )
            }

            if (
              lineMaterialRef.current
            ) {
              lineMaterialRef.current.color.set(
                valid
                  ? "#ffffff"
                  : "#ffd0d0",
              )
            }

            if (
              demolishMarkerRef.current
            ) {
              demolishMarkerRef.current.visible =
                tool === "DEMOLISH"
            }
          },

          clearHover() {
            if (
              hoverRootRef.current
            ) {
              hoverRootRef.current.visible =
                false
            }
          },
        }),
        [
          tiles,
          tool,
          editingBuilding,
          building,
        ],
      )

      /*
       * The visual tree itself is created only when the actual
       * tool/building configuration changes.
       *
       * Mouse movement does NOT reach React anymore.
       */
      return (
        <group>
          {/* ============================================================= */}
          {/* HOVER ROOT                                                     */}
          {/* ============================================================= */}

          <group
            ref={hoverRootRef}
            visible={false}
          >
            {/* =========================================================== */}
            {/* TILE HIGHLIGHT                                               */}
            {/* =========================================================== */}

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
                ref={
                  highlightMaterialRef
                }
                color="#f87171"
                transparent
                opacity={0.35}
                depthWrite={false}
              />
            </mesh>

            {/* =========================================================== */}
            {/* BUILDING PREVIEW                                             */}
            {/* =========================================================== */}

            {isBuilding &&
              previewType &&
              building && (
                <group
                  ref={previewRootRef}
                  rotation={[
                    0,
                    rotationRadians,
                    0,
                  ]}
                >
                  {/* Ghost building body */}

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
                      ref={
                        buildingMaterialRef
                      }
                      color={
                        building.color
                      }
                      transparent
                      opacity={0.38}
                      flatShading
                      depthWrite={false}
                    />
                  </mesh>

                  {/* Building front */}

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
                      ref={
                        facadeMaterialRef
                      }
                      color="#ffffff"
                      transparent
                      opacity={0.9}
                      depthWrite={false}
                    />
                  </mesh>

                  {/* Entrance */}

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
                      ref={
                        entranceMaterialRef
                      }
                      color="#6b4226"
                      transparent
                      opacity={0.95}
                      depthWrite={false}
                    />
                  </mesh>

                  {/* Direction arrow */}

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
                        ref={
                          arrowMaterialRef
                        }
                        color="#ffffff"
                        transparent
                        opacity={0.95}
                        depthWrite={false}
                      />
                    </mesh>
                  </group>

                  {/* Direction line */}

                  <mesh
                    position={[
                      0,
                      0.055,
                      0.48,
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
                      ref={
                        lineMaterialRef
                      }
                      color="#ffffff"
                      transparent
                      opacity={0.9}
                      depthWrite={false}
                    />
                  </mesh>
                </group>
              )}

            {/* =========================================================== */}
            {/* DEMOLISH MARKER                                              */}
            {/* =========================================================== */}

            {tool === "DEMOLISH" && (
              <mesh
                ref={demolishMarkerRef}
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

          {/* ============================================================= */}
          {/* SELECTED TILE                                                  */}
          {/* ============================================================= */}

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
    },
  )