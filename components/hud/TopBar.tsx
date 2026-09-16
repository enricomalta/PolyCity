"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { LogOut, ChevronDown, UserRound, Link2 } from "lucide-react"
import type { User } from "@/types/auth"
import { Logo } from "@/components/brand/Logo"
import { cn } from "@/lib/utils"

interface TopBarProps {
  cityName: string
  user: User | null
  onLogout: () => void
  onRename: (name: string) => Promise<void>
  onLinkGoogle: () => Promise<void>
}

export function TopBar({ cityName, user, onLogout, onRename, onLinkGoogle }: TopBarProps) {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [name, setName] = useState(user?.displayName ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [renameConfirmOpen, setRenameConfirmOpen] = useState(false)
  const rename = async () => {
    if (user?.isRenamed || name.trim().length < 2) return
    setRenameConfirmOpen(true)
  }
  const confirmRename = async () => {
    setBusy(true)
    setError(null)
    try { await onRename(name.trim()); setRenameConfirmOpen(false); setProfileOpen(false) } catch { setError("Não foi possível atualizar o nome.") } finally { setBusy(false) }
  }
  const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase()

  return (
    <>
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-card/90 py-1.5 pl-3 pr-1.5 shadow-lg shadow-black/30 backdrop-blur">
      <Logo className="hidden sm:flex" />
      <div className="hidden h-6 w-px bg-border sm:block" />
      <div className="min-w-0 pr-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Cidade</div>
        <div className="truncate font-display text-sm font-semibold text-card-foreground">
          {cityName}
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-secondary py-1.5 pl-1.5 pr-2 text-left transition-colors hover:bg-secondary/70"
        >
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL || "/placeholder.svg"}
              alt=""
              className="size-7 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-xs font-semibold text-primary">
              {initial}
            </span>
          )}
          <span className="hidden max-w-28 truncate text-sm text-card-foreground sm:block">
            {user?.displayName ?? "Prefeito"}
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-border bg-popover p-4 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between"><h2 className="font-semibold text-popover-foreground">Perfil do prefeito</h2><button type="button" onClick={() => setProfileOpen(false)} aria-label="Fechar perfil" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="size-4" /></button></div>
            <p className="mt-1 text-xs text-muted-foreground">Você só poderá alterar este nome uma vez.</p>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" aria-label="Nome do prefeito" />
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            <button type="button" disabled={busy || user?.isRenamed === true} onClick={() => void rename()} className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Salvando..." : "Alterar nome"}</button>
          </div>
        )}
        {open && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/40">
              <div className="border-b border-border px-3 py-2">
                <div className="truncate text-sm font-medium text-popover-foreground">
                  {user?.displayName ?? "Prefeito"}
                </div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <button type="button" onClick={() => { setOpen(false); setProfileOpen(true) }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-secondary"><UserRound className="size-4" /> Perfil</button>
              {user?.isAnonymous && <button type="button" onClick={() => void onLinkGoogle()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-secondary"><Link2 className="size-4" /> Vincular Google</button>}
              <button
                type="button"
                onClick={onLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-secondary"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    {renameConfirmOpen && <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold text-card-foreground">Confirmar alteração</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">O nome do prefeito só pode ser alterado uma vez. Depois da confirmação, essa alteração não poderá ser solicitada novamente.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setRenameConfirmOpen(false)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">Cancelar</button><button type="button" disabled={busy} onClick={() => void confirmRename()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Salvando..." : "Confirmar"}</button></div></div></div>}
    </>
  )
}
