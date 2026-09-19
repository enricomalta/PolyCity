"use client"

import { useMemo, useState } from "react"
import { Home, Building2, Store, Factory, Trees, Zap, Droplets, Route, ShoppingCart, Fuel, Shirt, CarFront, Hammer, Cpu, Cable, Waves, School, HeartPulse, Shield, BriefcaseMedical, Trash2, BusFront, Landmark, ShieldAlert } from "lucide-react"
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
  BRIDGE: <Route className="size-5" />,
  HOUSE: <Home className="size-5" />,
  LOW_INCOME_HOUSE: <Home className="size-5" />,
  MIDDLE_INCOME_HOUSE: <Home className="size-5" />,
  HIGH_INCOME_HOUSE: <Home className="size-5" />,
  SMALL_APARTMENT: <Building2 className="size-5" />,
  COMMERCIAL_BUILDING: <Building2 className="size-5" />,
  SHOP: <Store className="size-5" />,
  GROCERY_STORE: <ShoppingCart className="size-5" />,
  GAS_STATION: <Fuel className="size-5" />,
  CLOTHING_STORE: <Shirt className="size-5" />,
  CAR_DEALERSHIP: <CarFront className="size-5" />,
  BUILDING_SUPPLY_STORE: <Hammer className="size-5" />,
  FACTORY: <Factory className="size-5" />,
  CONSTRUCTION_FACTORY: <Hammer className="size-5" />,
  AUTOMOTIVE_FACTORY: <CarFront className="size-5" />,
  TECH_FACTORY: <Cpu className="size-5" />,
  PARK: <Trees className="size-5" />,
  POWER_PLANT: <Zap className="size-5" />,
  WATER_TOWER: <Droplets className="size-5" />,
  LOW_INCOME_APARTMENT: <Building2 className="size-5" />,
  MIDDLE_INCOME_APARTMENT: <Building2 className="size-5" />,
  HIGH_INCOME_APARTMENT: <Building2 className="size-5" />,
  ELECTRIC_GRID: <Cable className="size-5" />,
  SEWER_NETWORK: <Waves className="size-5" />,
  SEWAGE_TREATMENT_PLANT: <Droplets className="size-5" />,
  ELEMENTARY_SCHOOL: <School className="size-5" />,
  HIGH_SCHOOL: <School className="size-5" />,
  UNIVERSITY: <School className="size-5" />,
  MEDICAL_CENTER: <HeartPulse className="size-5" />,
  HOSPITAL: <BriefcaseMedical className="size-5" />,
  CEMETERY: <Landmark className="size-5" />,
  RELIGIOUS_CENTER: <Landmark className="size-5" />,
  POLICE_STATION: <Shield className="size-5" />,
  POLICE_DEPARTMENT: <ShieldAlert className="size-5" />,
  CIVIL_DEFENSE: <ShieldAlert className="size-5" />,
  FIRE_STATION: <ShieldAlert className="size-5" />,
  GARBAGE_COLLECTION: <Trash2 className="size-5" />,
  BUS_STOP: <BusFront className="size-5" />,
  BUS_TERMINAL: <BusFront className="size-5" />,
  BUS_BRIDGE: <Route className="size-5" />,
}

type BuildGroup = { label: string; types: BuildingType[] }

const GROUPS: Record<string, BuildGroup[]> = {
  RESIDENTIAL: [
    { label: "Casas", types: ["HOUSE", "LOW_INCOME_HOUSE", "MIDDLE_INCOME_HOUSE", "HIGH_INCOME_HOUSE"] },
    { label: "Prédios", types: ["SMALL_APARTMENT", "LOW_INCOME_APARTMENT", "MIDDLE_INCOME_APARTMENT", "HIGH_INCOME_APARTMENT"] },
    { label: "Hotéis", types: [] },
  ],
  COMMERCIAL: [
    { label: "Comércio local", types: ["SHOP", "CLOTHING_STORE", "BUILDING_SUPPLY_STORE"] },
    { label: "Serviços e abastecimento", types: ["GROCERY_STORE", "GAS_STATION"] },
    { label: "Automóveis", types: ["CAR_DEALERSHIP"] },
    { label: "Edifícios comerciais", types: ["COMMERCIAL_BUILDING"] },
  ],
  INDUSTRIAL: [
    { label: "Fábricas", types: ["FACTORY", "CONSTRUCTION_FACTORY"] },
    { label: "Automobilística", types: ["AUTOMOTIVE_FACTORY"] },
    { label: "Tecnologia", types: ["TECH_FACTORY"] },
  ],
  SERVICES: [
    { label: "Coleta de lixo", types: ["GARBAGE_COLLECTION"] },
    { label: "Transporte", types: ["BUS_TERMINAL"] },
  ],
  INFRASTRUCTURE: [
    { label: "Vias", types: ["ROAD"] },
    { label: "Pontes", types: ["BRIDGE"] },
  ],
}

interface BuildMenuProps {
  state: ResourceState
  selected: BuildingType | null
  onSelect: (type: BuildingType | null) => void
}

export function BuildMenu({ state, selected, onSelect }: BuildMenuProps) {
  const [category, setCategory] = useState(CATEGORY_ORDER[0])
  const [groupLabel, setGroupLabel] = useState<string | null>(null)
  const groups = GROUPS[category] ?? []
  const activeGroup = groups.find((group) => group.label === groupLabel)
  const items = useMemo(() => BUILDING_LIST.filter((building) => activeGroup?.types.includes(building.type)), [activeGroup])

  function changeCategory(nextCategory: typeof category) {
    setCategory(nextCategory)
    setGroupLabel(null)
    onSelect(null)
  }

  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-border bg-card/90 p-3 shadow-lg shadow-black/30 backdrop-blur">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORY_ORDER.map((c) => (
          <button key={c} type="button" onClick={() => changeCategory(c)} className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", c === category ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-secondary-foreground")}>{CATEGORY_LABELS[c]}</button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {groupLabel && <button type="button" onClick={() => { setGroupLabel(null); onSelect(null) }} className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">← Categorias</button>}
        {(groupLabel ? [activeGroup].filter(Boolean) : groups).map((group) => group && (
          <button key={group.label} type="button" onClick={() => setGroupLabel(group.label)} className={cn("rounded-lg border px-2.5 py-1.5 text-xs font-medium", groupLabel === group.label ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/60 text-secondary-foreground hover:border-primary/50")}>{group.label}<span className="ml-1 text-muted-foreground">({group.types.length})</span></button>
        ))}
      </div>

      {groupLabel && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{items.map((def) => <BuildingCard key={def.type} def={def} icon={ICONS[def.type]} active={selected === def.type} canAfford={affordable(state, def.cost)} onClick={() => onSelect(selected === def.type ? null : def.type)} />)}</div>}
      {!groupLabel && <p className="px-1 text-xs text-muted-foreground">Escolha um grupo para ver as construções disponíveis.</p>}
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
