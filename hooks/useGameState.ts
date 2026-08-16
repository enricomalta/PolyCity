"use client"

import { useGame, useSelection } from "./useGame"

// UI / interaction slice: current tool, hovered/selected tile.
//
// tool/setTool/setHoveredTile/selectTile vêm do GameContext (estáveis).
// hoveredTile/selectedTile (os valores) vêm do SelectionContext, que muda a
// cada pointermove/clique. Qualquer componente que chamar este hook vai
// re-renderizar nessa cadência — por isso CityScene não o usa.
export function useGameState() {
  const { tool, setTool, setHoveredTile, selectTile } = useGame()
  const { hoveredTile, selectedTile } = useSelection()
  return { tool, setTool, hoveredTile, setHoveredTile, selectedTile, selectTile }
}
