"use client"

import { useGame } from "./useGame"

// Build-mode slice: which building is armed for placement, and whether we are
// currently in a placement tool.
export function useBuildMode() {
  const { tool, selectedBuilding, selectBuildingType, setTool } = useGame()
  const isBuilding = tool === "BUILD" || tool === "ROAD"
  return { tool, isBuilding, selectedBuilding, selectBuildingType, setTool }
}
