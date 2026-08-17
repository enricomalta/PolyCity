"use client"

import { MousePointer2, Hammer, Trash2, Shovel } from "lucide-react"
import type { ToolMode } from "@/types/game"
import { cn } from "@/lib/utils"

interface ToolBarProps {
  tool: ToolMode
  selectedBuilding: string | null
  onSelect: () => void
  onDemolish: () => void
  onBuild: () => void
  onEdit: () => void
}

/**
 * Left-side vertical tool switcher. BUILD/ROAD are driven by the build menu,
 * so the toolbar only exposes SELECT and DEMOLISH as explicit modes.
 */
export function ToolBar({ tool, selectedBuilding, onSelect, onDemolish, onBuild, onEdit, }: ToolBarProps) {
  
  const isBuildMode =
    tool === "BUILD_MENU" ||
    tool === "BUILD" ||
    tool === "ROAD"
  
  const hasSelectedBuilding =
    selectedBuilding !== null

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 rounded-2xl border border-border bg-card/90 p-1.5 shadow-lg shadow-black/30 backdrop-blur">

      {/* SELECIONAR */}
      <button
        type="button"
        onClick={onSelect}
        aria-label="Selecionar"
        aria-pressed={tool === "SELECT"}
        title="Selecionar"
        className={cn(
          "flex size-11 items-center justify-center rounded-xl transition-colors",
          tool === "SELECT"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
        )}
      >
        <MousePointer2 className="size-5" />
      </button>

      {/* DEMOLIR */}
      <button
        type="button"
        onClick={onDemolish}
        aria-label="Demolir"
        aria-pressed={tool === "DEMOLISH"}
        title="Demolir"
        className={cn(
          "flex size-11 items-center justify-center rounded-xl transition-colors",
          tool === "DEMOLISH"
            ? "bg-destructive text-white"
            : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
        )}
      >
        <Trash2 className="size-5" />
      </button>

      {/* CONSTRUÇÃO */}
      <button
        type="button"
        onClick={onBuild}
        aria-label="Construção"
        aria-pressed={isBuildMode}
        title="Construção"
        className={cn(
          "flex size-11 items-center justify-center rounded-xl transition-colors",
          isBuildMode
            ? hasSelectedBuilding
              ? "bg-orange-400 text-white"
              : "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
        )}
      >
        <Hammer className="size-5" />
      </button>

      {/* EDIÇÃO */}
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edição"
        aria-pressed={tool === "EDIT"}
        title="Edição"
        className={cn(
          "flex size-11 items-center justify-center rounded-xl transition-colors",
          tool === "EDIT"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
        )}
      >
        <Shovel className="size-5" />
      </button>

    </div>
  )
}