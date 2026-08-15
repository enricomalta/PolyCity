"use client"

import { useState } from "react"
import Link from "next/link"
import { LogOut, ChevronDown, Landmark } from "lucide-react"
import type { User } from "@/types/auth"
import { Logo } from "@/components/brand/Logo"
import { cn } from "@/lib/utils"

interface TopBarProps {
  cityName: string
  user: User | null
  onLogout: () => void
}

export function TopBar({ cityName, user, onLogout }: TopBarProps) {
  const [open, setOpen] = useState(false)
  const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase()

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-card/90 py-1.5 pl-3 pr-1.5 shadow-lg shadow-black/30 backdrop-blur">
      <Logo className="hidden sm:flex" />
      <div className="hidden h-6 w-px bg-border sm:block" />
      <div className="min-w-0 pr-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Cidade</div>
        <div className="truncate font-display text-sm font-semibold text-card-foreground">
          {cityName}
        </div>
      </div>

      <Link
        href="/game/mayor"
        className="ml-auto flex items-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/25"
      >
        <Landmark className="size-4" />
        <span className="hidden sm:block">Gabinete</span>
      </Link>

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
  )
}
