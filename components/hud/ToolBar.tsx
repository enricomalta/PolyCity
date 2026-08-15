"use client"

import { MousePointer2, Hammer, Trash2 } from "lucide-react"
import type { ToolMode } from "@/types/game"
import { cn } from "@/lib/utils"

interface ToolBarProps {
  tool: ToolMode
  onSelect: () => void
  onDemolish: () => void
}

/**
 * Left-side vertical tool switcher. BUILD/ROAD are driven by the build menu,
 * so the toolbar only exposes SELECT and DEMOLISH as explicit modes.
 */
export function ToolBar({ tool, onSelect, onDemolish }: ToolBarProps) {
  const tools = [
    { id: "SELECT" as const, label: "Selecionar", icon: <MousePointer2 className="size-5" />, action: onSelect },
    { id: "DEMOLISH" as const, label: "Demolir", icon: <Trash2 className="size-5" />, action: onDemolish },
  ]

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 rounded-2xl border border-border bg-card/90 p-1.5 shadow-lg shadow-black/30 backdrop-blur">
      {tools.map((t) => {
        const active = tool === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={t.action}
            aria-label={t.label}
            aria-pressed={active}
            title={t.label}
            className={cn(
              "flex size-11 items-center justify-center rounded-xl transition-colors",
              active
                ? t.id === "DEMOLISH"
                  ? "bg-destructive text-white"
                  : "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-card-foreground",
            )}
          >
            {t.icon}
          </button>
        )
      })}
      {(tool === "BUILD" || tool === "ROAD") && (
        <div className="flex size-11 items-center justify-center rounded-xl bg-accent/20 text-accent" title="Modo construção">
          <Hammer className="size-5" />
        </div>
      )}
    </div>
  )
}
