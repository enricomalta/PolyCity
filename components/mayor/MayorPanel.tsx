"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Banknote,
  GraduationCap,
  HeartPulse,
  Landmark,
  LifeBuoy,
  Percent,
  Save,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import type { CityPolicy, FundingLevel, PublicService } from "@/types/city"
import { useGame } from "@/hooks/useGame"
import { getBuilding } from "@/lib/game/buildings"
import { deriveBudget, deriveServiceIndices, SERVICE_LABELS } from "@/lib/game/economy"
import { cn } from "@/lib/utils"
import { FullScreenLoader } from "@/components/ui/loader"

const FUNDING_LABELS = ["Sem verba", "Baixa", "Média", "Máxima"] as const

const SERVICE_META: Record<
  PublicService,
  { icon: React.ReactNode; description: string }
> = {
  education: { icon: <GraduationCap className="size-5" />, description: "Escolas e formação dos cidadãos." },
  health: { icon: <HeartPulse className="size-5" />, description: "Hospitais e atendimento à população." },
  security: { icon: <ShieldAlert className="size-5" />, description: "Policiamento e ordem pública." },
  prevention: { icon: <LifeBuoy className="size-5" />, description: "Defesa civil e prevenção de desastres." },
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(n))
}

function indexTone(v: number): string {
  if (v >= 70) return "bg-primary"
  if (v >= 40) return "bg-accent"
  return "bg-destructive"
}

export function MayorPanel() {
  const { city, state, status, updatePolicy, pending } = useGame()

  // Local draft of the policy so the mayor can preview the impact before
  // committing. The authoritative values still come from the server on save.
  const [draft, setDraft] = useState<CityPolicy | null>(null)

  const policy = draft ?? state?.policy ?? null

  const { population, jobs } = useMemo(() => {
    let population = 0
    let jobs = 0
    for (const b of state?.buildings ?? []) {
      const def = getBuilding(b.type)
      population += def.population
      jobs += def.jobs
    }
    return { population, jobs }
  }, [state?.buildings])

  const preview = useMemo(() => {
    if (!policy) return null
    return {
      budget: deriveBudget(policy, population, jobs),
      services: deriveServiceIndices(policy, population),
    }
  }, [policy, population, jobs])

  if (status === "loading" || !state || !policy || !preview) {
    return <FullScreenLoader label="Abrindo o gabinete..." />
  }

  const dirty = draft !== null
  const { budget, services } = preview

  const setTax = (taxRate: number) => setDraft({ ...policy, taxRate })
  const setService = (service: PublicService, level: FundingLevel) =>
    setDraft({ ...policy, services: { ...policy.services, [service]: level } })

  const save = async () => {
    const ok = await updatePolicy(policy)
    if (ok) setDraft(null)
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Landmark className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold leading-tight text-balance">Gabinete do Prefeito</h1>
              <p className="text-sm text-muted-foreground">{city?.name ?? "Sua cidade"}</p>
            </div>
          </div>
          <Link
            href="/game"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" /> Voltar ao jogo
          </Link>
        </header>

        {/* Summary cards */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon={<Users className="size-4" />} label="População" value={formatMoney(population)} />
          <SummaryCard
            icon={<TrendingUp className="size-4" />}
            label="Arrecadação / mês"
            value={`$${formatMoney(budget.taxRevenue)}`}
            tone="good"
          />
          <SummaryCard
            icon={<TrendingDown className="size-4" />}
            label="Gastos / mês"
            value={`$${formatMoney(budget.serviceExpenses)}`}
            tone="bad"
          />
          <SummaryCard
            icon={<Banknote className="size-4" />}
            label="Saldo / mês"
            value={`${budget.net >= 0 ? "+" : "-"}$${formatMoney(Math.abs(budget.net))}`}
            tone={budget.net >= 0 ? "good" : "bad"}
          />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Taxes */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-card-foreground">
              <Percent className="size-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Imposto municipal</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Impostos mais altos rendem mais caixa, mas reduzem a felicidade dos cidadãos.
            </p>

            <div className="mt-6 flex items-end justify-between">
              <span className="font-display text-4xl font-bold tabular-nums text-primary">{policy.taxRate}%</span>
              <span className="text-xs text-muted-foreground">recomendado: 5% – 12%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={policy.taxRate}
              onChange={(e) => setTax(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
              aria-label="Alíquota de imposto"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
              <span>20%</span>
            </div>
          </div>

          {/* Public services */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-card-foreground">
              <Landmark className="size-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Verbas dos serviços públicos</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Destine verba para cada serviço. Mais verba melhora a qualidade e a felicidade.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              {(Object.keys(SERVICE_META) as PublicService[]).map((service) => (
                <ServiceRow
                  key={service}
                  icon={SERVICE_META[service].icon}
                  label={SERVICE_LABELS[service]}
                  description={SERVICE_META[service].description}
                  level={policy.services[service]}
                  index={services[service]}
                  onChange={(lvl) => setService(service, lvl)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-4 mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-lg shadow-black/30 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {dirty ? "Você tem alterações não salvas." : "Nenhuma alteração pendente."}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" />
            {pending ? "Salvando..." : "Salvar políticas"}
          </button>
        </div>
      </div>
    </main>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "default" | "good" | "bad"
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          tone === "good" && "bg-primary/15 text-primary",
          tone === "bad" && "bg-destructive/15 text-destructive",
          tone === "default" && "bg-secondary text-accent",
        )}
        aria-hidden
      >
        {icon}
      </div>
      <div className="mt-3 font-display text-xl font-bold tabular-nums text-card-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

function ServiceRow({
  icon,
  label,
  description,
  level,
  index,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  level: FundingLevel
  index: number
  onChange: (level: FundingLevel) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            {icon}
          </span>
          <div>
            <div className="font-display text-sm font-semibold text-card-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
        <span className="shrink-0 rounded-lg bg-card px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {FUNDING_LABELS[level]}
        </span>
      </div>

      {/* Quality index bar */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-card">
          <div
            className={cn("h-full rounded-full transition-all", indexTone(index))}
            style={{ width: `${index}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-card-foreground">
          {index}%
        </span>
      </div>

      {/* Funding level selector */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {([0, 1, 2, 3] as FundingLevel[]).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange(lvl)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
              lvl === level
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-card/70",
            )}
          >
            {FUNDING_LABELS[lvl]}
          </button>
        ))}
      </div>
    </div>
  )
}
