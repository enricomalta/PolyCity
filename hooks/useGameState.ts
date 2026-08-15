"use client"

import { useGame } from "./useGame"

// UI / interaction slice: current tool, hovered/selected tile.
export function useGameState() {
  const { tool, setTool, hoveredTile, setHoveredTile, selectedTile, selectTile } = useGame()
  return { tool, setTool, hoveredTile, setHoveredTile, selectedTile, selectTile }
}
