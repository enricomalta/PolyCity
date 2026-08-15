"use client"

import { X, Trash2 } from "lucide-react"
import type { Building } from "@/types/city"
import type { Tile } from "@/types/game"
import { getBuilding } from "@/lib/game/buildings"
import { Button } from "@/components/ui/button"

interface TileInspectorProps {
  tile: Tile | null
  building: Building | null
  onClose: () => void
  onDemolish: (x: number, z: number) => void
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-card-foreground">{value}</span>
    </div>
  )
}

export function TileInspector({ tile, building, onClose, onDemolish }: TileInspectorProps) {
  if (!tile) return null

  const def = building ? getBuilding(building.type) : null

  return (
    <div className="pointer-events-auto w-64 rounded-2xl border border-border bg-card/95 p-4 shadow-lg shadow-black/30 backdrop-blur">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-card-foreground">
            {def ? def.name : "Terreno vazio"}
          </h3>
          <p className="text-xs text-muted-foreground">
            Tile {tile.x}, {tile.z} — {terrainLabel(tile.terrain)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-card-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {def ? (
        <>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{def.description}</p>
          <div className="divide-y divide-border rounded-xl bg-secondary/50 px-3">
            {def.population > 0 && <Detail label="População" value={`+${def.population}`} />}
            {def.jobs > 0 && <Detail label="Empregos" value={`+${def.jobs}`} />}
            {def.happiness !== 0 && (
              <Detail label="Felicidade" value={`${def.happiness > 0 ? "+" : ""}${def.happiness}`} />
            )}
            {def.energyProduction > 0 && <Detail label="Energia" value={`+${def.energyProduction}`} />}
            {def.energyConsumption > 0 && <Detail label="Consumo energia" value={`-${def.energyConsumption}`} />}
            {def.waterProduction > 0 && <Detail label="Água" value={`+${def.waterProduction}`} />}
            {def.waterConsumption > 0 && <Detail label="Consumo água" value={`-${def.waterConsumption}`} />}
          </div>
          {building && (
            <Button
              variant="destructive"
              className="mt-3 w-full"
              onClick={() => onDemolish(building.x, building.z)}
            >
              <Trash2 className="mr-1.5 size-4" />
              Demolir
            </Button>
          )}
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Selecione uma construção no menu inferior e clique aqui para edificar.
        </p>
      )}
    </div>
  )
}

function terrainLabel(t: Tile["terrain"]): string {
  switch (t) {
    case "WATER":
      return "Água"
    case "ROCK":
      return "Rocha"
    default:
      return "Grama"
  }
}
