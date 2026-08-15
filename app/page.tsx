"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Play } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Logo } from "@/components/brand/Logo"
import { GoogleButton } from "@/components/auth/GoogleButton"
import { Spinner } from "@/components/ui/loader"

export default function LandingPage() {
  const router = useRouter()
  const { status, user, loginWithGoogle, firebaseEnabled } = useAuth()
  const [busy, setBusy] = useState(false)

  const handlePlay = () => {
    if (status === "authenticated") router.push("/game")
    else router.push("/login")
  }

  const handleGoogle = async () => {
    setBusy(true)
    await loginWithGoogle()
    setBusy(false)
    router.push("/game")
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      {/* Ambient backdrop: low-poly city art + soft glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-1/2 hidden w-[70%] max-w-4xl -translate-y-1/2 opacity-90 md:block">
          <Image
            src="/polycity-hero.png"
            alt=""
            width={1024}
            height={1024}
            priority
            className="h-auto w-full [mask-image:radial-gradient(circle_at_center,black_55%,transparent_85%)]"
          />
        </div>
        <div className="absolute -left-32 top-10 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 size-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent md:bg-gradient-to-r" />
      </div>

      <div className="relative flex min-h-svh flex-col">
        <header className="flex items-center justify-between px-6 py-6 md:px-12">
          <Logo className="text-xl" />
          {status === "authenticated" && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Bem-vindo, {user?.displayName ?? "Prefeito"}
            </span>
          )}
        </header>

        <section className="flex flex-1 items-center px-6 md:px-12">
          <div className="w-full max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border backdrop-blur">
              <span className="size-2 rounded-full bg-primary" />
              City builder 3D low-poly
            </p>

            <h1 className="text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Construa sua <span className="text-primary">cidade</span>.
              <br />
              Molde seu <span className="text-accent">mundo</span>.
            </h1>

            <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              PolyCity é um simulador de cidades no navegador. Trace estradas, erga bairros e mantenha seus cidadãos
              felizes em um mundo vivo e colorido.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:max-w-sm">
              {status === "loading" ? (
                <div className="flex h-14 items-center gap-3 text-muted-foreground">
                  <Spinner className="text-primary" /> Carregando sessão...
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePlay}
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/20 transition hover:brightness-105 active:scale-[0.99]"
                  >
                    <Play className="size-5 fill-current" />
                    JOGAR
                  </button>

                  {status !== "authenticated" && (
                    <>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        ou entre para salvar seu progresso
                        <span className="h-px flex-1 bg-border" />
                      </div>
                      <GoogleButton onClick={handleGoogle} loading={busy} />
                    </>
                  )}
                </>
              )}
            </div>

            {!firebaseEnabled && (
              <p className="mt-6 max-w-sm text-xs leading-relaxed text-muted-foreground/80">
                Modo demonstração: o Firebase ainda não foi configurado, então o login usa uma sessão local de
                convidado. Adicione as variáveis <code className="text-foreground/70">NEXT_PUBLIC_FIREBASE_*</code> para
                ativar o login com Google real.
              </p>
            )}
          </div>
        </section>

        <footer className="px-6 py-6 text-xs text-muted-foreground/70 md:px-12">
          PolyCity — protótipo single-player · arquitetura pronta para multiplayer
        </footer>
      </div>
    </main>
  )
}
