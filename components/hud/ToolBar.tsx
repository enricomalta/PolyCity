"use client"

import { useEffect, useState } from "react"
import {
  Hammer,
  Landmark,
  Map,
  MousePointer2,
  Pencil,
  Shovel,
  Grid3X3,
  Trash2,
} from "lucide-react"
import type { ToolMode } from "@/types/game"
import { cn } from "@/lib/utils"

interface ToolBarProps {
  tool: ToolMode
  selectedBuilding: string | null
  onSelect: () => void
  onBuild: () => void
  onTerrainEdit: () => void
  onZoning: () => void
  onEdit: () => void
  onDemolish: () => void
  onGovernance: () => void
  onHeatmap: () => void
}

/**
 * Left-side vertical tool switcher. BUILD/ROAD are driven by the build menu,
 * so the toolbar only exposes SELECT and DEMOLISH as explicit modes.
 */
export function ToolBar({ 
  tool, 
  selectedBuilding, 
  onSelect, 
  onBuild,
  onTerrainEdit,
  onZoning,
  onEdit,
  onDemolish,
  onGovernance,
  onHeatmap,
}: ToolBarProps) {
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const [closeTimer, setCloseTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (closeTimer) clearTimeout(closeTimer) }, [closeTimer])

  const openSubmenu = () => {
    if (closeTimer) clearTimeout(closeTimer)
    setSubmenuOpen(true)
  }

  const scheduleClose = () => {
    if (closeTimer) clearTimeout(closeTimer)
    setCloseTimer(setTimeout(() => setSubmenuOpen(false), 420))
  }

  const isConstructionMode =
    tool === "BUILD_MENU" ||
    tool === "BUILD" ||
    tool === "ROAD" ||
    tool === "TERRAIN_EDIT" ||
    tool === "ZONING" ||
    tool === "EDIT"
  
  const hasSelectedBuilding =
    selectedBuilding !== null

   return (
    <div className="pointer-events-auto flex flex-col gap-1.5">
      <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card/90 p-1.5 shadow-lg shadow-black/30 backdrop-blur">
        {/* SELECIONAR */}
        <button
          type="button"
          onClick={onSelect}
          aria-label="Selecionar"
          aria-pressed={
            tool === "SELECT"
          }
          title="Selecionar"
          className={cn(
            "flex size-11 items-center justify-center rounded-xl transition-all duration-200",
            tool === "SELECT"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
          )}
        >
          <MousePointer2 className="size-5" />
        </button>

        {/* CONSTRUÇÃO */}
<div className="relative" onMouseEnter={openSubmenu} onMouseLeave={scheduleClose}>
  <button
    type="button"
    onClick={onBuild}
    aria-label="Construção"
    aria-pressed={tool === "BUILD_MENU" || tool === "BUILD" || tool === "ROAD"}
    title="Construção"
    className={cn(
      "relative z-30 flex size-11 items-center justify-center rounded-xl transition-all duration-200",
      isConstructionMode
        ? hasSelectedBuilding
          ? "bg-orange-400 text-white shadow-md"
          : "bg-primary text-primary-foreground shadow-md"
        : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
    )}
  >
    {tool === "TERRAIN_EDIT" ? <Shovel className="size-5" /> : tool === "ZONING" ? <Grid3X3 className="size-5" /> : tool === "EDIT" ? <Pencil className="size-5" /> : tool === "DEMOLISH" ? <Trash2 className="size-5" /> : <Hammer className="size-5" />}
  </button>

  <div
    className={cn(
      "absolute left-full top-0 z-20 -ml-1 h-11 w-[232px] pl-2",
      submenuOpen ? "pointer-events-auto" : "pointer-events-none",
    )}
  >
    <div
      className={cn(
        "flex h-11 w-[220px] items-center gap-1.5 rounded-r-2xl border border-border bg-card/90 p-1.5 shadow-lg backdrop-blur origin-left transition-all duration-200 ease-out",
        submenuOpen ? "pointer-events-auto translate-x-0 scale-x-100 opacity-100" : "pointer-events-none -translate-x-3 scale-x-90 opacity-0",
      )}
    >
      {/* CONSTRUÇÃO aparece no submenu apenas quando outro modo está ativo */}
      {!isConstructionMode && <button type="button" onClick={onBuild} aria-label="Modo construção" title="Modo construção" className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all duration-150 hover:bg-secondary hover:text-card-foreground"><Hammer className="size-5" /></button>}

      {/* TERRENO */}
      {tool !== "TERRAIN_EDIT" && <button
        type="button"
        onClick={onTerrainEdit}
        aria-label="Editar terreno"
        title="Editar terreno"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-150",
          tool === "TERRAIN_EDIT"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
        )}
      >
        <Shovel className="size-5" />
      </button>}

      {/* ZONEAMENTO */}
      {tool !== "ZONING" && (
      <button
        type="button"
        onClick={onZoning}
        aria-label="Demarcar região"
        title="Demarcar região"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-150",
          tool === "ZONING"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
        )}
      >
        <Grid3X3 className="size-5" />
      </button>)}

      {/* EDIÇÃO */}
      {tool !== "EDIT" && (
      <button
        type="button"
        onClick={onEdit}
        aria-label="Editar construção"
        title="Editar construção"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-150",
          tool === "EDIT"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
        )}
      >
        <Pencil className="size-5" />
      </button>)}

      {/* DEMOLIR */}
      {tool !== "DEMOLISH" && (
      <button
        type="button"
        onClick={onDemolish}
        aria-label="Demolir"
        title="Demolir"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-150",
          tool === "DEMOLISH"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
        )}
      >
        <Trash2 className="size-5" />
      </button>)}
    </div>
  </div>
</div>

        {/* GOVERNANÇA */}
        <button
          type="button"
          onClick={onGovernance}
          aria-label="Governança"
          aria-pressed={
            tool === "GOVERNANCE"
          }
          title="Governança"
          className={cn(
            "flex size-11 items-center justify-center rounded-xl transition-all duration-200",
            tool === "GOVERNANCE"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
          )}
        >
          <Landmark className="size-5" />
        </button>

        {/* MAPA DE CALOR */}
        <button
          type="button"
          onClick={onHeatmap}
          aria-label="Mapa de calor"
          aria-pressed={
            tool === "HEATMAP"
          }
          title="Mapa de calor"
          className={cn(
            "flex size-11 items-center justify-center rounded-xl transition-all duration-200",
            tool === "HEATMAP"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
          )}
        >
          <Map className="size-5" />
        </button>
      </div>
    </div>
  )
}
