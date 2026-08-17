"use client"

import { useGame } from "./useGame"

// Build-mode slice: which building is armed for placement,
// current rotation and placement controls.
export function useBuildMode() {
  const {
    tool,
    selectedBuilding,

    buildRotation,
    rotateBuilding,
    resetBuildRotation,

    selectBuildingType,
    setTool,
  } = useGame()

  const isBuilding =
    tool === "BUILD_MENU" ||
    tool === "BUILD" ||
    tool === "ROAD"

  return {
    tool,

    isBuilding,

    selectedBuilding,

    buildRotation,

    rotateBuilding,

    resetBuildRotation,

    selectBuildingType,

    setTool,
  }
}