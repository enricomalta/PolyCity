"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Logo } from "@/components/brand/Logo"
import { GoogleButton } from "@/components/auth/GoogleButton"
import { FullScreenLoader } from "@/components/ui/loader"

export default function LoginPage() {
  const router = useRouter()
  const { status, error, loginWithGoogle, firebaseEnabled } = useAuth()
  const [busy, setBusy] = useState(false)

  // Once authenticated, send the player straight into the game.
  useEffect(() => {
    if (status === "authenticated") router.replace("/game")
  }, [status, router])

  if (status === "loading") return <FullScreenLoader label="Verificando sua sessão..." />

  const handleGoogle = async () => {
    setBusy(true)
    await loginWithGoogle()
    setBusy(false)
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <Image
          src="/polycity-hero.png"
          alt=""
          width={640}
          height={640}
          className="absolute -bottom-24 left-1/2 w-[28rem] -translate-x-1/2 opacity-30 [mask-image:radial-gradient(circle,black_40%,transparent_75%)]"
        />
      </div>

      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <div className="relative w-full max-w-sm rounded-3xl bg-card/70 p-8 shadow-2xl ring-1 ring-border backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <Logo className="text-2xl" />
          <h1 className="mt-6 font-display text-2xl font-bold">Entre para jogar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua identidade é gerenciada pelo Firebase. As regras do jogo ficam sempre no servidor.
          </p>
        </div>

        <div className="mt-8">
          <GoogleButton onClick={handleGoogle} loading={busy} />
          {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
        </div>

        {!firebaseEnabled && (
          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/80">
            Modo demonstração ativo — você entrará como convidado local.
          </p>
        )}
      </div>
    </main>
  )
}
