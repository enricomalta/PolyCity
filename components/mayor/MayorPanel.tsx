"use client"

import { useMemo, useState } from "react"
import {
  X,
  Banknote,
  Droplets,
  GraduationCap,
  HeartPulse,
  Landmark,
  LifeBuoy,
  Percent,
  Pencil,
  Save,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import type { CityPolicy, FundingLevel, PublicService, CitizenClass, SelectiveTax } from "@/types/city"
import { useGame } from "@/hooks/useGame"

interface MayorPanelProps {
  onClose?: () => void
}
import { getBuilding } from "@/lib/game/buildings"
import { deriveBudget, deriveServiceIndices, SERVICE_LABELS } from "@/lib/game/economy"
import { cn } from "@/lib/utils"
import { FullScreenLoader } from "@/components/ui/loader"

const FUNDING_LABELS = ["Sem verba", "Baixa", "Média", "Máxima"] as const
const FUNDING_PERCENTAGES = [0, 30, 50, 100] as const

const SERVICE_META: Record<
  PublicService,
  { icon: React.ReactNode; description: string }
> = {
  education: { icon: <GraduationCap className="size-5" />, description: "Escolas e formação dos cidadãos." },
  health: { icon: <HeartPulse className="size-5" />, description: "Hospitais e atendimento à população." },
  security: { icon: <ShieldAlert className="size-5" />, description: "Policiamento e ordem pública." },
  prevention: { icon: <LifeBuoy className="size-5" />, description: "Defesa civil e prevenção de desastres." },
  waste: { icon: <LifeBuoy className="size-5" />, description: "Coleta, limpeza e tratamento de resíduos." },
  transit: { icon: <TrendingUp className="size-5" />, description: "Transporte público e mobilidade urbana." },
  roads: { icon: <Landmark className="size-5" />, description: "Manutenção das estradas e rotas abertas." },
  sewage: { icon: <Droplets className="size-5" />, description: "Tratamento de esgoto e saneamento da cidade." },
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(n))
}

function indexTone(v: number): string {
  if (v >= 70) return "bg-primary"
  if (v >= 40) return "bg-accent"
  return "bg-destructive"
}

export function MayorPanel({ onClose }: MayorPanelProps) {
  const { city, state, status, updatePolicy, renameCity, pending } = useGame()
  const [cityName, setCityName] = useState(city?.name ?? "")
  const [editingName, setEditingName] = useState(false)
  const [activeSection, setActiveSection] = useState<"CABINET" | "JOBS" | "REAL_ESTATE" | "CONSUMPTION">("CABINET")

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

  const jobOpenings = useMemo(() => {
    const employedByBuilding = new Map<string, number>()
    for (const citizen of state?.citizens ?? []) {
      if (citizen.workplaceBuildingId) employedByBuilding.set(citizen.workplaceBuildingId, (employedByBuilding.get(citizen.workplaceBuildingId) ?? 0) + 1)
    }
    const byType = new Map<string, { title: string; salary: number; workers: number; openings: number; class: CitizenClass }>()
    for (const building of state?.buildings ?? []) {
      const def = getBuilding(building.type)
      if (def.jobs <= 0) continue
      const className = def.jobs >= 8 ? "LOW" : def.jobs >= 4 ? "MIDDLE" : "HIGH"
      const key = `${building.type}:${className}`
      const current = byType.get(key) ?? { title: `${def.name} — ${className === "LOW" ? "classe baixa" : className === "MIDDLE" ? "classe média" : "classe alta"}`, salary: policy?.prices.salary[className] ?? 0, workers: 0, openings: 0, class: className }
      current.workers += employedByBuilding.get(building.id) ?? 0
      current.openings += def.jobs
      byType.set(key, current)
    }
    return Array.from(byType.values())
  }, [state?.buildings, state?.citizens, policy?.prices.salary.MIDDLE])

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
  const utilityFunding = policy.utilityFunding ?? { energy: 2 as FundingLevel, sewage: 2 as FundingLevel }

  const individualTaxes = [
    ...Object.values(policy.classTaxRates),
    ...Object.values(policy.selectiveTaxes),
  ]
  const municipalTax = Math.round(individualTaxes.reduce((sum, value) => sum + value, 0) / individualTaxes.length)
  const setTax = (taxRate: number) => {
    const bounded = Math.max(0, Math.min(50, taxRate))
    setDraft({
      ...policy,
      taxRate: bounded,
      classTaxRates: { LOW: bounded, MIDDLE: bounded, HIGH: bounded },
      selectiveTaxes: { consumption: bounded, energy: bounded, water: bounded, fuel: bounded },
    })
  }
  const setClassTax = (group: CitizenClass, value: number) => {
    const classTaxRates = { ...policy.classTaxRates, [group]: Math.max(0, Math.min(50, value)) }
    const values = [...Object.values(classTaxRates), ...Object.values(policy.selectiveTaxes)]
    setDraft({ ...policy, classTaxRates, taxRate: Math.round(values.reduce((sum, tax) => sum + tax, 0) / values.length) })
  }
  const setSelectiveTax = (tax: SelectiveTax, value: number) => {
    const selectiveTaxes = { ...policy.selectiveTaxes, [tax]: Math.max(0, Math.min(50, value)) }
    const values = [...Object.values(policy.classTaxRates), ...Object.values(selectiveTaxes)]
    setDraft({ ...policy, selectiveTaxes, taxRate: Math.round(values.reduce((sum, current) => sum + current, 0) / values.length) })
  }
  const setService = (service: PublicService, level: FundingLevel) =>
    setDraft({ ...policy, services: { ...policy.services, [service]: level } })
  const exportingEnergy = (state.energyExport ?? 0) > 0
  const exportingWater = (state.waterExport ?? 0) > 0
  const importingEnergy = !exportingEnergy
  const importingSewage = !exportingWater
  const setUtilityFunding = (level: FundingLevel) => setDraft({ ...policy, utilityFunding: { ...utilityFunding, energy: level } })
  const setServiceFunding = (service: PublicService, level: FundingLevel) => {
    if (service === "sewage" && importingSewage) return
    setService(service, level)
  }

  const save = async () => {
    const ok = await updatePolicy(draft ?? policy)
    if (ok) setDraft(null)
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh max-w-[1500px] flex-col px-4 py-6 sm:px-8 sm:py-8">
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
          {onClose && (
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary">
              <X className="size-4" /> Fechar
            </button>
          )}
        </header>

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2" aria-label="Seções do gabinete">
          {([["CABINET", "Gabinete"], ["JOBS", "Empregos"], ["REAL_ESTATE", "Imobiliário"], ["CONSUMPTION", "Consumos"]] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setActiveSection(key)} className={cn("whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold", activeSection === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>{label}</button>)}
        </nav>
        {activeSection === "CABINET" && <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Nome da cidade</p>
              {!editingName && <p className="mt-1 text-lg font-semibold text-card-foreground">{city?.name ?? cityName}</p>}
            </div>
            {!editingName && <button type="button" onClick={() => setEditingName(true)} aria-label="Editar nome da cidade" className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><Pencil className="size-4" /></button>}
          </div>
          {editingName && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input id="city-name" autoFocus value={cityName} onChange={(event) => setCityName(event.target.value)} maxLength={40} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary focus:ring-2" /><button type="button" disabled={pending || !cityName.trim()} onClick={async () => { const ok = await renameCity(cityName); if (ok) setEditingName(false) }} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Salvar nome</button></div>}
        </section>}

        {/* Summary cards */}
        {activeSection === "CABINET" && <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        </section>}

        <div className={cn("mt-6 grid gap-6 lg:grid-cols-2", activeSection !== "CABINET" && "hidden")}>
          <div className="rounded-3xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center gap-2 text-card-foreground"><Banknote className="size-5 text-primary" /><h2 className="font-display text-lg font-semibold">Sistema político e impostos</h2></div>
            <p className="mt-1 text-sm text-muted-foreground">Modelo político e distribuição das alíquotas por classe e consumo.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border bg-background p-3"><p className="text-xs text-muted-foreground">Modelo econômico</p><p className="mt-1 font-semibold text-card-foreground">{policy.economicModel === "SANDBOX" ? "Sandbox" : policy.economicModel === "FREE_MARKET" ? "Livre mercado" : policy.economicModel === "PLANNED_ECONOMY" ? "Economia planejada" : policy.economicModel === "WELFARE_STATE" ? "Estado de bem-estar" : "Economia social de mercado"}</p></div><div className="rounded-xl border border-border bg-background p-3"><p className="text-xs text-muted-foreground">Ideologia</p><p className="mt-1 font-semibold text-card-foreground">{policy.ideology.replaceAll("_", " ")}</p></div></div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">{(["LOW", "MIDDLE", "HIGH"] as CitizenClass[]).map((group) => <label key={group} className="text-sm text-muted-foreground">{group === "LOW" ? "Baixa" : group === "MIDDLE" ? "Média" : "Alta"} · imposto %<input type="number" min={0} max={50} value={policy.classTaxRates[group]} onChange={(e) => setClassTax(group, Number(e.target.value))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-card-foreground" /></label>)}</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(["consumption", "energy", "water", "fuel"] as SelectiveTax[]).map((tax) => <label key={tax} className="text-sm text-muted-foreground">{tax === "consumption" ? "Consumo" : tax === "energy" ? "Energia" : tax === "water" ? "Água" : "Combustível"} · alíquota %<input type="number" min={0} max={50} value={policy.selectiveTaxes[tax]} onChange={(e) => setSelectiveTax(tax, Number(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-card-foreground" /></label>)}</div>
            <p className="mt-3 text-xs text-muted-foreground">Os impostos seletivos encarecem diretamente o custo de vida.</p>
          </div>
          {/* Taxes */}
          <div className="rounded-3xl border border-border bg-card p-6 lg:col-span-2">
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
              max={50}
              step={1}
              value={municipalTax}
              onChange={(e) => setTax(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
              aria-label="Alíquota de imposto"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Public services */}
          <div className="rounded-3xl border border-border bg-card p-6 lg:col-span-2">
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
                  description={service === "sewage" ? `${importingSewage ? "Importando tratamento" : "Exportando excedente de tratamento"} · Excedente exportável: ${state.waterExport ?? 0} · ${importingSewage ? "Verba fixa em 50%" : SERVICE_META[service].description}` : SERVICE_META[service].description}
                  level={service === "sewage" && importingSewage ? 2 : (policy.services[service] ?? 0) as FundingLevel}
                  index={service === "sewage" && importingSewage ? 50 : services[service] ?? (FUNDING_PERCENTAGES[policy.services[service] ?? 0] ?? 0)}
                  locked={service === "sewage" && importingSewage}
                  onChange={(lvl) => setServiceFunding(service, lvl)}
                />
              ))}
              <ServiceRow icon={<Zap className="size-5" />} label="Energia" description={`${importingEnergy ? "Importando energia" : "Exportando excedente de energia"} · Excedente exportável: ${state.energyExport ?? 0} · Verba ${importingEnergy ? "fixa em 50%" : "ajustável"}`} level={importingEnergy ? 2 : utilityFunding.energy} index={importingEnergy ? 50 : (FUNDING_PERCENTAGES[utilityFunding.energy] ?? 0)} locked={importingEnergy} onChange={setUtilityFunding} />
            </div>
          </div>
        </div>

        {activeSection !== "CABINET" && <section className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">{activeSection === "JOBS" ? "Empregos e salários" : activeSection === "REAL_ESTATE" ? "Ramo imobiliário" : "Consumos dos cidadãos"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{activeSection === "JOBS" ? "Salários médios e ocupação por setor." : activeSection === "REAL_ESTATE" ? "Configure aluguel e valores de compra por classe." : "Preços pagos pelos cidadãos, separados dos impostos."}</p>
          {activeSection === "JOBS" && <div className="mt-5 space-y-5"><div className="grid gap-3 sm:grid-cols-3">{(["LOW", "MIDDLE", "HIGH"] as CitizenClass[]).map((group) => <label key={group} className="text-sm text-muted-foreground">Salário {group === "LOW" ? "baixo" : group === "MIDDLE" ? "médio" : "alto"}<input type="number" min={1} value={policy.prices.salary[group]} onChange={(e) => setDraft({ ...policy, prices: { ...policy.prices, salary: { ...policy.prices.salary, [group]: Math.max(1, Number(e.target.value) || 1) } } })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-card-foreground" /></label>)}</div><div className="overflow-hidden rounded-2xl border border-border"><div className="grid grid-cols-[1fr_120px_100px] gap-3 bg-secondary/50 px-4 py-3 text-xs font-semibold text-muted-foreground"><span>Cargo</span><span>Salário</span><span>Trabalhadores</span></div>{jobOpenings.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Construa prédios comerciais ou industriais para criar cargos.</p> : jobOpenings.map((job) => <div key={job.title} className="grid grid-cols-[1fr_120px_100px] gap-3 border-t border-border px-4 py-3 text-sm"><span className="text-card-foreground">{job.title}</span><span className="text-muted-foreground">R$ {formatMoney(job.salary)}</span><span className="font-medium text-card-foreground">{job.workers}/{job.openings}</span></div>)}</div></div>}
          {activeSection === "REAL_ESTATE" && <div className="mt-5 grid gap-3 sm:grid-cols-3">{(["LOW", "MIDDLE", "HIGH"] as CitizenClass[]).map((group) => <label key={group} className="text-sm text-muted-foreground">Aluguel {group === "LOW" ? "baixo" : group === "MIDDLE" ? "médio" : "alto"}<input type="number" min={0} value={policy.prices.rent[group]} onChange={(e) => setDraft({ ...policy, prices: { ...policy.prices, rent: { ...policy.prices.rent, [group]: Math.max(0, Number(e.target.value) || 0) } } })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-card-foreground" /></label>)}</div>}
          {activeSection === "CONSUMPTION" && <div className="mt-5 grid gap-3 sm:grid-cols-5">{(["market", "water", "energy", "fuel", "transit"] as const).map((item) => <label key={item} className="text-sm text-muted-foreground">{item === "market" ? "Mercado" : item === "water" ? "Água" : item === "energy" ? "Energia" : item === "fuel" ? "Combustível" : "Transporte"}<input type="number" min={0} value={policy.prices.consumption[item]} onChange={(e) => setDraft({ ...policy, prices: { ...policy.prices, consumption: { ...policy.prices.consumption, [item]: Math.max(0, Number(e.target.value) || 0) } } })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-card-foreground" /></label>)}</div>}
        </section>}

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

function UtilityFundingRow({ label, description, level, locked, onChange }: { label: string; description: string; level: FundingLevel; locked: boolean; onChange: (level: FundingLevel) => void }) {
  return <div className="rounded-2xl border border-border bg-secondary/40 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-display text-sm font-semibold text-card-foreground">{label}</div><div className="text-xs text-muted-foreground">{description}</div></div><span className="rounded-lg bg-card px-2 py-1 text-xs font-medium text-muted-foreground">{FUNDING_LABELS[level]}</span></div><div className="mt-3 grid grid-cols-4 gap-1.5">{([0, 1, 2, 3] as FundingLevel[]).map((item) => <button key={item} type="button" disabled={locked} onClick={() => onChange(item)} className={cn("rounded-lg px-2 py-1.5 text-xs font-medium", item === level ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground", locked && "cursor-not-allowed opacity-60")}>{FUNDING_LABELS[item]}</button>)}</div></div>
}

function ServiceRow({
  icon,
  label,
  description,
  level,
  index,
  locked = false,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  level: FundingLevel
  index: number
  locked?: boolean
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
            disabled={locked}
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
