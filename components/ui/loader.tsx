import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/Logo"

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  )
}

// Full-screen branded loader used between routes and while heavy assets load.
export function FullScreenLoader({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background">
      <div className="animate-pulse">
        <Logo className="text-3xl" />
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <Spinner className="text-primary" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}
