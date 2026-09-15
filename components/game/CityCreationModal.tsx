"use client"

import { useState } from "react"
import { Landmark, Sparkles } from "lucide-react"
import type { PoliticalIdeology } from "@/types/city"
import { apiGameService } from "@/services/game/apiGameService"

const IDEOLOGIES: { value: PoliticalIdeology; label: string; description: string }[] = [
  { value: "SOCIAL_DEMOCRACY", label: "Social-democracia", description: "Serviços públicos fortes e impostos progressivos." },
  { value: "LIBERALISM", label: "Liberalismo", description: "Menos impostos, mais liberdade econômica." },
  { value: "CONSERVATISM", label: "Conservadorismo", description: "Ordem, tradição e responsabilidade fiscal." },
  { value: "ECOLOGISM", label: "Ecologismo", description: "Sustentabilidade como prioridade de governo." },
  { value: "LIBERTARIANISM", label: "Libertarianismo", description: "Estado enxuto e máxima autonomia individual." },
  { value: "SOCIALISM", label: "Socialismo", description: "Redistribuição de renda e serviços universais." },
  { value: "NEOLIBERALISM", label: "Neoliberalismo", description: "Mercado aberto e redução da intervenção estatal." },
  { value: "WELFARE_STATE", label: "Estado de bem-estar", description: "Proteção social ampla e investimento público." },
  { value: "FISCAL_AUSTERITY", label: "Austeridade fiscal", description: "Equilíbrio orçamental antes de novas despesas." },
  { value: "DEVELOPMENTALISM", label: "Desenvolvimentismo", description: "Obras e indústria para acelerar o crescimento." },
  { value: "ECO_SOCIALISM", label: "Ecossocialismo", description: "Igualdade social com transição ecológica." },
  { value: "STATE_CAPITALISM", label: "Capitalismo de Estado", description: "Estado lidera setores estratégicos da economia." },
  { value: "PROGRESSIVISM", label: "Progressismo", description: "Direitos civis, inclusão e inovação social." },
  { value: "TECHNOCRACY", label: "Tecnocracia", description: "Decisões guiadas por dados e especialistas." },
]

export function CityCreationModal({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("")
  const [ideology, setIdeology] = useState<PoliticalIdeology>("SOCIAL_DEMOCRACY")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const create = async () => {
    if (name.trim().length < 2) return setError("Escolha um nome com pelo menos 2 caracteres.")
    setPending(true)
    setError(null)
    try {
      await apiGameService.createCity("me", { name: name.trim(), ideology })
      onCreated()
    } catch {
      setError("Não foi possível criar a cidade. Tente novamente.")
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Landmark /></span>
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Novo mandato</p><h1 className="mt-1 font-display text-3xl font-bold">Crie a identidade da sua cidade</h1><p className="mt-2 text-sm text-muted-foreground">O modelo político escolhido aqui orientará impostos, serviços e a opinião dos moradores.</p></div>
        </div>
        <label className="mt-8 block text-sm font-semibold" htmlFor="new-city-name">Nome da cidade<input id="new-city-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Aurora" maxLength={40} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none ring-primary focus:ring-2" /></label>
        <div className="mt-6"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" />Ideologia inicial</div><div className="mt-3 grid max-h-[42vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">{IDEOLOGIES.map((item) => <button key={item.value} type="button" onClick={() => setIdeology(item.value)} className={`rounded-2xl border p-4 text-left transition ${ideology === item.value ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-secondary"}`}><div className="font-semibold">{item.label}</div><div className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</div></button>)}</div></div>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <button type="button" onClick={() => void create()} disabled={pending || name.trim().length < 2} className="mt-8 w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Criando cidade..." : "Criar cidade e abrir gabinete"}</button>
      </section>
    </main>
  )
}
