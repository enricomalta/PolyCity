"use client"

import {
  X,
  Users,
  Lock,
  Unlock,
} from "lucide-react"

import type { Building } from "@/types/city"
import type { Tile } from "@/types/game"
import { useGame } from "@/hooks/useGame"
import { getBuilding } from "@/lib/game/buildings"

import { Button } from "@/components/ui/button"

interface TileInspectorProps {
  tile: Tile | null
  building: Building | null
  onClose: () => void
  onVacate: (
    x: number,
    z: number,
  ) => void
  onCloseBuilding: (
    x: number,
    z: number,
  ) => void
  onOpenBuilding: (
    x: number,
    z: number,
  ) => void
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="font-medium tabular-nums text-card-foreground">
        {value}
      </span>
    </div>
  )
}

function isResidential(
  type: Building["type"],
): boolean {
  return [
    "HOUSE",
    "LOW_INCOME_HOUSE",
    "MIDDLE_INCOME_HOUSE",
    "HIGH_INCOME_HOUSE",
    "SMALL_APARTMENT",
    "LOW_INCOME_APARTMENT",
    "MIDDLE_INCOME_APARTMENT",
    "HIGH_INCOME_APARTMENT",
  ].includes(type)
}

function hasJobs(
  type: Building["type"],
): boolean {
  return [
    "SHOP",
    "COMMERCIAL_BUILDING",
    "GROCERY_STORE",
    "GAS_STATION",
    "CLOTHING_STORE",
    "CAR_DEALERSHIP",
    "BUILDING_SUPPLY_STORE",
    "FACTORY",
    "CONSTRUCTION_FACTORY",
    "AUTOMOTIVE_FACTORY",
    "TECH_FACTORY",
    "PARK",
    "POWER_PLANT",
    "WATER_TOWER",
    "SEWAGE_TREATMENT_PLANT",
    "ELEMENTARY_SCHOOL",
    "HIGH_SCHOOL",
    "UNIVERSITY",
    "MEDICAL_CENTER",
    "HOSPITAL",
    "CEMETERY",
    "RELIGIOUS_CENTER",
    "POLICE_STATION",
    "POLICE_DEPARTMENT",
    "CIVIL_DEFENSE",
    "FIRE_STATION",
    "GARBAGE_COLLECTION",
    "BUS_STOP",
    "BUS_TERMINAL",
    "BUS_BRIDGE",
  ].includes(type)
}

export function TileInspector({
  tile,
  building,
  onClose,
  onVacate,
  onCloseBuilding,
  onOpenBuilding,
}: TileInspectorProps) {
  if (!tile) {
    return null
  }

  const def = building
    ? getBuilding(building.type)
    : null

  const residential =
    building &&
    isResidential(building.type)

  const canVacate =
    residential &&
    building.occupied === true

  const { state } = useGame()
  const workerCount =
    building
      ? state?.citizens.filter(
          (citizen) =>
            citizen.workplaceBuildingId ===
            building.id &&
            citizen.employed,
        ).length ?? 0
      : 0
  return (
    <div className="pointer-events-auto w-64 rounded-2xl border border-border bg-card/95 p-4 shadow-lg shadow-black/30 backdrop-blur">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-card-foreground">
            {def
              ? def.name
              : "Terreno vazio"}
          </h3>

          <p className="text-xs text-muted-foreground">
            Tile {tile.x}, {tile.z}

            {!def && (
              <>
                {" — "}
                {terrainLabel(tile.terrain)}
              </>
            )}
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
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            {def.description}
          </p>

          <div className="divide-y divide-border rounded-xl bg-secondary/50 px-3">
            {def.population > 0 && (
              <Detail
                label="População"
                value={`+${def.population}`}
              />
            )}

            {def.jobs > 0 && (
              <Detail
                label="Empregos"
                value={`+${def.jobs}`}
              />
            )}

            {def.happiness !== 0 && (
              <Detail
                label="Felicidade"
                value={`${
                  def.happiness > 0
                    ? "+"
                    : ""
                }${def.happiness}`}
              />
            )}

            {def.energyProduction > 0 && (
              <Detail
                label="Energia"
                value={`+${def.energyProduction}`}
              />
            )}

            {def.energyConsumption > 0 && (
              <Detail
                label="Consumo energia"
                value={`-${def.energyConsumption}`}
              />
            )}

            {def.waterProduction > 0 && (
              <Detail
                label="Água"
                value={`+${def.waterProduction}`}
              />
            )}

            {def.waterConsumption > 0 && (
              <Detail
                label="Consumo água"
                value={`-${def.waterConsumption}`}
              />
            )}

            {residential && (
              <Detail
                label="Ocupação"
                value={
                  building.occupied
                    ? "Ocupada"
                    : "Desocupada"
                }
              />
            )}

          {building &&
            hasJobs(building.type) && (
              <Detail
                label="Empregos"
                value={`${workerCount}/${def.jobs}`}
              />
            )}

            {building?.type === "ROAD" && (
              <Detail
                label="Estado de conservação"
                value="Boa"
              />
            )}

            {building && (
              <Detail
                label="Rotação"
                value={`${building.rotation * 90}°`}
              />
            )}

            {building && (
              <Detail
                label="Estado"
                value={
                  building.closed
                    ? "Fechada"
                    : "Ativa"
                }
              />
            )}
          </div>

          {building && (
            <div className="mt-3 flex flex-col gap-2">
              {canVacate && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    onVacate(
                      building.x,
                      building.z,
                    )
                  }
                >
                  <Users className="size-4" />
                  Desocupar
                </Button>
              )}

              {building.closed ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    onOpenBuilding(
                      building.x,
                      building.z,
                    )
                  }
                >
                  <Unlock className="size-4" />
                  Abrir
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    onCloseBuilding(
                      building.x,
                      building.z,
                    )
                  }
                >
                  <Lock className="size-4" />
                  Fechar
                </Button>
              )}

            </div>
          )}
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Selecione uma construção no
          menu inferior e clique aqui para
          edificar.
        </p>
      )}
    </div>
  )
}

function terrainLabel(
  terrain: Tile["terrain"],
): string {
  switch (terrain) {
    case "WATER":
      return "Água"

    case "ROCK":
      return "Rocha"

    case "SAND":
      return "Areia"

    case "FOREST":
      return "Árvore"

    case "GRASS":
      return "Grama"

    default:
      return "Terreno"
  }
}
