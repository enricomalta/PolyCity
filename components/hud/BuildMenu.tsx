"use client"

import { useState } from "react"
import { Home, Building2, Store, Factory, Trees, Zap, Droplets, Route } from "lucide-react"
import type { BuildingType } from "@/types/game"
import {
  BUILDING_LIST,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type BuildingDef,
} from "@/lib/game/buildings"
import { affordable } from "@/lib/game/economy"
import type { ResourceState } from "@/types/city"
import { cn } from "@/lib/utils"

const ICONS: Record<BuildingType, React.ReactNode> = {
  ROAD: <Route className="size-5" />,
  HOUSE: <Home className="size-5" />,
  SMALL_APARTMENT: <Building2 className="size-5" />,
  SHOP: <Store className="size-5" />,
  FACTORY: <Factory className="size-5" />,
  PARK: <Trees className="size-5" />,
  POWER_PLANT: <Zap className="size-5" />,
  WATER_TOWER: <Droplets className="size-5" />,
}

interface BuildMenuProps {
  state: ResourceState
  selected: BuildingType | null
  onSelect: (type: BuildingType | null) => void
}

export function BuildMenu({ state, selected, onSelect }: BuildMenuProps) {
  const [category, setCategory] = useState(CATEGORY_ORDER[0])
  const items = BUILDING_LIST.filter((b) => b.category === category)

  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-border bg-card/90 p-3 shadow-lg shadow-black/30 backdrop-blur">
      {/* Category tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              c === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-secondary-foreground",
            )}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Building cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((def) => (
          <BuildingCard
            key={def.type}
            def={def}
            icon={ICONS[def.type]}
            active={selected === def.type}
            canAfford={affordable(state, def.cost)}
            onClick={() => onSelect(selected === def.type ? null : def.type)}
          />
        ))}
      </div>
    </div>
  )
}

function BuildingCard({
  def,
  icon,
  active,
  canAfford,
  onClick,
}: {
  def: BuildingDef
  icon: React.ReactNode
  active: boolean
  canAfford: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={def.description}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all",
        active
          ? "border-primary bg-primary/10 ring-1 ring-primary"
          : "border-border bg-secondary/60 hover:border-primary/50 hover:bg-secondary",
        !canAfford && "opacity-55",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-primary/20 text-primary" : "bg-card text-accent",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-card-foreground">{def.name}</span>
        <span
          className={cn(
            "block text-xs tabular-nums",
            canAfford ? "text-muted-foreground" : "text-destructive",
          )}
        >
          ${new Intl.NumberFormat("pt-BR").format(def.cost)}
        </span>
      </span>
    </button>
  )
}
