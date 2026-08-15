"use client"

import { Coins, Users, Smile, Zap, Droplets } from "lucide-react"
import type { ResourceState } from "@/types/city"
import { cn } from "@/lib/utils"

function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(n))
}

interface StatProps {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "default" | "good" | "bad"
}

function Stat({ icon, label, value, tone = "default" }: StatProps) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          tone === "good" && "bg-primary/15 text-primary",
          tone === "bad" && "bg-destructive/15 text-destructive",
          tone === "default" && "bg-secondary text-accent",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="leading-none">
        <div className="font-display text-base font-semibold tabular-nums text-card-foreground">
          {value}
        </div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

export function ResourceBar({ state }: { state: ResourceState }) {
  const energyTone = state.energy >= 0 ? "good" : "bad"
  const waterTone = state.water >= 0 ? "good" : "bad"
  const happinessTone = state.happiness >= 50 ? "good" : "bad"

  return (
    <div className="pointer-events-auto flex flex-wrap items-center divide-x divide-border rounded-2xl border border-border bg-card/90 shadow-lg shadow-black/30 backdrop-blur">
      <Stat
        icon={<Coins className="size-4" />}
        label="Dinheiro"
        value={`$${formatNumber(state.money)}`}
        tone="default"
      />
      <Stat
        icon={<Users className="size-4" />}
        label="População"
        value={formatNumber(state.population)}
      />
      <Stat
        icon={<Smile className="size-4" />}
        label="Felicidade"
        value={`${formatNumber(state.happiness)}%`}
        tone={happinessTone}
      />
      <Stat
        icon={<Zap className="size-4" />}
        label="Energia"
        value={`${state.energy >= 0 ? "+" : ""}${formatNumber(state.energy)}`}
        tone={energyTone}
      />
      <Stat
        icon={<Droplets className="size-4" />}
        label="Água"
        value={`${state.water >= 0 ? "+" : ""}${formatNumber(state.water)}`}
        tone={waterTone}
      />
    </div>
  )
}
